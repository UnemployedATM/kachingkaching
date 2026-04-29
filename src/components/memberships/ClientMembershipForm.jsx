import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDays, format } from "date-fns";

const EMPTY = { client_id: "", plan_id: "", started_at: format(new Date(), "yyyy-MM-dd"), credits_remaining: "" };

export default function ClientMembershipForm({ open, onOpenChange, clients, plans, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...EMPTY, started_at: format(new Date(), "yyyy-MM-dd") });
  }, [open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const selectedPlan = plans.find((p) => p.id === form.plan_id);

  const handlePlanSelect = (planId) => {
    const plan = plans.find((p) => p.id === planId);
    set("plan_id", planId);
    if (plan?.credits != null) set("credits_remaining", String(plan.credits));
    else set("credits_remaining", "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const expires_at = selectedPlan?.validity_days
      ? format(addDays(new Date(form.started_at), selectedPlan.validity_days), "yyyy-MM-dd")
      : null;

    await onSave({
      client_id:         form.client_id,
      plan_id:           form.plan_id,
      started_at:        form.started_at,
      expires_at,
      credits_remaining: form.credits_remaining !== "" ? Number(form.credits_remaining) : null,
      status:            "active",
    });

    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Assign Membership</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Client *</Label>
            <Select value={form.client_id} onValueChange={(v) => set("client_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                {clients.filter((c) => c.status === "active").map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Plan *</Label>
            <Select value={form.plan_id} onValueChange={handlePlanSelect}>
              <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
              <SelectContent>
                {plans.filter((p) => p.is_active).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — ${(p.price_cents / 100).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="started">Start Date</Label>
              <Input id="started" type="date" value={form.started_at} onChange={(e) => set("started_at", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                min="0"
                value={form.credits_remaining}
                onChange={(e) => set("credits_remaining", e.target.value)}
                placeholder={selectedPlan && selectedPlan.credits == null ? "Unlimited" : ""}
                disabled={selectedPlan && selectedPlan.credits == null}
              />
            </div>
          </div>

          {selectedPlan?.validity_days && (
            <p className="text-xs text-muted-foreground">
              Expires {format(addDays(new Date(form.started_at || new Date()), selectedPlan.validity_days), "MMM d, yyyy")}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.client_id || !form.plan_id}>{saving ? "Saving…" : "Assign"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
