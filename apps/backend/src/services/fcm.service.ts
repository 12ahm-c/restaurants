import { initializeApp, cert, App } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { User } from '../models/User';
import { logger } from '../utils/logger';

let app: App | undefined;
let messaging: Messaging | undefined;

function initializeFirebaseAdmin(): boolean {
  if (app) return true;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) return false;

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    app = initializeApp({
      credential: cert(serviceAccount),
    });
    messaging = getMessaging(app);
    logger.info('Firebase Admin initialized');
    return true;
  } catch (err) {
    logger.warn({ err }, 'Failed to initialize Firebase Admin');
    return false;
  }
}

function stringifyData(data?: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(data || {})) {
    if (value === undefined || value === null) continue;
    result[key] = typeof value === 'string' ? value : JSON.stringify(value);
  }
  return result;
}

export class FcmService {
  static async registerToken(userId: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { $addToSet: { fcmTokens: token } });
  }

  static async unregisterToken(userId: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { $pull: { fcmTokens: token } });
  }

  static async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (!initializeFirebaseAdmin() || !messaging) return;

    const user = await User.findById(userId).select('fcmTokens');
    const tokens = user?.fcmTokens || [];
    if (tokens.length === 0) return;

    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: stringifyData(data),
      webpush: {
        fcmOptions: {
          link: typeof data?.target === 'string' ? data.target : '/',
        },
      },
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((item, index) => {
      if (
        item.error?.code === 'messaging/registration-token-not-registered' ||
        item.error?.code === 'messaging/invalid-registration-token'
      ) {
        invalidTokens.push(tokens[index]);
      }
    });

    if (invalidTokens.length > 0) {
      await User.findByIdAndUpdate(userId, { $pull: { fcmTokens: { $in: invalidTokens } } });
    }
  }
}
