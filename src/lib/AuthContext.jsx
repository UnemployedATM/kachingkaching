import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null);
  const [staffRecord, setStaffRecord] = useState(undefined); // undefined = not yet loaded
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const loadStaff = async (userId) => {
    if (!userId) { setStaffRecord(null); return null; }
    const { data } = await supabase
      .from('staff')
      .select('id, full_name, first_name, last_name, phone, role, studio_id')
      .eq('auth_user_id', userId)
      .maybeSingle();
    setStaffRecord(data ?? null);
    return data ?? null;
  };

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION immediately on load —
    // let it be the single source of truth so getSession() doesn't race.
    supabase.auth.getSession().then(({ data: { session } }) => {
      // If there's no session, onAuthStateChange won't fire with a user,
      // so we must resolve loading here.
      if (!session) {
        setIsLoadingAuth(false);
      }
    }).catch(() => setIsLoadingAuth(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (!u) {
        setStaffRecord(null);
        setIsLoadingAuth(false);
      } else if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        try {
          await loadStaff(u.id);
        } catch {
          setStaffRecord(null);
        } finally {
          setIsLoadingAuth(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = () => supabase.auth.signOut();

  const reloadStaff = async () => {
    if (user) await loadStaff(user.id);
  };

  // Still loading if auth check isn't done, or if user is logged in but staff query hasn't returned yet
  const stillLoading = isLoadingAuth || (!!user && staffRecord === undefined);

  return (
    <AuthContext.Provider value={{
      user,
      staffRecord,
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
