import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from "date-fns";

export default function CalendarHeader({ view, setView, currentDate, setCurrentDate }) {
  const navigate = (dir) => {
    const delta = dir === 1 ? 1 : -1;
    if (view === "day") setCurrentDate((d) => addDays(d, delta));
    else if (view === "week") setCurrentDate((d) => addWeeks(d, delta));
    else setCurrentDate((d) => addMonths(d, delta));
  };

  const label = () => {
    if (view === "day") return format(currentDate, "EEEE, MMMM d, yyyy");
    if (view === "week") {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay() + 1);
      const end = addDays(start, 6);
      return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
    }
    return format(currentDate, "MMMM yyyy");
  };

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
        <span className="text-sm font-medium">{label()}</span>
      </div>
      <div className="flex gap-1 bg-muted p-1 rounded-lg">
        {["day", "week", "month"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1 text-sm rounded-md transition-all capitalize font-medium ${view === v ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}