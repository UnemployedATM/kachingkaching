import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// eslint-disable-next-line
export default function StatCard({ title, value, subtitle, icon: Icon, className }) {
  return (
    <Card className={cn("p-5 border border-border/60 shadow-sm", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-semibold mt-1.5 text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>
    </Card>
  );
}