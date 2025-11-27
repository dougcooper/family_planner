import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../model/database';
import { authProvider } from './auth';
import log from '../utils/logger';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

let isSyncing = false;

export async function syncDatabase() {
  if (isSyncing) {
    log.info('Sync already in progress, skipping');
    return;
  }

  isSyncing = true;
  try {
    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
        log.info('Pulling changes...', { lastPulledAt, schemaVersion, migration });
        const token = await authProvider.getToken();
        if (!token) {
          throw new Error('No auth token available');
        }

        const response = await fetch(`${API_URL}/sync/pull?last_pulled_at=${lastPulledAt || 0}&schema_version=${schemaVersion}&migration=${JSON.stringify(migration)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const { changes, timestamp } = await response.json();
        return { changes, timestamp };
      },
      pushChanges: async ({ changes, lastPulledAt }) => {
        log.info('Pushing changes...', { changes, lastPulledAt });
        const token = await authProvider.getToken();
        if (!token) {
          throw new Error('No auth token available');
        }

        const response = await fetch(`${API_URL}/sync/push?last_pulled_at=${lastPulledAt || 0}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ changes, last_pulled_at: lastPulledAt }),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }
      },
      migrationsEnabledAtVersion: 1,
    });
    log.info('Sync finished successfully');
  } catch (error) {
    log.error('Sync failed:', error);
  } finally {
    isSyncing = false;
  }
}

// Auto-sync helper with error handling
export async function autoSync(): Promise<void> {
  try {
    await syncDatabase();
  } catch (error) {
    log.error('Auto-sync failed:', error);
    // Don't throw - let the app continue with local data
  }
}

// Setup periodic sync
export function setupPeriodicSync(intervalMs: number = 60000): () => void {
  const intervalId = setInterval(() => {
    autoSync();
  }, intervalMs);

  // Return cleanup function
  return () => clearInterval(intervalId);
}
