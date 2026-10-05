// Typing just "jimmy" in a sign-in email box signs in as Jimmy.
export const expandJimmy = (v) =>
  String(v ?? '').trim().toLowerCase() === 'jimmy' ? 'jimmy@cannoncodeconnect.com' : v
