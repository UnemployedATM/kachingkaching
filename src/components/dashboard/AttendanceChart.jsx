import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export default function AttendanceChart({ bookings }) {
  const completed = bookings.filter((b) => b.status === "completed").length;
  const noShow = bookings.filter((b) => b.status === "no_show").length;
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;

  const data = [
    { name: "Completed",  value: completed },
    { name: "No-Show",    value: noShow },
    { name: "Cancelled",  value: cancelled },
    { name: "Confirmed",  value: confirmed },
  ].filter((d) => d.value > 0);

  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--destructive))",
    "hsl(var(--chart-3))",
  ];

  if (data.length === 0) {
    return (
      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Attendance Ratio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
            No booking data yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Attendance Ratio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}