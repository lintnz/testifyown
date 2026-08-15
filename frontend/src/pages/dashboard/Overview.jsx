import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { mediaUrl, formatApiError } from "@/lib/api";
import { PageHeader, StatCard, EmptyState } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquareQuote, CheckCircle2, Video, PenLine, Clock, TrendingUp, Star, Eye, Check, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function Overview() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["overview"], queryFn: async () => (await api.get("/overview")).data });

  const approve = useMutation({
    mutationFn: (id) => api.post(`/testimonials/${id}/status`, { status: "approved" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["overview"] }); toast.success("Testimonial approved"); },
    onError: (e) => toast.error(formatApiError(e)),
  });

  const stats = [
    { label: "Total testimonials", value: data?.total ?? 0, icon: MessageSquareQuote, accent: true },
    { label: "New / pending", value: data?.new ?? 0, icon: Clock },
    { label: "Approved", value: data?.approved ?? 0, icon: CheckCircle2 },
    { label: "This month", value: data?.this_month ?? 0, icon: TrendingUp },
    { label: "Video", value: data?.video ?? 0, icon: Video },
    { label: "Written", value: data?.written ?? 0, icon: PenLine },
    { label: "Featured", value: data?.featured ?? 0, icon: Star },
    { label: "Page views", value: data?.views ?? 0, icon: Eye },
  ];

  return (
    <div>
      <PageHeader title="Overview" subtitle="A snapshot of your testimonials and activity.">
        <Button className="gap-1.5" onClick={() => navigate("/dashboard/collections")} data-testid="overview-collect">
          <Sparkles size={16} /> Collect a testimonial
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          : stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-lg font-semibold">Recent testimonials</h2>
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => navigate("/dashboard/testimonials")}>View all <ArrowRight size={14} /></Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : data?.recent?.length ? (
        <div className="space-y-3">
          {data.recent.map((t) => (
            <div key={t.id} className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors" data-testid={`recent-${t.id}`}>
              <Avatar className="w-11 h-11 flex-shrink-0">
                <AvatarImage src={mediaUrl(t.avatar_url)} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">{t.first_name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{t.first_name} {t.last_name}</span>
                  {t.video_url && <span className="inline-flex items-center gap-1 text-xs text-primary"><Video size={12} /> Video</span>}
                </div>
                <p className="text-sm text-muted-foreground truncate">{t.text || "Video testimonial"}</p>
                <span className="text-xs text-muted-foreground/70">{t.submitted_at && formatDistanceToNow(new Date(t.submitted_at), { addSuffix: true })}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {t.status === "pending" && (
                  <Button size="sm" variant="secondary" className="gap-1 h-8" onClick={() => approve.mutate(t.id)} data-testid={`approve-${t.id}`}>
                    <Check size={14} /> Approve
                  </Button>
                )}
                <Button size="sm" variant="outline" className="h-8" onClick={() => navigate(`/dashboard/testimonials/${t.id}`)} data-testid={`view-${t.id}`}>View</Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={MessageSquareQuote} title="No testimonials yet"
          description="Your first testimonial is waiting for you. Share your collection link with a happy customer and it'll appear here.">
          <Button onClick={() => navigate("/dashboard/collections")} data-testid="empty-collect">Share your collection link</Button>
        </EmptyState>
      )}
    </div>
  );
}
