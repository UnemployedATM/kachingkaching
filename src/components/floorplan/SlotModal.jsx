import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const typeLabels = {
  massage_table: "Massage Table",
  pilates_reformer: "Pilates Reformer",
  meditation_pod: "Meditation Pod",
  yoga_mat: "Yoga Mat",
  therapy_chair: "Therapy Chair",
  sauna: "Sauna",
  steam_room: "Steam Room",
  other: "Other",
};

export default function SlotModal({ slot, occupant, unassignedEquipment, onAssign, onRemove, onClose }) {
  if (!slot) return null;

  return (
    <Dialog open={!!slot} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">
            {occupant ? `Slot ${slot.replace("slot_", "")} — ${occupant.name}` : `Assign Equipment to Slot ${slot.replace("slot_", "")}`}
          </DialogTitle>
        </DialogHeader>

        {occupant ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-muted/40 space-y-1">
              <p className="font-semibold">{occupant.name}</p>
              <p className="text-sm text-muted-foreground">{typeLabels[occupant.type] || occupant.type}</p>
              <p className="text-sm text-muted-foreground">Qty: {occupant.total_quantity}</p>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => onRemove(occupant)}
            >
              <Trash2 className="h-4 w-4" /> Remove from Floor Plan
            </Button>
          </div>
        ) : (
          <div className="space-y-2 py-2 max-h-72 overflow-y-auto">
            {unassignedEquipment.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                All equipment is already placed on the floor plan.
              </p>
            ) : (
              unassignedEquipment.map((eq) => (
                <button
                  key={eq.id}
                  onClick={() => onAssign(eq)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-border/60 hover:bg-accent hover:border-primary/30 transition-colors"
                >
                  <p className="font-medium text-sm">{eq.name}</p>
                  <p className="text-xs text-muted-foreground">{typeLabels[eq.type] || eq.type} · Qty {eq.total_quantity}</p>
                </button>
              ))
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}