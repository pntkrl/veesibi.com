import { getSupabaseBrowserClient } from './supabase/client';
import { getOrCreateDefaultOrg } from './db';
import { Organization } from '@/types/database';

export interface AuthUser {
  id: string;
  email: string;
  org?: Organization;
}

export interface AuthResult {
  user?: AuthUser;
  requiresVerification?: boolean;
  error?: string;
  url?: string;
}

const LOCAL_STORAGE_KEY = 'veesibi_auth_user';

export async function signInWithEmail(email: string, password?: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient();

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: password || 'defaultpass123' });
      if (error) {
        return { error: error.message };
      }
      if (data.user) {
        const org = await getOrCreateDefaultOrg(data.user.id, data.user.email || email);
        const userObj: AuthUser = { id: data.user.id, email: data.user.email || email, org };
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userObj));
        }
        return { user: userObj, requiresVerification: false };
      }
    } catch (e: any) {
      return { error: e?.message || 'Authentication failed' };
    }
  }

  // Fallback persistent user session for dev/demo mode
  const cleanEmail = email.trim().toLowerCase();
  const mockUserId = `user-${Math.abs(cleanEmail.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0))}`;
  const org = await getOrCreateDefaultOrg(mockUserId, cleanEmail);
  const userObj: AuthUser = { id: mockUserId, email: cleanEmail, org };
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userObj));
  }

  return { user: userObj, requiresVerification: false };
}

export async function signUpWithEmail(email: string, password?: string, orgName?: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient();

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: password || 'defaultpass123',
        options: {
          data: { org_name: orgName },
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined
        }
      });

      if (error) {
        return { error: error.message };
      }

      // If email confirmation is required by Supabase, data.session is null
      if (data.user && !data.session) {
        return {
          user: { id: data.user.id, email: data.user.email || email },
          requiresVerification: true
        };
      }

      if (data.user && data.session) {
        const org = await getOrCreateDefaultOrg(data.user.id, data.user.email || email);
        const userObj: AuthUser = { id: data.user.id, email: data.user.email || email, org };
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userObj));
        }
        return { user: userObj, requiresVerification: false };
      }
    } catch (e: any) {
      return { error: e?.message || 'Signup failed' };
    }
  }

  return signInWithEmail(email, password);
}

export async function signInWithGoogle(): Promise<{ url?: string; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://veesibi.com';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/dashboard`
        }
      });
      if (error) return { error: error.message };
      if (data?.url) return { url: data.url };
    } catch (e: any) {
      return { error: e?.message || 'Google Auth failed' };
    }
  }

  // Fallback demo redirect to dashboard
  const userObj: AuthUser = { id: 'google-user-101', email: 'user@gmail.com' };
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userObj));
  }
  return { url: '/dashboard' };
}

export function subscribeToAuthChanges(callback: (user: AuthUser | null) => void) {
  const supabase = getSupabaseBrowserClient();

  if (supabase) {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const u: AuthUser = { id: data.user.id, email: data.user.email || '' };
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(u));
        }
        callback(u);
      } else {
        callback(getCurrentUserSession());
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u: AuthUser = { id: session.user.id, email: session.user.email || '' };
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(u));
        }
        callback(u);
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
        callback(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }

  callback(getCurrentUserSession());
  return () => {};
}

export async function signOutUser(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
}

export function getCurrentUserSession(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
