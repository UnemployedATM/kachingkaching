import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import EquipmentCard from "../components/inventory/EquipmentCard";
import EquipmentForm from "../components/inventory/EquipmentForm";

export default function Inventory() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ["equipment"],
    queryFn: () => base44.entities.Equipment.list("-created_at"),
  });


  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Equipment.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["equipment"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Equipment.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["equipment"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Equipment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["equipment"] }),
  });

  const handleSave = async (data) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setEditing(null);
  };

  const handleEdit = (equip) => {
    setEditing(equip);
    setFormOpen(true);
  };

  const handleDelete = async (equip) => {
    if (window.confirm(`Delete "${equip.name}"?`)) {
      await deleteMutation.mutateAsync(equip.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your studio equipment</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Equipment
        </Button>
      </div>

      {equipment.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No equipment added yet</p>
          <Button variant="outline" className="mt-4" onClick={() => setFormOpen(true)}>
            Add your first equipment
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map((equip) => (
            <EquipmentCard
              key={equip.id}
              equipment={equip}
              bookedCount={0}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <EquipmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        equipment={editing}
        onSave={handleSave}
      />
    </div>
  );
}