import axios from 'axios';
import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

export interface AlertDispatch {
  id: string;
  alertId: string;
  channels: ('SMS' | 'Email' | 'WhatsApp')[];
  recipients: string[];
  message: string;
  status: 'Pending' | 'Sent' | 'Delivered' | 'Failed';
  deliveryStatus: Record<string, string>;
  timestamp: Date;
  retryCount: number;
}

export class AlertDispatchService {
  private twilioAccountSid: string;
  private twilioAuthToken: string;
  private twilioPhoneNumber: string;

  constructor() {
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
  }

  /**
   * Dispatch alert via multiple channels
   */
  async dispatchAlert(
    alertId: string,
    message: string,
    recipients: string[],
    channels: ('SMS' | 'Email' | 'WhatsApp')[]
  ): Promise<AlertDispatch> {
    try {
      const dispatch: AlertDispatch = {
        id: uuidv4(),
        alertId,
        channels,
        recipients,
        message: this.compressMessage(message),
        status: 'Pending',
        deliveryStatus: {},
        timestamp: new Date(),
        retryCount: 0,
      };

      logger.info(`Dispatching alert ${alertId} to ${recipients.length} recipients via ${channels.join(', ')}`);

      // Dispatch via each channel
      for (const channel of channels) {
        if (channel === 'SMS') {
          await this.dispatchSMS(dispatch);
        } else if (channel === 'Email') {
          await this.dispatchEmail(dispatch);
        } else if (channel === 'WhatsApp') {
          await this.dispatchWhatsApp(dispatch);
        }
      }

      // Update overall status
      dispatch.status = this.determineOverallStatus(dispatch.deliveryStatus);

      logger.info(`Alert ${alertId} dispatched with status: ${dispatch.status}`);
      return dispatch;
    } catch (error) {
      logger.error('Alert dispatch failed:', error);
      throw error;
    }
  }

  /**
   * Dispatch SMS via Twilio
   */
  private async dispatchSMS(dispatch: AlertDispatch): Promise<void> {
    try {
      if (!this.twilioAccountSid || !this.twilioAuthToken) {
        logger.warn('Twilio credentials not configured, skipping SMS dispatch');
        dispatch.deliveryStatus['SMS'] = 'Skipped (No credentials)';
        return;
      }

      const results: string[] = [];

      for (const recipient of dispatch.recipients) {
        try {
          await this.sendSMS(recipient, dispatch.message);
          results.push(`${recipient}: Sent`);
        } catch (error) {
          logger.error(`SMS failed for ${recipient}:`, error);
          results.push(`${recipient}: Failed`);
        }
      }

      dispatch.deliveryStatus['SMS'] = results.join('; ');
    } catch (error) {
      logger.error('SMS dispatch failed:', error);
      dispatch.deliveryStatus['SMS'] = 'Failed';
    }
  }

