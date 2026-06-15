/**
 * Admin configuration.
 *
 * To grant a user admin privileges (so they can create listings),
 * add their email to the ADMIN_EMAILS array below.
 *
 * NOTE: For production, you should store admin roles in Firebase
 * and use security rules to enforce them. This is a simple
 * email-based allowlist suitable for small projects.
 */

export const ADMIN_EMAILS: string[] = [
  'jaseemnizardeen@gmail.com',
  'admin@electrohub.com',
  // Add more admin emails here, e.g.:
  // 'another-admin@example.com',
];

/**
 * Check whether the given email belongs to an admin.
 * Comparison is case-insensitive and trims whitespace.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((e) => e.toLowerCase() === normalized);
}
