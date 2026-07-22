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
  action: string,
  minScore: number = 0.5
): Promise<RecaptchaVerifyResponse> => {
  // If no token (reCAPTCHA not configured), allow submission with a warning
  if (!token) {
    console.warn('reCAPTCHA token not available, allowing submission');
    return {
      success: true,
      score: 1,
      action: action,
      challenge_ts: new Date().toISOString(),
      hostname: window.location.hostname,
    };
  }

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(
      `${supabaseUrl}/functions/v1/verify-recaptcha`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, action, minScore }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to verify reCAPTCHA token');
    }

    const data = (await response.json()) as RecaptchaVerifyResponse;
    return data;
  } catch (error) {
    console.error('Error verifying reCAPTCHA token:', error);
    // Fail open when verification service is unreachable so booking is not blocked
    return {
      success: true,
      score: 0.1,
      action: action,
      challenge_ts: new Date().toISOString(),
      hostname: window.location.hostname,
      error_codes: ['verification_service_unreachable'],
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
