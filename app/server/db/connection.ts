import sql from 'mssql';
import { DB_CONFIG } from '../constants';
import { logger } from '../logger';

let pool: sql.ConnectionPool | null = null;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Retry wrapper for database operations
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      if (i === retries - 1) throw error;
      
      logger.warn(`Database operation failed, retrying (${i + 1}/${retries})`, { error: error.message });
      
      if (error.code === 'ETIMEOUT' || error.code === 'ESOCKET') {
        // Connection timeout or socket error - reset pool
        await resetPool();
      }
      
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * Reset connection pool
 */
async function resetPool(): Promise<void> {
  if (pool) {
    try {
      await pool.close();
      pool = null;
      logger.info('Database pool reset');
    } catch (error) {
      logger.error('Error resetting pool', error);
    }
  }
}

/**
 * Get database connection with pooling and retry logic
 */
export async function getConnection(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool;
  }

  return withRetry(async () => {
    const config = {
      ...DB_CONFIG,
      pool: {
        max: 10,
        min: 2,
        idleTimeoutMillis: 30000,
        acquireTimeoutMillis: 60000,
      },
      options: {
        ...DB_CONFIG.options,
        trustServerCertificate: true,
        enableArithAbort: true,
        encrypt: DB_CONFIG.options?.encrypt || false,
      },
    };

    pool = await sql.connect(config);
    logger.info('Database connection established with pooling');
    return pool;
  });
}

/**
 * Close database connection
 */
export async function closeConnection(): Promise<void> {
  if (pool) {
    try {
      await pool.close();
      pool = null;
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection', error);
    }
  }
}

/**
 * Execute query with retry logic
 */
export async function executeQuery<T = any>(
  query: string,
  params?: Record<string, any>
): Promise<T[]> {
  return withRetry(async () => {
    const connection = await getConnection();
    const request = connection.request();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
    }

    logger.info(`Executing query: ${query}`, { params });
    const result = await request.query(query);
    logger.info(`Query executed successfully`, { rowCount: result.recordset?.length });
    return result.recordset as T[];
  });
}

/**
 * Execute scalar query with retry logic
 */
export async function executeScalar<T = any>(
  query: string,
  params?: Record<string, any>
): Promise<T | null> {
  return withRetry(async () => {
    const connection = await getConnection();
    const request = connection.request();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
    }

    logger.info(`Executing scalar query: ${query}`, { params });
    const result = await request.query(query);
    logger.info(`Scalar query executed successfully`);
    return result.recordset[0] ? (result.recordset[0] as T) : null;
  });
}
