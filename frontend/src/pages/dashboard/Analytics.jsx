import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { PageHeader, StatCard } from "@/components/dashboard/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { Eye, MessageSquareQuote, TrendingUp, LayoutGrid, Video, PenLine } from "lucide-react";

export default function Analytics() {
  const { data, isLoading } = useQuery({ queryKey: ["analytics"], queryFn: async () => (await api.get("/analytics")).data });

  if (isLoading) return (
    <div><PageHeader title="Analytics" subtitle="Understand how your testimonials perform." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );

  const pie = [{ name: "Video", value: data.video, color: "#ff5722" }, { name: "Written", value: data.written, color: "#6366f1" }];

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Understand how your testimonials perform." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Page views" value={data.total_views} icon={Eye} accent />
        <StatCard label="Submissions" value={data.total_submissions} icon={MessageSquareQuote} />
        <StatCard label="Conversion rate" value={`${data.conversion_rate}%`} icon={TrendingUp} />
        <StatCard label="Widget loads" value={data.widget_loads} icon={LayoutGrid} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-card">
          <h3 className="font-heading font-semibold mb-6">Views & submissions (last 14 days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.timeseries}>
              <defs>
                <linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff5722" stopOpacity={0.4} /><stop offset="100%" stopColor="#ff5722" stopOpacity={0} /></linearGradient>
                <linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="views" stroke="#ff5722" strokeWidth={2} fill="url(#v)" name="Views" />
              <Area type="monotone" dataKey="submissions" stroke="#6366f1" strokeWidth={2} fill="url(#s)" name="Submissions" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card">
          <h3 className="font-heading font-semibold mb-6">Testimonial types</h3>
          {data.video + data.written === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No testimonials yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {pie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
