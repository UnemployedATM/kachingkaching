import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { RotateCcw } from "lucide-react";

const statusStyles = {
  paid: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-accent text-accent-foreground border-accent",
  refunded: "bg-muted text-muted-foreground border-border",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function ClientProfilePayments({ payments, onRefund }) {
  if (payments.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No payments on record</p>;
  }

  const total = payments.filter((p) => p.status === "paid").reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Total paid</span>
        <span className="font-semibold text-foreground">${total.toFixed(2)}</span>
      </div>
      {payments.map((p) => (
        <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/20 transition-colors">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">${(p.amount || 0).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              {p.payment_method?.replace("_", " ")} ·{" "}
              {p.payment_date ? format(new Date(p.payment_date + "T00:00:00"), "MMM d, yyyy") : "—"}
            </p>
          </div>
          <Badge variant="outline" className={statusStyles[p.status] || ""}>
            {p.status?.charAt(0).toUpperCase() + p.status?.slice(1)}
          </Badge>
          {p.status === "paid" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => onRefund(p)}
            >
              <RotateCcw className="h-3 w-3" /> Refund
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}