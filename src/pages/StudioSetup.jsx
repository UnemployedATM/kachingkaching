import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LayoutGrid } from 'lucide-react';

export default function StudioSetup() {
  const { reloadStaff } = useAuth();
  const navigate = useNavigate();
  const [studioName, setStudioName] = useState('');
  const [ownerName, setOwnerName]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const { error: rpcError } = await supabase.rpc('create_studio', {
      studio_name: studioName,
      owner_name: ownerName,
    });
    if (rpcError) {
      setError(rpcError.message);
      setSaving(false);
      return;
    }
    await reloadStaff();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <LayoutGrid className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold">Set up your studio</h1>
            <p className="text-sm text-muted-foreground">You're almost in. Tell us about your business.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="studioName">Studio name</Label>
            <Input
              id="studioName"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              placeholder="Sunrise Wellness Studio"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ownerName">Your name</Label>
            <Input
              id="ownerName"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Full name"
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Creating studio…' : 'Create studio'}
          </Button>
        </form>
      </div>
    </div>
  );
}
