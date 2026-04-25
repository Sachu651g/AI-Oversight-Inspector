import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import logger from '../config/logger';

export interface AuditRecord {
  id: string;
  recordId: string;
  timestamp: Date;
  zoneId: string;
  riskLevel: string;
  decisionBrief: string;
  userId: string;
  parameters: any;
  hash: string;
  previousHash: string;
  status: 'ACTIVE' | 'TAMPERED';
}

export class AuditTrailService {
  /**
   * Log alert to audit trail with hash chain
   */
  async logAlert(alertData: {
    zoneId: string;
    riskLevel: string;
    decisionBrief: string;
    userId: string;
    parameters: any;
  }): Promise<AuditRecord> {
    try {
      // Get previous record
      const previousRecord = await this.getLastRecord();

      // Create new record
      const record: AuditRecord = {
        id: uuidv4(),
        recordId: uuidv4(),
        timestamp: new Date(),
        zoneId: alertData.zoneId,
        riskLevel: alertData.riskLevel,
        decisionBrief: alertData.decisionBrief,
        userId: alertData.userId,
        parameters: alertData.parameters,
        hash: '',
        previousHash: previousRecord?.hash || 'GENESIS',
        status: 'ACTIVE',
      };

      // Generate hash
      record.hash = this.generateHash(record);

      // Store in database (append-only)
      await this.saveRecord(record);

      logger.info(`Audit record created: ${record.recordId}`);
      return record;
    } catch (error) {
      logger.error('Audit trail logging failed:', error);
      throw error;
    }
  }

  /**
   * Generate cryptographic hash (SHA-256)
   */
  private generateHash(record: AuditRecord): string {
    const data = JSON.stringify({
      recordId: record.recordId,
      timestamp: record.timestamp.toISOString(),
      zoneId: record.zoneId,
      riskLevel: record.riskLevel,
      userId: record.userId,
      previousHash: record.previousHash,
    });

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Get last audit record
   */
  private async getLastRecord(): Promise<AuditRecord | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM audit_trail ORDER BY created_at DESC LIMIT 1'
      );

      if (result.rows.length === 0) return null;

