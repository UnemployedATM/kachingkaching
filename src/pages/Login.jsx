import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const [mode, setMode]         = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [message, setMessage]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

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
              : 'Reset your password'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {mode !== 'reset' && (
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? '...'
              : mode === 'signin' ? 'Sign in'
              : mode === 'signup' ? 'Create account'
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
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => switchMode('signin')} className="text-primary hover:underline font-medium">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