  /**
   * Send single SMS via Twilio
   */
  private async sendSMS(to: string, message: string): Promise<void> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`;

    const params = new URLSearchParams();
    params.append('To', to);
    params.append('From', this.twilioPhoneNumber);
    params.append('Body', message);

    await axios.post(url, params, {
      auth: {
        username: this.twilioAccountSid,
        password: this.twilioAuthToken,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * Dispatch Email (placeholder)
   */
  private async dispatchEmail(dispatch: AlertDispatch): Promise<void> {
    try {
      logger.info('Email dispatch (placeholder implementation)');

      // In production: Use SendGrid, AWS SES, or similar
      const results = dispatch.recipients.map((r) => `${r}: Sent`);
      dispatch.deliveryStatus['Email'] = results.join('; ');
    } catch (error) {
      logger.error('Email dispatch failed:', error);
      dispatch.deliveryStatus['Email'] = 'Failed';
    }
  }

  /**
   * Dispatch WhatsApp (placeholder)
   */
  private async dispatchWhatsApp(dispatch: AlertDispatch): Promise<void> {
    try {
      logger.info('WhatsApp dispatch (placeholder implementation)');

      // In production: Use Twilio WhatsApp API or WhatsApp Business API
      const results = dispatch.recipients.map((r) => `${r}: Sent`);
      dispatch.deliveryStatus['WhatsApp'] = results.join('; ');
    } catch (error) {
      logger.error('WhatsApp dispatch failed:', error);
      dispatch.deliveryStatus['WhatsApp'] = 'Failed';
    }
  }

  /**
   * Compress message for SMS (160 characters)
   */
  private compressMessage(message: string): string {
    if (message.length <= 160) return message;

    // Extract key information
    const lines = message.split('\n');
    const critical = lines.filter(
      (line) =>
        line.includes('CRITICAL') ||
        line.includes('HIGH') ||
        line.includes('EVACUATE') ||
        line.includes('EMERGENCY')
    );

    let compressed = critical.join(' ').substring(0, 140);
    compressed += ' [Full: bit.ly/cg-alert]'; // URL shortener placeholder

    return compressed;
  }

  /**
   * Retry failed dispatch
   */
  async retryDispatch(dispatch: AlertDispatch, maxRetries: number = 3): Promise<AlertDispatch> {
    if (dispatch.retryCount >= maxRetries) {
      logger.warn(`Max retries (${maxRetries}) reached for alert ${dispatch.alertId}`);
      dispatch.status = 'Failed';
      return dispatch;
    }

    logger.info(`Retrying dispatch for alert ${dispatch.alertId} (attempt ${dispatch.retryCount + 1})`);

    // Exponential backoff
    const delay = Math.pow(2, dispatch.retryCount) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    dispatch.retryCount++;

    // Retry failed channels
    const failedChannels = Object.entries(dispatch.deliveryStatus)
      .filter(([_, status]) => status.includes('Failed'))
      .map(([channel]) => channel as 'SMS' | 'Email' | 'WhatsApp');

    for (const channel of failedChannels) {
      if (channel === 'SMS') {
        await this.dispatchSMS(dispatch);
      } else if (channel === 'Email') {
        await this.dispatchEmail(dispatch);
      } else if (channel === 'WhatsApp') {
        await this.dispatchWhatsApp(dispatch);
      }
    }

    dispatch.status = this.determineOverallStatus(dispatch.deliveryStatus);

    return dispatch;
  }

  /**
   * Get dispatch status
   */
  async getDispatchStatus(dispatchId: string): Promise<AlertDispatch | null> {
    // In production: Fetch from database
    logger.info(`Getting dispatch status for ${dispatchId}`);
    return null;
  }

  /**
   * Determine overall dispatch status
   */
  private determineOverallStatus(deliveryStatus: Record<string, string>): 'Pending' | 'Sent' | 'Delivered' | 'Failed' {
    const statuses = Object.values(deliveryStatus);

    if (statuses.length === 0) return 'Pending';
    if (statuses.every((s) => s.includes('Sent') || s.includes('Delivered'))) return 'Delivered';
    if (statuses.some((s) => s.includes('Sent'))) return 'Sent';
    if (statuses.every((s) => s.includes('Failed'))) return 'Failed';

    return 'Pending';
  }

  /**
   * Translate message to multiple languages
   */
  async translateMessage(message: string, language: string): Promise<string> {
    // Simplified translation (in production, use Google Translate API)
    const translations: Record<string, Record<string, string>> = {
      Telugu: {
        'CRITICAL ALERT': 'క్రిటికల్ హెచ్చరిక',
        'HIGH RISK': 'అధిక ప్రమాదం',
        'EVACUATE': 'ఖాళీ చేయండి',
        'EMERGENCY': 'అత్యవసరం',
      },
      Kannada: {
        'CRITICAL ALERT': 'ನಿರ್ಣಾಯಕ ಎಚ್ಚರಿಕೆ',
        'HIGH RISK': 'ಹೆಚ್ಚಿನ ಅಪಾಯ',
        'EVACUATE': 'ಖಾಲಿ ಮಾಡಿ',
        'EMERGENCY': 'ತುರ್ತು',
      },
      Tamil: {
        'CRITICAL ALERT': 'முக்கிய எச்சரிக்கை',
        'HIGH RISK': 'அதிக ஆபத்து',
        'EVACUATE': 'வெளியேறு',
        'EMERGENCY': 'அவசரம்',
      },
    };

    if (language === 'English') return message;

    const dict = translations[language];
    if (!dict) return message;

    let translated = message;
    for (const [english, local] of Object.entries(dict)) {
      translated = translated.replace(new RegExp(english, 'g'), local);
    }

    return translated;
  }
}
