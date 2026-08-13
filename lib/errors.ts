/**
 * Shared, user-safe error types. "use server" files may only export
 * async functions, so any custom Error subclasses used by Server Actions
 * live here instead of alongside the actions themselves.
 */

export class PracticeActionError extends Error {}
export class SettingsActionError extends Error {}
