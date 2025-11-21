import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../model/database';
import { authProvider } from './auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export async function syncDatabase(): Promise<void> {
  const token = authProvider.getToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
      const response = await fetch(
        `${API_URL}/sync/pull?last_pulled_at=${lastPulledAt || 0}&schema_version=${schemaVersion}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Pull sync failed');
      }

      const { changes, timestamp } = await response.json();
      
      return {
        changes,
        timestamp,
      };
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      const response = await fetch(`${API_URL}/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          changes,
          last_pulled_at: lastPulledAt,
        }),
      });

      if (!response.ok) {
        throw new Error('Push sync failed');
      }
    },
    migrationsEnabledAtVersion: 1,
  });
}

// Auto-sync helper with error handling
export async function autoSync(): Promise<void> {
  try {
    await syncDatabase();
  } catch (error) {
    console.error('Auto-sync failed:', error);
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
