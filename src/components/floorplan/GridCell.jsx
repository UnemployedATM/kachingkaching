import { cn } from "@/lib/utils";

const typeColors = {
  massage_table:    "bg-chart-2/15 border-chart-2/40 text-chart-2",
  pilates_reformer: "bg-chart-1/15 border-chart-1/40 text-chart-1",
  meditation_pod:   "bg-chart-5/15 border-chart-5/40 text-chart-5",
  yoga_mat:         "bg-chart-3/15 border-chart-3/40 text-chart-3",
  therapy_chair:    "bg-chart-4/15 border-chart-4/40 text-chart-4",
  sauna:            "bg-orange-100 border-orange-300 text-orange-700",
  steam_room:       "bg-sky-100 border-sky-300 text-sky-700",
  other:            "bg-muted border-border text-muted-foreground",
};

const typeIcons = {
  massage_table:    "🛏",
  pilates_reformer: "🏋",
  meditation_pod:   "🧘",
  yoga_mat:         "🟩",
  therapy_chair:    "🪑",
  sauna:            "🔥",
  steam_room:       "💨",
  other:            "📦",
};

export default function GridCell({ slotId, occupant, onClick }) {
  const isEmpty = !occupant;
  const colorClass = occupant ? typeColors[occupant.type] || typeColors.other : "";

  return (
    <button
      onClick={onClick}
      title={occupant ? `${occupant.name} — click to manage` : `Slot ${slotId.replace("slot_", "")} — click to assign`}
      className={cn(
        "aspect-square w-full rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all duration-150 text-center p-1",
        isEmpty
          ? "border-dashed border-border bg-muted/20 hover:bg-muted/50 hover:border-primary/30 cursor-pointer"
          : cn("border-solid shadow-sm cursor-pointer hover:brightness-95", colorClass)
      )}
    >
      {occupant ? (
        <>
          <span className="text-xl leading-none">{typeIcons[occupant.type] || "📦"}</span>
          <span className="text-[10px] font-semibold leading-tight line-clamp-2 px-0.5">
            {occupant.name}
          </span>
        </>
      ) : (
        <span className="text-xs text-muted-foreground/50 font-medium">
          {slotId.replace("slot_", "")}
        </span>
      )}
    </button>
  );
}