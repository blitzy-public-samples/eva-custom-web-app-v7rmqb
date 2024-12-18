/**
 * Sanity.io CMS Integration Module
 * Provides content management and querying capabilities for estate planning resources
 * with enhanced error handling, caching, and monitoring features.
 * @module sanity.integration
 * @version 1.0.0
 */

import groq from 'groq'; // v6.0.0
import { rateLimit } from 'express-rate-limit'; // v6.0.0
import { sanityClient } from '../config/sanity';
import { logger } from '../utils/logger.util';
import { NotFoundError } from '../utils/error.util';
import { AuditEventType } from '../types/audit.types';

// Cache configuration
const CACHE_TTL = 3600; // 1 hour in seconds
const cache = new Map<string, { data: any; timestamp: number }>();

/**
 * Interface defining province-specific content structure
 */
interface ProvinceContent {
  name: string;
  code: string;
  resources: Resource[];
  guidelines: Guideline[];
  lastUpdated: Date;
  version: string;
}

/**
 * Interface defining estate planning resource structure
 */
interface Resource {
  title: string;
  description: string;
  category: string;
  content: string;
  lastUpdated: Date;
  version: string;
  status: 'active' | 'archived' | 'draft';
  metadata: Record<string, unknown>;
}

/**
 * Interface defining estate planning guidelines
 */
interface Guideline {
  title: string;
  content: string;
  category: string;
  applicableProvinces: string[];
  lastUpdated: Date;
}

/**
 * Rate limiting configuration for content API endpoints
 */
export const contentRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many content requests, please try again later'
});

/**
 * Validates province code format and existence
 */
const validateProvinceCode = (code: string): boolean => {
  const validProvinces = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'ON', 'PE', 'QC', 'SK', 'NT', 'NU', 'YT'];
  return validProvinces.includes(code.toUpperCase());
};

/**
 * Retrieves content from cache if available and not expired
 */
const getFromCache = (key: string): any | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL * 1000) {
    logger.info(`Cache hit for key: ${key}`);
    return cached.data;
  }
  return null;
};

/**
 * Stores content in cache with timestamp
 */
const setCache = (key: string, data: any): void => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
  logger.info(`Cached content for key: ${key}`);
};

/**
 * Retrieves province-specific estate planning content and resources
 * @param provinceCode - Two-letter province code
 * @param options - Optional configuration for caching and timeout
 * @returns Promise<ProvinceContent>
 * @throws {NotFoundError} If province content is not found
 */
export async function getProvinceContent(
  provinceCode: string,
  options: { useCache?: boolean; timeout?: number } = {}
): Promise<ProvinceContent> {
  const { useCache = true, timeout = 30000 } = options;

  try {
    // Validate province code
    if (!validateProvinceCode(provinceCode)) {
      throw new NotFoundError(`Invalid province code: ${provinceCode}`);
    }

    // Check cache if enabled
    const cacheKey = `province_content_${provinceCode}`;
    if (useCache) {
      const cachedContent = getFromCache(cacheKey);
      if (cachedContent) return cachedContent;
    }

    // Construct GROQ query for province content
    const query = groq`*[_type == "provinceContent" && code == $provinceCode][0]{
      name,
      code,
      "resources": resources[]->{
        title,
        description,
        category,
        content,
        lastUpdated,
        version,
        status,
        metadata
      },
      "guidelines": guidelines[]->{
        title,
        content,
        category,
        applicableProvinces,
        lastUpdated
      },
      lastUpdated,
      version
    }`;

    // Execute query with timeout
    const content = await Promise.race([
      sanityClient.fetch(query, { provinceCode: provinceCode.toUpperCase() }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Content fetch timeout')), timeout)
      )
    ]);

    if (!content) {
      throw new NotFoundError(`Content not found for province: ${provinceCode}`);
    }

    // Cache successful response if enabled
    if (useCache) {
      setCache(cacheKey, content);
    }

    logger.info(`Retrieved content for province: ${provinceCode}`, {
      eventType: AuditEventType.DOCUMENT_ACCESS,
      resourceType: 'province_content'
    });

    return content as ProvinceContent;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Error retrieving province content: ${errorMessage}`, {
      provinceCode,
      error
    });
    throw error;
  }
}

/**
 * Retrieves resources by category with caching
 */
export async function getResourcesByCategory(
  category: string,
  options: { useCache?: boolean } = {}
): Promise<Resource[]> {
  const { useCache = true } = options;

  try {
    const cacheKey = `resources_${category}`;
    if (useCache) {
      const cachedResources = getFromCache(cacheKey);
      if (cachedResources) return cachedResources;
    }

    const query = groq`*[_type == "resource" && category == $category && status == "active"]{
      title,
      description,
      category,
      content,
      lastUpdated,
      version,
      status,
      metadata
    }`;

    const resources = await sanityClient.fetch(query, { category });

    if (useCache) {
      setCache(cacheKey, resources);
    }

    return resources as Resource[];

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Error retrieving resources by category: ${errorMessage}`, {
      category,
      error
    });
    throw error;
  }
}

/**
 * Searches through estate planning resources with rate limiting
 */
export async function searchResources(
  searchTerm: string,
  options: { limit?: number; offset?: number } = {}
): Promise<Resource[]> {
  const { limit = 10, offset = 0 } = options;

  try {
    const query = groq`*[_type == "resource" && status == "active" && (
      title match $searchTerm || 
      description match $searchTerm ||
      content match $searchTerm
    )][${offset}...${offset + limit}]{
      title,
      description,
      category,
      content,
      lastUpdated,
      version,
      status,
      metadata
    }`;

    const resources = await sanityClient.fetch(query, { 
      searchTerm: `*${searchTerm}*` 
    });

    return resources as Resource[];

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Error searching resources: ${errorMessage}`, {
      searchTerm,
      error
    });
    throw error;
  }
}

export { ProvinceContent, Resource, Guideline };