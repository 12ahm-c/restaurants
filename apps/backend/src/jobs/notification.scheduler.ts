import { NotificationService } from '../modules/notifications/notification.service';
import { logger } from '../utils/logger';

const CHECK_INTERVAL_MS = 60 * 1000;

let schedulerStarted = false;
let lastMorningKey = '';
let lastSummaryKey = '';

function getUtcDateKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

async function runDueNotificationJobs(now: Date = new Date()): Promise<void> {
  const dateKey = getUtcDateKey(now);
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();

  // Manager evening reminder at 20:00 UTC
  if (hour === 20 && minute === 0 && lastMorningKey !== dateKey) {
    lastMorningKey = dateKey;
    await NotificationService.notifyManagersMorningReminder();
  }

  // Daily summary at 00:00 UTC (midnight)
  if (hour === 0 && minute === 0 && lastSummaryKey !== dateKey) {
    lastSummaryKey = dateKey;
    await NotificationService.notifyManagersDailySummary(now);
  }
}

export function startNotificationScheduler(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;

  logger.info('Notification scheduler started');

  setInterval(() => {
    runDueNotificationJobs().catch((err) => {
      logger.warn({ err }, 'Notification scheduler job failed');
    });
  }, CHECK_INTERVAL_MS);
}

