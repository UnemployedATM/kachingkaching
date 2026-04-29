import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TYPES = [
  { value: "massage_table", label: "Massage Table" },
  { value: "pilates_reformer", label: "Pilates Reformer" },
  { value: "meditation_pod", label: "Meditation Pod" },
  { value: "yoga_mat", label: "Yoga Mat" },
  { value: "therapy_chair", label: "Therapy Chair" },
  { value: "sauna", label: "Sauna" },
  { value: "steam_room", label: "Steam Room" },
  { value: "other", label: "Other" },
];

const STATUSES = [
  { value: "available", label: "Available" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
];

export default function EquipmentForm({ open, onOpenChange, equipment, onSave }) {
  const [form, setForm] = useState({
    name: "",
    type: "other",
    total_quantity: 1,
    description: "",
    status: "available",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (equipment) {
      setForm({
        name: equipment.name || "",
        type: equipment.type || "other",
        total_quantity: equipment.total_quantity || 1,
        description: equipment.description || "",
        status: equipment.status || "available",
      });
    } else {
      setForm({ name: "", type: "other", total_quantity: 1, description: "", status: "available" });
    }
  }, [equipment, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, total_quantity: Number(form.total_quantity) });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{equipment ? "Edit Equipment" : "Add Equipment"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Equipment name"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty">Total Quantity</Label>
              <Input
                id="qty"
                type="number"
                min="1"
                value={form.total_quantity}
                onChange={(e) => setForm({ ...form, total_quantity: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description..."
              className="h-20"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : equipment ? "Update" : "Add Equipment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}