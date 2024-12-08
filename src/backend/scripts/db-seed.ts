/**
 * Estate Kit - Database Seeder
 * Version: 1.0.0
 * 
 * Human Tasks:
 * 1. Ensure database connection parameters are properly configured in environment variables
 * 2. Verify that the seeding process is included in the deployment pipeline
 * 3. Run this script after database initialization and before application deployment
 * 4. Monitor logs to ensure successful seeding of all required data
 */

// @package sequelize v6.31.0
import { seedRoles } from '../db/seeders/roles.seeder';
import { seedProvinces } from '../db/seeders/provinces.seeder';
import { initializeDatabase } from '../config/database';
import { logInfo } from '../utils/logger.util';

/**
 * Seeds the database with predefined roles, provinces, and other essential data.
 * 
 * Requirements Addressed:
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Seeds predefined roles to enable secure and granular access control.
 * - Province-Specific Resource Delivery (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 *   Seeds the database with Canadian provinces for jurisdiction-specific guidance.
 * 
 * @returns Promise<void> Resolves when the seeding process is complete
 * @throws Error if any part of the seeding process fails
 */
export const seedDatabase = async (): Promise<void> => {
  try {
    // Initialize database connection
    await initializeDatabase();
    logInfo('Database connection initialized for seeding process');

    // Seed roles
    logInfo('Starting role seeding process...');
    await seedRoles();
    logInfo('Role seeding completed successfully');

    // Seed provinces
    logInfo('Starting province seeding process...');
    await seedProvinces();
    logInfo('Province seeding completed successfully');

    logInfo('Database seeding process completed successfully');

  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error during database seeding';
    
    throw new Error(`Database seeding failed: ${errorMessage}`);
  }
};

// Execute seeding if this script is run directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logInfo('Database seeding completed. Exiting process.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database seeding failed:', error);
      process.exit(1);
    });
}