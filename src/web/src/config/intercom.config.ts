// Declare global Intercom type
declare global {
  interface Window {
    Intercom: any;
  }
}

// Temporary type definition until @types/intercom-web is properly installed
type IntercomSettings = {
  app_id: string;
  accessibility?: {
    ariaLabels?: boolean;
    highContrast?: boolean;
    keyboardShortcuts?: boolean;
    screenReaderSupport?: boolean;
    focusManagement?: boolean;
    colorContrastRatio?: string;
    focusVisible?: boolean;
    reducedMotion?: boolean;
    ariaLabel?: string;
    tabIndex?: number;
  };
  alignment?: string;
  horizontal_padding?: number;
  vertical_padding?: number;
  custom_launcher_selector?: string;
  hide_default_launcher?: boolean;
  lazy_loading?: boolean;
  session_duration?: number;
  style?: {
    backgroundColor?: string;
    actionColor?: string;
    fontFamily?: string;
    fontSize?: string;
    animationDuration?: string;
  };
  secure_mode?: boolean;
  data_encryption?: boolean;
  privacy_mode?: boolean;
  cookie_secure?: boolean;
  http_only?: boolean;
  same_site?: string;
};

/**
 * Environment validation for required Intercom configuration
 * @throws {Error} If required environment variables are missing
 */
const validateEnvironment = (): string => {
  const appId = process.env.VITE_INTERCOM_APP_ID;
  if (!appId) {
    throw new Error('VITE_INTERCOM_APP_ID environment variable is required for Intercom initialization');
  }
  return appId;
};

/**
 * Default accessibility configuration for WCAG 2.1 Level AA compliance
 */
const accessibilityConfig = {
  ariaLabels: true,
  highContrast: true,
  keyboardShortcuts: true,
  screenReaderSupport: true,
  focusManagement: true,
  colorContrastRatio: '4.5:1',
  focusVisible: true,
  reducedMotion: true,
} as const;

/**
 * Default messenger widget styling and behavior configuration
 */
const widgetConfig = {
  backgroundColor: '#2C5282',
  actionColor: '#48BB78',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSizeBase: '16px',
  animationDuration: '0.2s',
  alignment: 'right',
  horizontalPadding: 20,
  verticalPadding: 20,
  customLauncherSelector: '#intercom-launcher',
  hideDefaultLauncher: false,
  lazyLoading: true,
  sessionDuration: 30,
} as const;

/**
 * Security configuration for Intercom integration
 */
const securityConfig = {
  secureMode: true,
  dataEncryption: true,
  sessionHandling: true,
  privacyMode: true,
  cookieSecure: true,
  httpOnly: true,
  sameSite: 'strict',
} as const;

/**
 * Retrieves the complete Intercom settings with enhanced accessibility and security features
 * @returns {IntercomSettings} Complete Intercom configuration settings
 */
export const getIntercomSettings = (): IntercomSettings => {
  const appId = validateEnvironment();

  return {
    app_id: appId,
    // Accessibility Settings
    accessibility: {
      ...accessibilityConfig,
      ariaLabel: 'Customer Support Chat',
      tabIndex: 0,
    },
    // Widget Appearance
    alignment: widgetConfig.alignment,
    horizontal_padding: widgetConfig.horizontalPadding,
    vertical_padding: widgetConfig.verticalPadding,
    custom_launcher_selector: widgetConfig.customLauncherSelector,
    hide_default_launcher: widgetConfig.hideDefaultLauncher,
    // Performance & Loading
    lazy_loading: widgetConfig.lazyLoading,
    session_duration: widgetConfig.sessionDuration,
    // Styling
    style: {
      backgroundColor: widgetConfig.backgroundColor,
      actionColor: widgetConfig.actionColor,
      fontFamily: widgetConfig.fontFamily,
      fontSize: widgetConfig.fontSizeBase,
      animationDuration: widgetConfig.animationDuration,
    },
    // Security Settings
    secure_mode: securityConfig.secureMode,
    data_encryption: securityConfig.dataEncryption,
    privacy_mode: securityConfig.privacyMode,
    cookie_secure: securityConfig.cookieSecure,
    http_only: securityConfig.httpOnly,
    same_site: securityConfig.sameSite,
  };
};

/**
 * Initializes the Intercom messenger widget with enhanced configuration and security validation
 * @param {IntercomSettings} settings - Optional custom settings to merge with defaults
 * @throws {Error} If initialization fails or security requirements are not met
 */
export const initializeIntercom = (settings?: Partial<IntercomSettings>): void => {
  try {
    // Validate environment and security requirements
    validateEnvironment();

    // Merge default settings with custom settings
    const finalSettings = {
      ...getIntercomSettings(),
      ...settings,
    };

    // Ensure security settings are not overridden
    if (!finalSettings.secure_mode || !finalSettings.data_encryption) {
      throw new Error('Security settings cannot be disabled');
    }

    // Initialize performance monitoring
    const startTime = performance.now();

    // Initialize Intercom with validated settings
    window.Intercom('boot', finalSettings);

    // Set up event handlers
    window.Intercom('onShow', () => {
      // Ensure focus management for accessibility
      const messenger = document.querySelector('[aria-label="Intercom Messenger"]');
      if (messenger instanceof HTMLElement) {
        messenger.focus();
      }
    });

    // Log initialization performance
    const endTime = performance.now();
    console.info(`Intercom initialized in ${endTime - startTime}ms`);

  } catch (error) {
    console.error('Failed to initialize Intercom:', error);
    throw error;
  }
};

/**
 * Export configuration object with all necessary components
 */
export const intercomConfig = {
  appId: validateEnvironment(),
  initializeIntercom,
  getIntercomSettings,
} as const;

// Default export for convenient importing
export default intercomConfig;