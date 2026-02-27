import cron from 'node-cron';
import { pool } from '../db/client';

/**
 * Scheduled task to clean up old sessions
 * Runs every day at 3 AM
 */
export function initCleanupTask() {
    cron.schedule('0 3 * * *', async () => {
        console.log('[Cleanup] Starting session cleanup...');
        try {
            // Close sessions older than 7 days with no activity
            const res = await pool.query(
                `UPDATE sessions 
                 SET status = 'closed' 
                 WHERE status = 'active' 
                 AND created_at < NOW() - INTERVAL '7 days'
                 AND id NOT IN (
                    SELECT session_id FROM messages WHERE created_at > NOW() - INTERVAL '7 days'
                 )
                 RETURNING id`
            );
            console.log(`[Cleanup] Closed ${res.rowCount} inactive sessions.`);
        } catch (error) {
            console.error('[Cleanup] Error during cleanup:', error);
        }
    });
}
