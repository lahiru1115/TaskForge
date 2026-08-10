/**
 * Every localStorage key that holds *account-scoped* state, in one place so a
 * sign-out can't miss one and leak the previous account's state into the next
 * session on a shared browser.
 *
 * `tf-theme` is deliberately not here — it's a per-device display preference,
 * not user data, and should survive switching accounts.
 */
export const AUTH_USER_KEY = 'tf_user'
export const LAST_WORKSPACE_KEY = 'tf-last-workspace'
