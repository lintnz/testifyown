import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Loader2, CheckCircle2, AlertCircle, Lock, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CustomDomain({ workspace }) {
  const qc = useQueryClient();
  const [domain, setDomain] = useState(workspace.custom_domain || "");
  useEffect(() => { setDomain(workspace.custom_domain || ""); }, [workspace.custom_domain]);

  const isBusiness = workspace.plan === "business";
  const status = workspace.domain_status;
  const token = workspace.domain_token;
  const host = typeof window !== "undefined" ? window.location.host : "";

  const save = useMutation({
    mutationFn: () => api.put("/workspace/domain", { domain }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workspace"] }); toast.success("Domain saved — now add the DNS records and verify"); },
    onError: (e) => toast.error(formatApiError(e)),
  });
  const verify = useMutation({
    mutationFn: () => api.post("/workspace/domain/verify"),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["workspace"] }); r.data.status === "verified" ? toast.success("Domain verified! 🎉") : toast.error("DNS records not found yet. They can take a few minutes to propagate."); },
    onError: (e) => toast.error(formatApiError(e)),
  });
  const remove = useMutation({
    mutationFn: () => api.delete("/workspace/domain"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workspace"] }); setDomain(""); toast.success("Custom domain removed"); },
  });

  const copy = (v) => { navigator.clipboard.writeText(v); toast.success("Copied!"); };

  return (
    <div className="p-6 rounded-2xl border border-border bg-card lg:col-span-2" data-testid="custom-domain">
      <div className="flex items-center gap-2 mb-1"><Globe size={18} className="text-primary" /><h3 className="font-heading font-semibold">Custom domain</h3>
        {!isBusiness && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium flex items-center gap-1"><Lock size={11} /> Business</span>}
        {isBusiness && status === "verified" && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-medium flex items-center gap-1"><CheckCircle2 size={11} /> Verified</span>}
        {isBusiness && status === "pending" && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-medium">Pending</span>}
        {isBusiness && status === "failed" && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 font-medium flex items-center gap-1"><AlertCircle size={11} /> Not verified</span>}
      </div>
      <p className="text-sm text-muted-foreground mb-5">Serve your collection pages from your own domain, e.g. <code className="px-1 rounded bg-secondary">reviews.yourbrand.com</code>.</p>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="reviews.yourbrand.com" disabled={!isBusiness} data-testid="domain-input" className="flex-1" />
        <Button onClick={() => save.mutate()} disabled={!domain.trim() || save.isPending || !isBusiness} data-testid="domain-save">{save.isPending ? <Loader2 className="animate-spin" size={15} /> : "Save domain"}</Button>
        {workspace.custom_domain && <Button variant="ghost" size="icon" onClick={() => remove.mutate()} data-testid="domain-remove"><Trash2 size={16} className="text-destructive" /></Button>}
      </div>

      {isBusiness && workspace.custom_domain && (
        <div className="space-y-3 p-4 rounded-xl bg-secondary/40 border border-border" data-testid="dns-instructions">
          <p className="text-sm font-medium">Add these DNS records at your domain provider:</p>
          <DnsRow type="TXT" name={`_testify.${workspace.custom_domain}`} value={token || ""} onCopy={copy} />
          <DnsRow type="CNAME" name={workspace.custom_domain} value={host} onCopy={copy} />
          <Button size="sm" className="gap-1.5 mt-1" onClick={() => verify.mutate()} disabled={verify.isPending} data-testid="domain-verify">
            {verify.isPending ? <Loader2 className="animate-spin" size={14} /> : <><CheckCircle2 size={14} /> Verify domain</>}
          </Button>
          <p className="text-xs text-muted-foreground">Note: DNS can take a few minutes to propagate. Final HTTPS routing activates once your app is deployed to production.</p>
        </div>
      )}
      {!isBusiness && <p className="text-xs text-muted-foreground">Upgrade to the <span className="text-foreground font-medium">Business</span> plan to connect a custom domain.</p>}
    </div>
  );
}

function DnsRow({ type, name, value, onCopy }) {
  return (
    <div className="grid grid-cols-[60px_1fr_auto] items-center gap-2 text-xs">
      <span className="px-2 py-1 rounded bg-background font-mono text-center">{type}</span>
      <div className="min-w-0"><div className="font-mono truncate text-muted-foreground">{name}</div><div className="font-mono truncate">{value}</div></div>
      <button onClick={() => onCopy(value)} className="p-1.5 rounded hover:bg-background"><Copy size={13} /></button>
    </div>
  );
}
