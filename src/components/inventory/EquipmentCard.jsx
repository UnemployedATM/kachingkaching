import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

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

const statusStyles = {
  available: "bg-primary/10 text-primary border-primary/20",
  maintenance: "bg-accent text-accent-foreground border-accent",
  retired: "bg-muted text-muted-foreground border-border",
};

export default function EquipmentCard({ equipment, bookedCount, onEdit, onDelete }) {
  const available = Math.max(0, (equipment.total_quantity || 0) - bookedCount);

  return (
    <Card className="p-5 border border-border/60 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-foreground truncate">{equipment.name}</h3>
            <Badge variant="outline" className={statusStyles[equipment.status]}>
              {equipment.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {typeLabels[equipment.type] || equipment.type}
          </p>
          {equipment.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{equipment.description}</p>
          )}
        </div>
        <div className="flex gap-1 ml-3 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(equipment)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(equipment)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-4 flex gap-4">
        <div className="text-center px-3 py-2 rounded-lg bg-secondary/50">
          <p className="text-lg font-semibold text-foreground">{equipment.total_quantity || 0}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="text-center px-3 py-2 rounded-lg bg-primary/5">
          <p className="text-lg font-semibold text-primary">{available}</p>
          <p className="text-xs text-muted-foreground">Available</p>
        </div>
        <div className="text-center px-3 py-2 rounded-lg bg-accent/50">
          <p className="text-lg font-semibold text-accent-foreground">{bookedCount}</p>
          <p className="text-xs text-muted-foreground">In Use</p>
        </div>
      </div>
    </Card>
  );
}