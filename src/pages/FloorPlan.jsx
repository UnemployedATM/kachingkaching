import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { LayoutGrid } from "lucide-react";
import GridCell from "../components/floorplan/GridCell";
import SlotModal from "../components/floorplan/SlotModal";
import SetupNotice from "@/components/shared/SetupNotice";

const GRID_COLS = 5;
const GRID_ROWS = 5;
const TOTAL_SLOTS = GRID_COLS * GRID_ROWS;

// Generate slot IDs: slot_1 … slot_25
const SLOTS = Array.from({ length: TOTAL_SLOTS }, (_, i) => `slot_${i + 1}`);

export default function FloorPlan() {
  const queryClient = useQueryClient();
  const [activeSlot, setActiveSlot] = useState(null);

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ["equipment"],
    queryFn: () => base44.entities.Equipment.list("-created_at"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Equipment.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["equipment"] }),
  });

  // Build a map: slot_id -> equipment item
  const slotMap = {};
  equipment.forEach((eq) => {
    if (eq.grid_slot_id) slotMap[eq.grid_slot_id] = eq;
  });

  const unassignedEquipment = equipment.filter(
    (eq) => !eq.grid_slot_id && eq.status !== "retired"
  );

  const handleCellClick = (slotId) => {
    setActiveSlot(slotId);
  };

  const handleAssign = async (equip) => {
    await updateMutation.mutateAsync({ id: equip.id, data: { ...equip, grid_slot_id: activeSlot } });
    setActiveSlot(null);
  };

  const handleRemove = async (equip) => {
    await updateMutation.mutateAsync({ id: equip.id, data: { ...equip, grid_slot_id: null } });
    setActiveSlot(null);
  };

  const occupiedCount = equipment.filter((e) => e.grid_slot_id).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-primary" /> Studio Floor Plan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Click any cell to assign or remove equipment. {occupiedCount} of {TOTAL_SLOTS} slots occupied.
          </p>
        </div>
      </div>

      {equipment.length === 0 && (
        <SetupNotice steps={[{ label: "Add equipment items in Inventory before mapping your floor plan.", to: "/inventory", linkText: "Go to Inventory →" }]} />
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2 border-dashed border-border bg-muted/30" />
          <span className="text-muted-foreground">Empty</span>
        </div>
        {[
          { label: "Massage", cls: "bg-chart-2/20 border-chart-2/50" },
          { label: "Reformer", cls: "bg-chart-1/20 border-chart-1/50" },
          { label: "Meditation", cls: "bg-chart-5/20 border-chart-5/50" },
          { label: "Yoga Mat", cls: "bg-chart-3/20 border-chart-3/50" },
          { label: "Chair", cls: "bg-chart-4/20 border-chart-4/50" },
        ].map(({ label, cls }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded border-2 ${cls}`} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}
      >
        {SLOTS.map((slotId) => (
          <GridCell
            key={slotId}
            slotId={slotId}
            occupant={slotMap[slotId] || null}
            onClick={() => handleCellClick(slotId)}
          />
        ))}
      </div>

      {/* Unassigned equipment summary */}
      {unassignedEquipment.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Not yet placed ({unassignedEquipment.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {unassignedEquipment.map((eq) => (
              <span
                key={eq.id}
                className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/30 text-foreground"
              >
                {eq.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Slot assignment modal */}
      <SlotModal
        slot={activeSlot}
        occupant={activeSlot ? slotMap[activeSlot] : null}
        unassignedEquipment={unassignedEquipment}
        onAssign={handleAssign}
        onRemove={handleRemove}
        onClose={() => setActiveSlot(null)}
      />
    </div>
  );
}