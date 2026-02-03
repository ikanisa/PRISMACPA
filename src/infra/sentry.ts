/**
 * Sentry Error Tracking Integration
 *
 * Initializes Sentry for error tracking in production.
 * Set SENTRY_DSN environment variable to enable.
 */

import * as Sentry from "@sentry/node";

let initialized = false;

/**
 * Initialize Sentry error tracking.
 *
 * Only initializes if:
 * - SENTRY_DSN is set
 * - Not already initialized
 */
export function initSentry(): boolean {
  if (initialized) {
    return true;
  }

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    // Sentry disabled - no DSN configured
    return false;
  }

  const environment = process.env.SENTRY_ENVIRONMENT ?? "development";
  const release = process.env.npm_package_version ?? "unknown";

  Sentry.init({
    dsn,
    environment,
    release: `openclaw@${release}`,

    // Performance monitoring (optional, lower in production)
    tracesSampleRate: environment === "production" ? 0.1 : 1.0,

    // Filter sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }
      return event;
    },

    // Ignore common non-errors
    ignoreErrors: [
      // Network errors
      "ECONNREFUSED",
      "ECONNRESET",
      "ETIMEDOUT",
      // User aborts
      "AbortError",
      "User closed connection",
    ],
  });

  initialized = true;
  console.log(`[sentry] Initialized (env: ${environment})`);
  return true;
}

/**
 * Capture an exception with Sentry.
 */
export function captureException(error: unknown, context?: Record<string, unknown>): string | null {
  if (!initialized) {
    return null;
  }

  return Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message with Sentry.
 */
export function captureMessage(
  message: string,
  level: "fatal" | "error" | "warning" | "info" = "info",
): string | null {
  if (!initialized) {
    return null;
  }

  return Sentry.captureMessage(message, level);
}

/**
 * Set user context for Sentry.
 */
export function setUser(user: { id?: string; email?: string; username?: string } | null): void {
  if (!initialized) {
    return;
  }

  Sentry.setUser(user);
}

/**
 * Add breadcrumb for Sentry.
 */
export function addBreadcrumb(breadcrumb: {
  category?: string;
  message?: string;
  level?: "fatal" | "error" | "warning" | "info" | "debug";
  data?: Record<string, unknown>;
}): void {
  if (!initialized) {
    return;
  }

  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Flush pending events before shutdown.
 */
export async function flush(timeout = 2000): Promise<boolean> {
  if (!initialized) {
    return true;
  }

  return Sentry.flush(timeout);
}
