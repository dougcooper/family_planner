import webpush from 'web-push';
import { logger } from '../logger.js';

// VAPID keys - should be stored in environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@familydashboard.local';

// Configure web-push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<void> {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
  } catch (error) {
    logger.error({ err: error }, 'Push notification failed');
    throw error;
  }
}

export function generateVAPIDKeys() {
  return webpush.generateVAPIDKeys();
}
