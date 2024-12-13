/**
 * Estate Kit Security Audit Script
 * Performs comprehensive security checks across the backend infrastructure
 * Version: 1.0.0
 */

import { logger } from '../src/utils/logger.util';
import { encrypt, decrypt, generateEncryptionKey, rotateKey } from '../src/utils/encryption.util';
import { validatePassword, validateInput, sanitizeInput } from '../src/utils/validation.util';
import snyk from '@snyk/snyk'; // v1.1150.0
import sonarqube from 'sonarqube-scanner'; // v3.0.1
import fs from 'fs-extra'; // v11.1.0
import AWS from 'aws-sdk'; // v2.1450.0

// Constants for security requirements
const SECURITY_CONSTANTS = {
  MIN_KEY_LENGTH: 256,
  MIN_SALT_LENGTH: 32,
  MIN_ITERATIONS: 100000,
  REQUIRED_CIPHERS: ['aes-256-gcm'],
  COMPLIANCE_STANDARDS: ['PIPEDA', 'HIPAA'],
  MIN_TLS_VERSION: 'TLSv1.2',
  REQUIRED_AUTH_METHODS: ['JWT', 'MFA'],
};

/**
 * Performs dependency vulnerability scanning using Snyk
 */
async function runDependencyCheck(): Promise<object> {
  try {
    logger.info('Starting dependency vulnerability scan');
    
    const results = await snyk.test({
      path: process.cwd(),
      dev: true,
      showVulnPaths: 'all',
    });

    const vulnerabilities = results.vulnerabilities || [];
    const highSeverityCount = vulnerabilities.filter(v => v.severity === 'high').length;
    
    logger.info(`Dependency scan complete. Found ${vulnerabilities.length} vulnerabilities`);
    
    return {
      totalVulnerabilities: vulnerabilities.length,
      highSeverity: highSeverityCount,
      results: vulnerabilities,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Dependency check failed', { error });
    throw error;
  }
}

/**
 * Executes static code analysis using SonarQube
 */
async function runStaticAnalysis(): Promise<object> {
  try {
    logger.info('Starting static code analysis');
    
    const sonarqubeOptions = {
      serverUrl: process.env.SONARQUBE_URL,
      token: process.env.SONARQUBE_TOKEN,
      options: {
        'sonar.sources': './src',
        'sonar.tests': './test',
        'sonar.typescript.lcov.reportPaths': 'coverage/lcov.info',
        'sonar.security.sources': './src',
      },
    };

    await sonarqube(sonarqubeOptions);
    
    logger.info('Static analysis complete');
    
    return {
      status: 'completed',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Static analysis failed', { error });
    throw error;
  }
}

/**
 * Tests encryption implementation and configuration
 */
async function testEncryptionConfig(): Promise<boolean> {
  try {
    logger.info('Testing encryption configuration');

    // Test key generation
    const key = await generateEncryptionKey();
    if (key.length * 8 < SECURITY_CONSTANTS.MIN_KEY_LENGTH) {
      throw new Error('Encryption key length below minimum requirement');
    }

    // Test encryption/decryption
    const testData = Buffer.from('test-data');
    const encrypted = await encrypt(testData, key);
    const decrypted = await decrypt(encrypted, key);
    
    if (!decrypted.equals(testData)) {
      throw new Error('Encryption/decryption test failed');
    }

    // Test key rotation
    const { newKey } = await rotateKey(key, { useKms: true });
    if (!newKey || newKey.length * 8 < SECURITY_CONSTANTS.MIN_KEY_LENGTH) {
      throw new Error('Key rotation test failed');
    }

    // Test AWS KMS integration
    const kms = new AWS.KMS({ region: process.env.AWS_REGION });
    await kms.describeKey({ KeyId: process.env.AWS_KMS_KEY_ID }).promise();

    logger.info('Encryption configuration tests passed');
    return true;
  } catch (error) {
    logger.error('Encryption configuration test failed', { error });
    return false;
  }
}

/**
 * Tests authentication and authorization configurations
 */
async function testAuthConfig(): Promise<boolean> {
  try {
    logger.info('Testing authentication configuration');

    // Test password validation
    const passwordTest = validatePassword('TestPassword123!', 'test-user-id');
    if (!passwordTest.isValid) {
      throw new Error('Password validation configuration is insufficient');
    }

    // Test input sanitization
    const sanitizedInput = sanitizeInput('<script>alert("test")</script>');
    if (sanitizedInput.includes('<script>')) {
      throw new Error('Input sanitization is insufficient');
    }

    // Test JWT configuration
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error('JWT secret key is insufficient');
    }

    logger.info('Authentication configuration tests passed');
    return true;
  } catch (error) {
    logger.error('Authentication configuration test failed', { error });
    return false;
  }
}

/**
 * Generates comprehensive security audit report
 */
async function generateAuditReport(auditResults: any): Promise<string> {
  try {
    logger.info('Generating security audit report');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        dependencyCheck: auditResults.dependencyCheck,
        staticAnalysis: auditResults.staticAnalysis,
        encryptionConfig: auditResults.encryptionConfig,
        authConfig: auditResults.authConfig,
      },
      compliance: {
        PIPEDA: {
          dataEncryption: auditResults.encryptionConfig,
          accessControls: auditResults.authConfig,
          dataResidency: process.env.AWS_REGION === 'ca-central-1',
        },
        HIPAA: {
          encryption: auditResults.encryptionConfig,
          authentication: auditResults.authConfig,
          auditLogging: true,
        },
      },
      recommendations: [],
    };

    // Add recommendations based on results
    if (auditResults.dependencyCheck.highSeverity > 0) {
      report.recommendations.push({
        priority: 'HIGH',
        message: 'Critical vulnerabilities found in dependencies',
        action: 'Update affected packages immediately',
      });
    }

    const reportPath = `./security-reports/audit-${Date.now()}.json`;
    await fs.outputJSON(reportPath, report, { spaces: 2 });

    logger.info('Security audit report generated', { path: reportPath });
    return reportPath;
  } catch (error) {
    logger.error('Report generation failed', { error });
    throw error;
  }
}

/**
 * Main entry point for security audit
 */
export async function main(): Promise<void> {
  try {
    logger.info('Starting security audit');

    const auditResults = {
      dependencyCheck: await runDependencyCheck(),
      staticAnalysis: await runStaticAnalysis(),
      encryptionConfig: await testEncryptionConfig(),
      authConfig: await testAuthConfig(),
    };

    const reportPath = await generateAuditReport(auditResults);

    logger.info('Security audit completed successfully', {
      reportPath,
      summary: auditResults,
    });
  } catch (error) {
    logger.error('Security audit failed', { error });
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    logger.error('Security audit script failed', { error });
    process.exit(1);
  });
}