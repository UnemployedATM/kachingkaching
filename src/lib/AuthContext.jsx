import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null);
  const [staffRecord, setStaffRecord] = useState(undefined); // undefined = not yet loaded
  const [studio, setStudio]           = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const loadStaff = async (userId, userEmail) => {
    if (!userId) { setStaffRecord(null); return null; }
    try {
      // 6-second timeout so a slow/hung Supabase query never freezes the UI
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 6000)
      );
      const query = supabase
        .from('staff')
        .select('id, full_name, first_name, last_name, phone, role, studio_id')
        .eq('auth_user_id', userId)
        .maybeSingle();
      let { data } = await Promise.race([query, timeout]);

      // Fallback: invited owners have a staff record keyed by email but no auth_user_id yet
      if (!data && userEmail) {
        const { data: byEmail } = await supabase
          .from('staff')
          .select('id, full_name, first_name, last_name, phone, role, studio_id')
          .eq('email', userEmail)
          .is('auth_user_id', null)
          .maybeSingle();
        if (byEmail) {
          // Self-heal: write auth_user_id so future logins use the fast path
          await supabase.from('staff').update({ auth_user_id: userId }).eq('id', byEmail.id);
          data = byEmail;
        }
      }

      setStaffRecord(data ?? null);

      // Fetch studio branding if this staff member is linked to a studio
      if (data?.studio_id) {
        const { data: studioData } = await supabase
          .from('studios')
          .select('id, name, brand_name, primary_color, logo_url, tagline')
          .eq('id', data.studio_id)
          .maybeSingle();
        setStudio(studioData ?? null);
      } else {
        setStudio(null);
      }

      return data ?? null;
    } catch {
      setStaffRecord(null);
      setStudio(null);
      return null;
    }
  };

  useEffect(() => {
    // Hard safety net: if nothing resolves in 8s, unblock the UI
    const safetyTimer = setTimeout(() => {
      setIsLoadingAuth(false);
      setStaffRecord((prev) => prev === undefined ? null : prev);
    }, 8000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        clearTimeout(safetyTimer);
        setIsLoadingAuth(false);
      }
    }).catch(() => { clearTimeout(safetyTimer); setIsLoadingAuth(false); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (!u) {
        setStaffRecord(null);
        setIsLoadingAuth(false);
        clearTimeout(safetyTimer);
      } else if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        await loadStaff(u.id, u.email); // timeout handled inside loadStaff
        setIsLoadingAuth(false);
        clearTimeout(safetyTimer);
      }
    });

    return () => { subscription.unsubscribe(); clearTimeout(safetyTimer); };
  }, []);

  const logout = () => supabase.auth.signOut();

  const reloadStaff = async () => {
    if (user) await loadStaff(user.id, user.email);
  };

  // Still loading if auth check isn't done, or if user is logged in but staff query hasn't returned yet
  const stillLoading = isLoadingAuth || (!!user && staffRecord === undefined);

  return (
    <AuthContext.Provider value={{
      user,
      staffRecord,
      studio,
      isAuthenticated: !!user,
      // True when logged in but no studio linked yet — show setup screen
      needsStudioSetup: !!user && staffRecord !== undefined && !staffRecord?.studio_id,
      isLoadingAuth: stillLoading,
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: null,
      authChecked: !stillLoading,
      logout,
      reloadStaff,
      navigateToLogin: () => { window.location.href = '/login'; },
      checkUserAuth: () => {},
      checkAppState: () => {},
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
