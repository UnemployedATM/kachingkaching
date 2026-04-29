import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EMPTY = { name: "", type: "class_pack", price_cents: "", credits: "", validity_days: "", stripe_price_id: "" };

const TYPES = [
  { value: "drop_in",    label: "Drop-In" },
  { value: "class_pack", label: "Class Pack" },
  { value: "monthly",    label: "Monthly" },
  { value: "annual",     label: "Annual" },
];

export default function PlanForm({ open, onOpenChange, plan, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(plan ? {
      name:            plan.name || "",
      type:            plan.type || "class_pack",
      price_cents:     plan.price_cents != null ? String(plan.price_cents) : "",
      credits:         plan.credits != null ? String(plan.credits) : "",
      validity_days:   plan.validity_days != null ? String(plan.validity_days) : "",
      stripe_price_id: plan.stripe_price_id || "",
    } : EMPTY);
  }, [plan, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      name:            form.name,
      type:            form.type,
      price_cents:     Number(form.price_cents),
      credits:         form.credits !== "" ? Number(form.credits) : null,
      validity_days:   form.validity_days !== "" ? Number(form.validity_days) : null,
      stripe_price_id: form.stripe_price_id || null,
    });
    setSaving(false);
    onOpenChange(false);
  };

  const isUnlimited = form.type === "monthly" || form.type === "annual";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{plan ? "Edit Plan" : "New Membership Plan"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Plan Name *</Label>
            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. 10-Class Pack" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Price (cents) *</Label>
              <Input id="price" type="number" min="0" value={form.price_cents} onChange={(e) => set("price_cents", e.target.value)} placeholder="e.g. 2000 = $20" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                min="1"
                value={form.credits}
                onChange={(e) => set("credits", e.target.value)}
                placeholder={isUnlimited ? "Leave blank = unlimited" : "e.g. 10"}
                disabled={isUnlimited}
              />
              {isUnlimited && <p className="text-xs text-muted-foreground">Unlimited for this type</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="validity">Validity (days)</Label>
              <Input id="validity" type="number" min="1" value={form.validity_days} onChange={(e) => set("validity_days", e.target.value)} placeholder="e.g. 90" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stripe">Stripe Price ID</Label>
            <Input id="stripe" value={form.stripe_price_id} onChange={(e) => set("stripe_price_id", e.target.value)} placeholder="price_xxx (add later)" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : plan ? "Update" : "Create Plan"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
