import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Leaf, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ── Password strength helpers ──────────────────────────────────────────────
function passwordStrength(pw) {
  if (!pw) return 0;
  const checks = [
    pw.length >= 8,
    /[A-Z]/.test(pw),
    /[a-z]/.test(pw),
    /[0-9]/.test(pw),
    /[^A-Za-z0-9]/.test(pw),
  ];
  return checks.filter(Boolean).length;
}
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', 'bg-red-400', 'bg-orange-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
const STRENGTH_TEXT   = ['', 'text-red-500', 'text-orange-500', 'text-orange-500', 'text-yellow-600', 'text-green-600'];

function StrengthMeter({ password }) {
  if (!password) return null;
  const score = passwordStrength(password);
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? STRENGTH_COLORS[score] : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${STRENGTH_TEXT[score]}`}>{STRENGTH_LABELS[score]}</p>
    </div>
  );
}

export default function Login() {
  // 'signin' | 'signup' | 'reset' | 'new-password'
  const [mode, setMode]               = useState('signin');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [message, setMessage]         = useState('');

  // Detect Supabase password-recovery redirect
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery') && hash.includes('access_token')) {
      setMode('new-password');
      window.history.replaceState(null, '', window.location.pathname);
    } else if (hash.includes('error=access_denied') || hash.includes('otp_expired')) {
      setError('That reset link has expired. Request a new one below.');
      setMode('reset');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (mode === 'new-password') {
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }
      if (passwordStrength(newPassword) < 3) {
        setError('Choose a stronger password — mix uppercase, lowercase, and numbers.');
        setLoading(false);
        return;
      }
      const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
      if (authError) {
        setError(authError.message);
      } else {
        setMessage('Password updated — signing you in.');
        setMode('signin');
      }
      setLoading(false);
      return;
    }

    if (mode === 'reset') {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (authError) {
        setError(authError.message);
      } else {
        setMessage('Password reset email sent — check your inbox.');
        setMode('signin');
      }
      setLoading(false);
      return;
    }

    if (mode === 'signin') {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setError(authError.message); setLoading(false); }
    } else {
      const { error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) {
        setError(authError.message);
        setLoading(false);
      } else {
        setMessage('Account created — you can sign in now.');
        setMode('signin');
        setLoading(false);
      }
    }
  };

  const switchMode = (next) => { setMode(next); setError(''); setMessage(''); };

  // Real-time confirm match (new-password mode)
  const confirmMismatch = confirmPassword && newPassword !== confirmPassword;
  const confirmMatch    = confirmPassword && newPassword === confirmPassword && newPassword.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-semibold text-foreground">Serenity</h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'signin' ? 'Sign in to your studio dashboard'
              : mode === 'signup' ? 'Create your account'
              : mode === 'new-password' ? 'Choose a new password'
              : 'Reset your password'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email — hidden in new-password mode */}
          {mode !== 'new-password' && (
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          )}

          {/* New password + strength meter */}
          {mode === 'new-password' && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars, mix of types"
                  required
                  autoFocus
                />
                <StrengthMeter password={newPassword} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className={confirmMismatch ? 'border-red-400 focus-visible:ring-red-400' : confirmMatch ? 'border-green-500 focus-visible:ring-green-500' : ''}
                />
                {confirmMismatch && <p className="text-xs text-destructive">Passwords don't match.</p>}
                {confirmMatch    && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="h-3 w-3" /> Passwords match</p>}
              </div>
            </>
          )}

          {/* Regular password field */}
          {mode !== 'reset' && mode !== 'new-password' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          {error   && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-primary">{message}</p>}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || (mode === 'new-password' && !!confirmMismatch)}
          >
            {loading
              ? '...'
              : mode === 'signin' ? 'Sign in'
              : mode === 'signup' ? 'Create account'
              : mode === 'new-password' ? 'Set new password'
              : 'Send reset email'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === 'reset' ? (
            <>
              Back to{' '}
              <button type="button" onClick={() => switchMode('signin')} className="text-primary hover:underline font-medium">
                Sign in
              </button>
            </>
          ) : mode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <button type="button" onClick={() => switchMode('signup')} className="text-primary hover:underline font-medium">
                Sign up
              </button>
            </>
          ) : mode !== 'new-password' ? (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => switchMode('signin')} className="text-primary hover:underline font-medium">
                Sign in
              </button>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
