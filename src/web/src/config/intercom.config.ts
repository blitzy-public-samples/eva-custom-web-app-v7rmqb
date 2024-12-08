// Human Tasks:
// 1. Set up Intercom account and obtain the app ID
// 2. Configure Intercom settings in the Intercom dashboard
// 3. Verify user data privacy compliance for Intercom integration
// 4. Test Intercom messenger across different viewport sizes

// intercom-client version ^3.2.1
import { API_BASE_URL } from './api.config';
import { initializeAuth0 } from './auth.config';
import { validateAuth } from '../utils/validation.util';
import { formatDate } from '../utils/format.util';
import { Client } from 'intercom-client';

/**
 * Intercom application ID from environment variables
 * Addresses Customer Support Integration requirement from Technical Specifications/1.2 System Overview/High-Level Description/Integrations
 */
const INTERCOM_APP_ID = process.env.REACT_APP_INTERCOM_APP_ID;

/**
 * Interface defining the structure of user context for Intercom initialization
 */
interface IntercomUserContext {
  userId: string;
  email: string;
  name: string;
  createdAt: Date;
  role: string;
  subscriptionStatus?: string;
}

/**
 * Initializes the Intercom client with the application ID and user context.
 * Addresses Customer Support Integration requirement from Technical Specifications/1.2 System Overview/High-Level Description/Integrations
 * 
 * @param userContext - Object containing user information for Intercom initialization
 * @returns An initialized Intercom client instance
 * @throws Error if Intercom app ID is not configured or user context is invalid
 */
export const initializeIntercom = async (userContext: IntercomUserContext): Promise<Client> => {
  // Validate Intercom app ID
  if (!INTERCOM_APP_ID) {
    throw new Error('Intercom App ID is not configured');
  }

  // Validate user context
  if (!validateAuth({ 
    email: userContext.email, 
    password: '', // Not needed for validation
    role: userContext.role as any 
  })) {
    throw new Error('Invalid user context provided');
  }

  try {
    // Initialize Auth0 to ensure authentication is ready
    await initializeAuth0();

    // Create Intercom client configuration
    const intercomConfig = {
      app_id: INTERCOM_APP_ID,
      api_base: API_BASE_URL,
      user: {
        user_id: userContext.userId,
        email: userContext.email,
        name: userContext.name,
        created_at: Math.floor(userContext.createdAt.getTime() / 1000), // Convert to Unix timestamp
        custom_attributes: {
          role: userContext.role,
          subscription_status: userContext.subscriptionStatus,
          last_seen: formatDate(new Date()),
          platform: 'web'
        }
      }
    };

    // Initialize Intercom client
    const client = new Client({
      token: INTERCOM_APP_ID,
      useCookies: true,
      requireExplicitConsent: true // GDPR compliance
    });

    // Configure Intercom messenger settings
    window.intercomSettings = {
      ...intercomConfig,
      hide_default_launcher: false,
      alignment: 'right',
      horizontal_padding: 20,
      vertical_padding: 20,
      background_color: '#2C5282', // Using primary color from theme
      action_color: '#48BB78' // Using secondary color from theme
    };

    // Load Intercom messenger script
    (function() {
      const w = window as any;
      const ic = w.Intercom;
      if (typeof ic === "function") {
        ic('reattach_activator');
        ic('update', intercomConfig);
      } else {
        const d = document;
        const i = function() {
          (i as any).c(arguments);
        };
        (i as any).q = [];
        (i as any).c = function(args: any) {
          (i as any).q.push(args);
        };
        w.Intercom = i;
        const l = function() {
          const s = d.createElement('script');
          s.type = 'text/javascript';
          s.async = true;
          s.src = `https://widget.intercom.io/widget/${INTERCOM_APP_ID}`;
          const x = d.getElementsByTagName('script')[0];
          x.parentNode?.insertBefore(s, x);
        };
        if (document.readyState === 'complete') {
          l();
        } else if (w.attachEvent) {
          w.attachEvent('onload', l);
        } else {
          w.addEventListener('load', l, false);
        }
      }
    })();

    return client;
  } catch (error) {
    console.error('Error initializing Intercom:', error);
    throw new Error('Failed to initialize Intercom client');
  }
};