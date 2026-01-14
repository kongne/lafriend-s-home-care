// CAPTCHA configuration and utilities for form protection
// Use reCAPTCHA v3 for invisible protection

export const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

export interface RecaptchaVerifyResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  error_codes?: string[];
}

/**
 * Get reCAPTCHA token for form submission
 */
export const getRecaptchaToken = async (action: string): Promise<string> => {
  if (!window.grecaptcha || !RECAPTCHA_SITE_KEY) {
    console.warn('reCAPTCHA not properly configured');
    return '';
  }

  try {
    const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, {
      action: action
    });
    return token;
  } catch (error) {
    console.error('Error getting reCAPTCHA token:', error);
    return '';
  }
};

/**
 * Verify reCAPTCHA token on backend
 * This is called from Supabase Edge Functions
 */
export const verifyRecaptchaToken = async (
  token: string,
  secretKey: string,
  expectedAction: string,
  minScore: number = 0.5
): Promise<RecaptchaVerifyResponse> => {
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json() as RecaptchaVerifyResponse;

    // Verify the response
    if (!data.success) {
      return {
        success: false,
        score: 0,
        action: '',
        challenge_ts: '',
        hostname: '',
        error_codes: data.error_codes,
      };
    }

    // Check if action matches
    if (data.action !== expectedAction) {
      return {
        ...data,
        success: false,
      };
    }

    // Check score (higher is better, 1.0 is very likely legitimate, 0.0 is very likely bot)
    if (data.score < minScore) {
      return {
        ...data,
        success: false,
      };
    }

    return data;
  } catch (error) {
    console.error('Error verifying reCAPTCHA token:', error);
    return {
      success: false,
      score: 0,
      action: '',
      challenge_ts: '',
      hostname: '',
      error_codes: ['verification_error'],
    };
  }
};

// Declare global grecaptcha type for TypeScript
declare global {
  interface Window {
    grecaptcha: {
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      render: (containerId: string, options: object) => void;
      reset: () => void;
      getResponse: (widgetId?: number) => string;
    };
  }
}

export default {
  RECAPTCHA_SITE_KEY,
  getRecaptchaToken,
  verifyRecaptchaToken,
};
