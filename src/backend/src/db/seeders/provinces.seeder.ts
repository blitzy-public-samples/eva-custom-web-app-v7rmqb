// @ts-check
import { QueryRunner } from 'typeorm'; // ^0.3.0
import { createLogger, format, transports } from 'winston'; // ^3.0.0
import { dataSource } from '../../config/database';
import crypto from 'crypto';

// Initialize logger for seeding operations
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'province-seeder.log' }),
    new transports.Console()
  ]
});

// Schema version for data integrity tracking
const PROVINCE_SCHEMA_VERSION = '2024.1';

// Data integrity configuration
const DATA_INTEGRITY_CONFIG = {
  checksumAlgorithm: 'sha256',
  backupEnabled: true,
  validationRules: ['complete_metadata', 'valid_references', 'unique_codes']
};

interface ProvinceData {
  code: string;
  name: string;
  metadata: {
    estateLaws: string;
    probateRequired: boolean;
    version: string;
    lastUpdated: string;
    checksum: string;
    legalRequirements: {
      willsRegistry: boolean;
      probateThreshold: number;
      executorRequirements: string[];
    };
  };
}

// Comprehensive Canadian province data with enhanced metadata
const PROVINCES: ProvinceData[] = [
  {
    code: 'ON',
    name: 'Ontario',
    metadata: {
      estateLaws: 'Ontario Estate Administration Act',
      probateRequired: true,
      version: PROVINCE_SCHEMA_VERSION,
      lastUpdated: '2024-02-15T00:00:00Z',
      checksum: '',
      legalRequirements: {
        willsRegistry: true,
        probateThreshold: 50000,
        executorRequirements: ['age_19_plus', 'resident_canadian']
      }
    }
  },
  {
    code: 'BC',
    name: 'British Columbia',
    metadata: {
      estateLaws: 'Wills, Estates and Succession Act',
      probateRequired: true,
      version: PROVINCE_SCHEMA_VERSION,
      lastUpdated: '2024-02-15T00:00:00Z',
      checksum: '',
      legalRequirements: {
        willsRegistry: true,
        probateThreshold: 25000,
        executorRequirements: ['age_19_plus', 'resident_canadian']
      }
    }
  },
  {
    code: 'AB',
    name: 'Alberta',
    metadata: {
      estateLaws: 'Wills and Succession Act',
      probateRequired: true,
      version: PROVINCE_SCHEMA_VERSION,
      lastUpdated: '2024-02-15T00:00:00Z',
      checksum: '',
      legalRequirements: {
        willsRegistry: false,
        probateThreshold: 75000,
        executorRequirements: ['age_18_plus', 'resident_canadian']
      }
    }
  }
  // Additional provinces...
];

/**
 * Validates province data integrity before seeding
 * @param provinces - Array of province data to validate
 * @returns Promise<boolean> - Validation result
 */
export async function validateProvinceData(provinces: ProvinceData[]): Promise<boolean> {
  try {
    // Check for required fields
    const requiredFields: Array<keyof ProvinceData> = ['code', 'name', 'metadata'];
    const requiredMetadata: Array<keyof ProvinceData['metadata']> = ['estateLaws', 'probateRequired', 'version', 'lastUpdated', 'legalRequirements'];

    for (const province of provinces) {
      // Validate basic structure
      if (!requiredFields.every(field => province[field])) {
        throw new Error(`Missing required field in province: ${province.code}`);
      }

      // Validate metadata structure
      if (!requiredMetadata.every(field => province.metadata[field])) {
        throw new Error(`Missing required metadata in province: ${province.code}`);
      }

      // Validate province code format
      if (!/^[A-Z]{2}$/.test(province.code)) {
        throw new Error(`Invalid province code format: ${province.code}`);
      }

      // Generate and set checksum
      province.metadata.checksum = crypto
        .createHash(DATA_INTEGRITY_CONFIG.checksumAlgorithm)
        .update(JSON.stringify({ ...province, metadata: { ...province.metadata, checksum: '' } }))
        .digest('hex');
    }

    // Validate unique codes
    const codes = provinces.map(p => p.code);
    if (new Set(codes).size !== codes.length) {
      throw new Error('Duplicate province codes detected');
    }

    return true;
  } catch (error) {
    logger.error('Province data validation failed:', { error: (error as Error).message });
    return false;
  }
}

/**
 * Seeds the database with Canadian province information
 * Implements comprehensive data integrity and versioning
 */
export async function seedProvinces(): Promise<void> {
  let queryRunner: QueryRunner | null = null;

  try {
    // Validate province data before proceeding
    const isValid = await validateProvinceData(PROVINCES);
    if (!isValid) {
      throw new Error('Province data validation failed');
    }

    // Initialize database connection
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    logger.info('Starting province data seeding', {
      version: PROVINCE_SCHEMA_VERSION,
      timestamp: new Date().toISOString()
    });

    // Backup existing data if enabled
    if (DATA_INTEGRITY_CONFIG.backupEnabled) {
      await queryRunner.manager.query('SELECT * FROM provinces');
      await queryRunner.manager.query(
        'INSERT INTO provinces_backup SELECT *, NOW() as backup_date FROM provinces'
      );
      logger.info('Created backup of existing province data');
    }

    // Clear existing province data
    await queryRunner.manager.query('DELETE FROM provinces');

    // Insert province records with enhanced metadata
    for (const province of PROVINCES) {
      await queryRunner.manager.query(
        `INSERT INTO provinces (code, name, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [province.code, province.name, JSON.stringify(province.metadata)]
      );
    }

    // Verify data integrity after insertion
    const insertedData = await queryRunner.manager.query('SELECT * FROM provinces');
    for (const record of insertedData) {
      const originalProvince = PROVINCES.find(p => p.code === record.code);
      if (originalProvince?.metadata.checksum !== record.metadata.checksum) {
        throw new Error(`Data integrity check failed for province: ${record.code}`);
      }
    }

    // Commit transaction
    await queryRunner.commitTransaction();

    logger.info('Province data seeding completed successfully', {
      recordCount: PROVINCES.length,
      version: PROVINCE_SCHEMA_VERSION,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Rollback transaction on error
    if (queryRunner?.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }

    logger.error('Province data seeding failed:', {
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });

    throw error;
  } finally {
    // Release query runner
    if (queryRunner) {
      await queryRunner.release();
    }
  }
}