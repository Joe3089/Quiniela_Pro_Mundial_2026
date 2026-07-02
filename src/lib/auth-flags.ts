// Module-level flag: set before calling supabase.auth.signOut() so the
// auth-provider can distinguish explicit logout from auto session expiry.
let _explicit = false;
export const markExplicitSignOut = () => { _explicit = true; };
export const wasExplicitSignOut = () => _explicit;
export const clearExplicitSignOut = () => { _explicit = false; };
