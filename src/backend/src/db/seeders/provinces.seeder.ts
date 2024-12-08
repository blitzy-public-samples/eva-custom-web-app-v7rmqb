/**
 * Estate Kit - Provinces Seeder
 * Version: 1.0.0
 * 
 * This file seeds the database with initial data for Canadian provinces.
 * 
 * Requirements Addressed:
 * - Province-Specific Resource Delivery (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 *   Provides jurisdiction-specific guidance for Canadian provinces.
 * 
 * Human Tasks:
 * 1. Verify that the list of provinces and their codes matches official Canadian standards
 * 2. Ensure database connection parameters are properly configured in environment variables
 * 3. Run this seeder after database initialization and before application deployment
 */

import { Pool } from 'pg'; // pg v8.10.0
import { initializeDatabase } from '../config/database';
import { logInfo, logError } from '../../utils/logger.util';

/**
 * List of Canadian provinces and territories with their official codes
 * Implements requirement: Province-Specific Resource Delivery
 */
const PROVINCES = [
  { name: 'Ontario', code: 'ON' },
  { name: 'Quebec', code: 'QC' },
  { name: 'British Columbia', code: 'BC' },
  { name: 'Alberta', code: 'AB' },
  { name: 'Manitoba', code: 'MB' },
  { name: 'Saskatchewan', code: 'SK' },
  { name: 'Nova Scotia', code: 'NS' },
  { name: 'New Brunswick', code: 'NB' },
  { name: 'Newfoundland and Labrador', code: 'NL' },
  { name: 'Prince Edward Island', code: 'PE' },
  { name: 'Northwest Territories', code: 'NT' },
  { name: 'Yukon', code: 'YT' },
  { name: 'Nunavut', code: 'NU' }
];

/**
 * Seeds the database with Canadian provinces data
 * Implements requirement: Province-Specific Resource Delivery
 * 
 * @returns Promise<boolean> True if seeding is successful, false otherwise
 */
export const seedProvinces = async (): Promise<boolean> => {
  let pool: Pool | null = null;
  
  try {
    // Initialize database connection
    pool = initializeDatabase();
    
    logInfo('Starting provinces seeding process');

    // Create provinces table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS provinces (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code CHAR(2) NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert provinces data
    for (const province of PROVINCES) {
      const insertQuery = `
        INSERT INTO provinces (name, code)
        VALUES ($1, $2)
        ON CONFLICT (code) DO UPDATE
        SET name = EXCLUDED.name,
            updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `;

      const result = await pool.query(insertQuery, [province.name, province.code]);
      logInfo(`Seeded province: ${province.name} (${province.code})`);
    }

    logInfo('Provinces seeding completed successfully');
    return true;

  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error during provinces seeding');
    logError(err);
    return false;

  } finally {
    if (pool) {
      try {
        await pool.end();
        logInfo('Database connection closed');
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Error closing database connection');
        logError(err);
      }
    }
  }
};