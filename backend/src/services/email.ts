import { db } from '../db';
import { users, notifications } from '../db/schema';
import { eq, and, lte } from 'drizzle-orm';
import { logger } from '../logger.js';

/**
 * Email digest service - sends daily/weekly notification summaries
 * Note: This is a simplified implementation. In production, you would use
 * a proper email service (SendGrid, AWS SES, etc.) and a job scheduler (cron, Bull, etc.)
 */

interface NotificationDigest {
  userId: string;
  userEmail: string;
  userName: string;
  frequency: string;
  notifications: Array<{
    title: string;
    message: string;
    type: string;
    createdAt: Date;
  }>;
}

export async function generateEmailDigests(
  frequency: 'DAILY' | 'WEEKLY'
): Promise<NotificationDigest[]> {
  try {
    // Get all users with the specified email frequency
    const usersWithFrequency = await db
      .select()
      .from(users)
      .where(eq(users.emailFrequency, frequency));

    const digests: NotificationDigest[] = [];

    // Calculate time range based on frequency
    const now = new Date();
    const cutoffDate = new Date();
    if (frequency === 'DAILY') {
      cutoffDate.setDate(now.getDate() - 1); // Last 24 hours
    } else {
      cutoffDate.setDate(now.getDate() - 7); // Last 7 days
    }

    // For each user, get their notifications since the cutoff
    for (const user of usersWithFrequency) {
      if (!user.email) continue; // Skip users without email

      const userNotifications = await db
        .select({
          title: notifications.title,
          message: notifications.message,
          type: notifications.type,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, user.id),
            lte(notifications.createdAt, now)
          )
        );

      // Filter by date in JS (since Drizzle date comparison can be tricky)
      const recentNotifications = userNotifications.filter(
        n => n.createdAt >= cutoffDate
      );

      if (recentNotifications.length > 0) {
        digests.push({
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          frequency,
          notifications: recentNotifications,
        });
      }
    }

    return digests;
  } catch (error) {
    logger.error({ err: error }, 'Error generating email digests');
    return [];
  }
}

export function formatDigestEmail(digest: NotificationDigest): { subject: string; html: string } {
  const { userName, frequency, notifications: notifs } = digest;
  
  const frequencyLabel = frequency === 'DAILY' ? 'Daily' : 'Weekly';
  const subject = `${frequencyLabel} Family Dashboard Digest - ${notifs.length} new notification${notifs.length !== 1 ? 's' : ''}`;

  const notificationRows = notifs
    .map(n => {
      const icon = getNotificationIcon(n.type);
      const date = n.createdAt.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return `
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #E2E8F0;">
            <div style="display: flex; align-items: flex-start;">
              <div style="font-size: 24px; margin-right: 12px;">${icon}</div>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: #1E293B; margin-bottom: 4px;">
                  ${escapeHtml(n.title)}
                </div>
                <div style="color: #475569; margin-bottom: 8px;">
                  ${escapeHtml(n.message)}
                </div>
                <div style="font-size: 12px; color: #94A3B8;">
                  ${date}
                </div>
              </div>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F8FAFC; padding: 20px;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background-color: #4A90E2; padding: 24px; text-align: center;">
                  <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 700;">
                    Family Dashboard
                  </h1>
                  <p style="margin: 8px 0 0 0; color: #FFFFFF; font-size: 14px; opacity: 0.9;">
                    ${frequencyLabel} Digest
                  </p>
                </td>
              </tr>
              
              <!-- Greeting -->
              <tr>
                <td style="padding: 24px;">
                  <p style="margin: 0; color: #1E293B; font-size: 16px;">
                    Hi ${escapeHtml(userName)},
                  </p>
                  <p style="margin: 16px 0 0 0; color: #475569; font-size: 14px;">
                    Here's your ${frequency.toLowerCase()} summary of family notifications:
                  </p>
                </td>
              </tr>
              
              <!-- Notifications -->
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    ${notificationRows}
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 24px; text-align: center; border-top: 1px solid #E2E8F0;">
                  <p style="margin: 0 0 12px 0; color: #64748B; font-size: 14px;">
                    You're receiving this because your email frequency is set to ${frequency.toLowerCase()}.
                  </p>
                  <p style="margin: 0; color: #94A3B8; font-size: 12px;">
                    © ${new Date().getFullYear()} Family Dashboard. Manage your notification settings in the app.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return { subject, html };
}

export async function sendDigestEmail(
  toEmail: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Implement actual email sending using your preferred service
    // Example with nodemailer (you'd need to install it):
    /*
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Family Dashboard <noreply@familydashboard.com>',
      to: toEmail,
      subject,
      html,
    });
    */

    // For now, just log the email (development mode)
    logger.info({ toEmail, subject, htmlPreview: html.substring(0, 200) + '...' }, 'Would send email');

    return { success: true };
  } catch (error) {
    logger.error({ err: error }, 'Error sending digest email');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function processEmailDigests(frequency: 'DAILY' | 'WEEKLY'): Promise<{
  sent: number;
  failed: number;
  errors: string[];
}> {
  const digests = await generateEmailDigests(frequency);
  
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const digest of digests) {
    const { subject, html } = formatDigestEmail(digest);
    const result = await sendDigestEmail(digest.userEmail, subject, html);
    
    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`${digest.userEmail}: ${result.error}`);
    }
  }

  return { sent, failed, errors };
}

// Helper functions
function getNotificationIcon(type: string): string {
  switch (type) {
    case 'INFO': return 'ℹ️';
    case 'SUCCESS': return '✅';
    case 'WARNING': return '⚠️';
    case 'ERROR': return '❌';
    default: return '📬';
  }
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
