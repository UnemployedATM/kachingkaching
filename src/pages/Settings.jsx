import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, ChevronDown, ChevronUp, Link2, Check } from "lucide-react";

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

export default function Settings() {
  const { user, staffRecord, reloadStaff } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const [pw, setPw] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const [pwOpen,        setPwOpen]        = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [pwSaving,      setPwSaving]      = useState(false);
  const [errors,        setErrors]        = useState({});
  const [copied,        setCopied]        = useState(false);
  const [resetSent,     setResetSent]     = useState(false);
  const [sendingReset,  setSendingReset]  = useState(false);

  const inviteLink = `https://kching-answering.vercel.app?studio=${staffRecord?.studio_id ?? ''}`;

  function copyInviteLink() {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  useEffect(() => {
    if (staffRecord && user) {
      setForm({
        first_name: staffRecord.first_name || "",
        last_name:  staffRecord.last_name  || "",
        email:      user.email             || "",
        phone:      staffRecord.phone      || "",
      });
    }
  }, [staffRecord, user]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.email.includes("@")) e.email = "Enter a valid email address.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    const full_name = [form.first_name, form.last_name].filter(Boolean).join(" ");

    const { error: dbError } = await supabase
      .from("staff")
      .update({ first_name: form.first_name, last_name: form.last_name, phone: form.phone, full_name })
      .eq("id", staffRecord.id);

    if (dbError) {
      toast({ title: "Error", description: dbError.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    if (form.email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email: form.email });
      if (emailError) {
        toast({ title: "Error updating email", description: emailError.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    await reloadStaff();
    toast({ title: "Profile updated successfully!" });
    setSaving(false);
  };

  const handleSendReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setSendingReset(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setResetSent(true);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const e2 = {};
    if (!pw.current)              e2.current  = "Enter your current password.";
    if (pw.next.length < 8)       e2.next     = "Password must be at least 8 characters.";
    if (passwordStrength(pw.next) < 3) e2.next = e2.next ?? "Choose a stronger password (mix upper, lower, numbers).";
    if (pw.next !== pw.confirm)   e2.confirm  = "Passwords do not match.";
    setErrors(e2);
    if (Object.keys(e2).length > 0) return;

    setPwSaving(true);

    // Verify current password
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: pw.current,
    });
    if (verifyError) {
      setErrors({ current: "Current password is incorrect." });
      setPwSaving(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: pw.next });
    if (updateError) {
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
      setPwSaving(false);
      return;
    }

    toast({ title: "Password changed successfully!" });
    setPw({ current: "", next: "", confirm: "" });
    setPwOpen(false);
    setPwSaving(false);
  };

  // Real-time confirm match
  const confirmMismatch = pw.confirm && pw.next !== pw.confirm;
  const confirmMatch    = pw.confirm && pw.next === pw.confirm && pw.next.length > 0;

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-primary" /> Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile and account.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Information */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="first_name">First Name</Label>
                <Input id="first_name" value={form.first_name} onChange={set("first_name")} placeholder="First name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name">Last Name</Label>
                <Input id="last_name" value={form.last_name} onChange={set("last_name")} placeholder="Last name" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="Phone number" />
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={form.email} onChange={set("email")} placeholder="Email address" />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Save / Cancel */}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="flex-1 sm:flex-none sm:px-8">
            {saving ? "Saving…" : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setForm({
                first_name: staffRecord?.first_name || "",
                last_name:  staffRecord?.last_name  || "",
                email:      user?.email             || "",
                phone:      staffRecord?.phone      || "",
              });
              setErrors({});
            }}
          >
            Cancel
          </Button>
        </div>
      </form>

      {/* Invite Clients */}
      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Invite Clients</CardTitle>
          <p className="text-sm text-muted-foreground">Share this link with clients so they can join your studio.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
            <span className="flex-1 text-sm text-muted-foreground truncate font-mono">{inviteLink}</span>
          </div>
          <Button type="button" variant="outline" onClick={copyInviteLink} className="gap-2">
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy Invite Link'}
          </Button>
        </CardContent>
      </Card>

      {/* Password Management */}
      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <button
            type="button"
            onClick={() => { setPwOpen((o) => !o); setErrors({}); setResetSent(false); }}
            className="flex items-center justify-between w-full text-left"
          >
            <CardTitle className="text-base">Change Password</CardTitle>
            {pwOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
        </CardHeader>

        {pwOpen && (
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">

              {/* Current password — required */}
              <div className="space-y-1.5">
                <Label htmlFor="pw_current">Current Password</Label>
                <Input
                  id="pw_current"
                  type="password"
                  value={pw.current}
                  onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                  placeholder="Enter current password"
                />
                {errors.current && <p className="text-xs text-destructive">{errors.current}</p>}

                {/* Forgot escape hatch */}
                {!resetSent ? (
                  <button
                    type="button"
                    onClick={handleSendReset}
                    disabled={sendingReset}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
                  >
                    {sendingReset ? "Sending…" : "Forgot your current password? Send a reset email"}
                  </button>
                ) : (
                  <p className="text-xs text-green-600 mt-1">Reset email sent — check your inbox.</p>
                )}
              </div>

              {/* New password + strength meter */}
              <div className="space-y-1.5">
                <Label htmlFor="pw_next">New Password</Label>
                <Input
                  id="pw_next"
                  type="password"
                  value={pw.next}
                  onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                  placeholder="Min 8 chars, mix of types"
                />
                <StrengthMeter password={pw.next} />
                {errors.next && <p className="text-xs text-destructive">{errors.next}</p>}
              </div>

              {/* Confirm password + real-time match */}
              <div className="space-y-1.5">
                <Label htmlFor="pw_confirm">Confirm New Password</Label>
                <Input
                  id="pw_confirm"
                  type="password"
                  value={pw.confirm}
                  onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                  placeholder="Repeat new password"
                  className={confirmMismatch ? 'border-red-400 focus-visible:ring-red-400' : confirmMatch ? 'border-green-500 focus-visible:ring-green-500' : ''}
                />
                {confirmMismatch && <p className="text-xs text-destructive">Passwords don't match.</p>}
                {confirmMatch    && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="h-3 w-3" /> Passwords match</p>}
                {errors.confirm  && !confirmMismatch && <p className="text-xs text-destructive">{errors.confirm}</p>}
              </div>

              <Button type="submit" variant="outline" disabled={pwSaving || !!confirmMismatch}>
                {pwSaving ? "Updating…" : "Update Password"}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
