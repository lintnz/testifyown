import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Crown, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

export default function Billing({ currentPlan = "free" }) {
  const [loadingKey, setLoadingKey] = useState(null);
  const { data: plans = [], isLoading } = useQuery({ queryKey: ["plans"], queryFn: async () => (await api.get("/plans")).data });

  const upgrade = async (lookup_key) => {
    setLoadingKey(lookup_key);
    try {
      const { data } = await api.post("/payments/checkout", { lookup_key, origin_url: window.location.origin });
      window.location.href = data.checkout_url;
    } catch (e) { toast.error(formatApiError(e)); setLoadingKey(null); }
  };

  return (
    <div className="p-6 rounded-2xl border border-border bg-card lg:col-span-2" data-testid="billing">
      <div className="flex items-center gap-2 mb-1"><Crown size={18} className="text-primary" /><h3 className="font-heading font-semibold">Plans & billing</h3></div>
      <p className="text-sm text-muted-foreground mb-5">You're currently on the <span className="capitalize font-medium text-foreground">{currentPlan}</span> plan.</p>
      {isLoading ? <Skeleton className="h-52 rounded-2xl" /> : (
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((p) => {
            const isCurrent = p.id === currentPlan;
            const isPro = p.id === "pro";
            return (
              <div key={p.id} className={`p-5 rounded-2xl border flex flex-col ${isPro ? "border-primary bg-primary/[0.05]" : "border-border"}`} data-testid={`plan-${p.id}`}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-heading font-semibold">{p.name}</h4>
                  {isPro && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">Popular</span>}
                </div>
                <div className="flex items-end gap-1 mb-4"><span className="font-heading text-3xl font-bold">${p.price}</span>{p.price > 0 && <span className="text-muted-foreground text-sm mb-1">/mo</span>}</div>
                <ul className="space-y-2 mb-5 flex-1">
                  {p.features.map((f) => <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground"><Check size={15} className="text-primary mt-0.5 flex-shrink-0" /> {f}</li>)}
                </ul>
                {isCurrent ? (
                  <Button variant="secondary" disabled className="w-full" data-testid={`current-${p.id}`}>Current plan</Button>
                ) : p.lookup_key ? (
                  <Button className="w-full gap-1.5" onClick={() => upgrade(p.lookup_key)} disabled={loadingKey === p.lookup_key} data-testid={`upgrade-${p.id}`}>
                    {loadingKey === p.lookup_key ? <Loader2 className="animate-spin" size={16} /> : <><Zap size={15} /> Upgrade to {p.name}</>}
                  </Button>
                ) : (
                  <Button variant="outline" disabled className="w-full">Free forever</Button>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-4">Test mode — use card <code className="px-1 rounded bg-secondary">4242 4242 4242 4242</code>, any future expiry, CVC, ZIP, phone & email.</p>
    </div>
  );
}