      return this.mapRowToRecord(result.rows[0]);
    } catch (error) {
      // Table might not exist yet
      logger.warn('Could not fetch last record:', error);
      return null;
    }
  }

  /**
   * Save record to database
   */
  private async saveRecord(record: AuditRecord): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO audit_trail 
        (id, record_id, timestamp, zone_id, risk_level, decision_brief, user_id, parameters, hash, previous_hash, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
        [
          record.id,
          record.recordId,
          record.timestamp,
          record.zoneId,
          record.riskLevel,
          record.decisionBrief,
          record.userId,
          JSON.stringify(record.parameters),
          record.hash,
          record.previousHash,
          record.status,
        ]
      );
    } catch (error) {
      logger.error('Failed to save audit record:', error);
      throw error;
    }
  }

  /**
   * Verify audit trail integrity
   */
  async verifyIntegrity(recordId?: string): Promise<{
    verified: boolean;
    tamperedRecords: string[];
    totalRecords: number;
  }> {
    try {
      logger.info('Verifying audit trail integrity...');

      let query = 'SELECT * FROM audit_trail ORDER BY created_at ASC';
      let params: any[] = [];

      if (recordId) {
        query = 'SELECT * FROM audit_trail WHERE record_id = $1';
        params = [recordId];
      }

      const result = await pool.query(query, params);
      const records = result.rows.map(this.mapRowToRecord);

      const tamperedRecords: string[] = [];
      let previousHash = 'GENESIS';

      for (const record of records) {
        // Verify hash chain
        if (record.previousHash !== previousHash) {
          tamperedRecords.push(record.recordId);
          record.status = 'TAMPERED';
          await this.updateRecordStatus(record.id, 'TAMPERED');
        }

        // Verify record hash
        const expectedHash = this.generateHash({
          ...record,
          hash: '', // Exclude hash from calculation
        });

        if (record.hash !== expectedHash) {
          tamperedRecords.push(record.recordId);
          record.status = 'TAMPERED';
          await this.updateRecordStatus(record.id, 'TAMPERED');
        }

        previousHash = record.hash;
      }

      const verified = tamperedRecords.length === 0;

      logger.info(
        `Audit trail verification complete: ${verified ? 'VERIFIED' : 'TAMPERED'} (${tamperedRecords.length} tampered records)`
      );

      return {
        verified,
        tamperedRecords,
        totalRecords: records.length,
      };
    } catch (error) {
      logger.error('Audit trail verification failed:', error);
      throw error;
    }
  }

  /**
   * Update record status
   */
  private async updateRecordStatus(id: string, status: 'ACTIVE' | 'TAMPERED'): Promise<void> {
    try {
      await pool.query('UPDATE audit_trail SET status = $1 WHERE id = $2', [status, id]);
    } catch (error) {
      logger.error('Failed to update record status:', error);
    }
  }

  /**
   * Get audit trail records
   */
  async getRecords(filters: {
    limit?: number;
    offset?: number;
    zoneId?: string;
    riskLevel?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ records: AuditRecord[]; total: number }> {
    try {
      let query = 'SELECT * FROM audit_trail WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      // Apply filters
      if (filters.zoneId) {
        query += ` AND zone_id = $${paramIndex}`;
        params.push(filters.zoneId);
        paramIndex++;
      }

      if (filters.riskLevel) {
        query += ` AND risk_level = $${paramIndex}`;
        params.push(filters.riskLevel);
        paramIndex++;
      }

      if (filters.startDate) {
        query += ` AND timestamp >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }

      if (filters.endDate) {
        query += ` AND timestamp <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }

      // Get total count
      const countResult = await pool.query(query.replace('*', 'COUNT(*)'), params);
      const total = parseInt(countResult.rows[0].count);

      // Add pagination
      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
        paramIndex++;
      }

      if (filters.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
      }

      const result = await pool.query(query, params);
      const records = result.rows.map(this.mapRowToRecord);

      return { records, total };
    } catch (error) {
      logger.error('Failed to get audit records:', error);
      throw error;
    }
  }

  /**
   * Get transparency metrics
   */
  async getTransparencyMetrics(): Promise<{
    totalAlerts: number;
    acknowledgedPercentage: number;
    avgResponseTime: number;
    resolutionRate: number;
  }> {
    try {
      // Get total alerts
      const totalResult = await pool.query('SELECT COUNT(*) FROM audit_trail');
      const totalAlerts = parseInt(totalResult.rows[0].count);

      // Simplified metrics (in production, calculate from actual data)
      return {
        totalAlerts,
        acknowledgedPercentage: 85,
        avgResponseTime: 12, // minutes
        resolutionRate: 92, // percentage
      };
    } catch (error) {
      logger.error('Failed to get transparency metrics:', error);
      throw error;
    }
  }

  /**
   * Export audit trail
   */
  async exportAuditTrail(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const { records } = await this.getRecords({ limit: 10000 });

      if (format === 'json') {
        return JSON.stringify(records, null, 2);
      } else {
        // CSV format
        const headers = [
          'Record ID',
          'Timestamp',
          'Zone ID',
          'Risk Level',
          'User ID',
          'Hash',
          'Status',
        ];
        const rows = records.map((r) => [
          r.recordId,
          r.timestamp.toISOString(),
          r.zoneId,
          r.riskLevel,
          r.userId,
          r.hash,
          r.status,
        ]);

        return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      }
    } catch (error) {
      logger.error('Failed to export audit trail:', error);
      throw error;
    }
  }

  /**
   * Map database row to AuditRecord
   */
  private mapRowToRecord(row: any): AuditRecord {
    return {
      id: row.id,
      recordId: row.record_id,
      timestamp: new Date(row.timestamp),
      zoneId: row.zone_id,
      riskLevel: row.risk_level,
      decisionBrief: row.decision_brief,
      userId: row.user_id,
      parameters: typeof row.parameters === 'string' ? JSON.parse(row.parameters) : row.parameters,
      hash: row.hash,
      previousHash: row.previous_hash,
      status: row.status,
    };
  }
}
