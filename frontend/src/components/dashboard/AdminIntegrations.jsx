import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, ShieldCheck, Mail, MapPin, KeyRound } from "lucide-react";
import { toast } from "sonner";

function Group({ icon: Icon, title, desc, children }) {
  return (
    <div className="pb-5 mb-5 border-b border-border last:border-0 last:mb-0 last:pb-0">
      <div className="flex items-center gap-2 mb-1"><Icon size={16} className="text-primary" /><h4 className="font-medium">{title}</h4></div>
      <p className="text-xs text-muted-foreground mb-3">{desc}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export default function AdminIntegrations() {
  const qc = useQueryClient();
  const [s, setS] = useState(null);
  const { data, isLoading } = useQuery({ queryKey: ["admin-settings"], queryFn: async () => (await api.get("/admin/settings")).data });
  useEffect(() => { if (data) setS(data); }, [data]);

  const save = useMutation({
    mutationFn: () => api.put("/admin/settings", {
      recaptcha_site_key: s.recaptcha_site_key, recaptcha_secret_key: s.recaptcha_secret_key,
      resend_api_key: s.resend_api_key, sender_email: s.sender_email, google_places_api_key: s.google_places_api_key,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-settings"] }); toast.success("Integration settings saved"); },
    onError: (e) => toast.error(formatApiError(e)),
  });

  if (isLoading || !s) return <Skeleton className="h-64 rounded-2xl" />;
  const set = (k, v) => setS((x) => ({ ...x, [k]: v }));

  return (
    <div className="p-6 rounded-2xl border border-primary/30 bg-card lg:col-span-2" data-testid="admin-integrations">
      <div className="flex items-center gap-2 mb-1"><KeyRound size={18} className="text-primary" /><h3 className="font-heading font-semibold">Platform Integrations</h3><span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">Admin</span></div>
      <p className="text-sm text-muted-foreground mb-5">Manage API keys for the whole platform. Keys are stored securely and used server-side only.</p>

      <Group icon={ShieldCheck} title="Google reCAPTCHA v2" desc="Protect public testimonial forms from spam. Register a v2 Checkbox site at google.com/recaptcha/admin.">
        <div><Label className="mb-1.5 block text-xs">Site key</Label><Input value={s.recaptcha_site_key || ""} onChange={(e) => set("recaptcha_site_key", e.target.value)} placeholder="6Lc..." data-testid="set-recaptcha-site" /></div>
        <div><Label className="mb-1.5 block text-xs">Secret key</Label><Input type="password" value={s.recaptcha_secret_key || ""} onChange={(e) => set("recaptcha_secret_key", e.target.value)} placeholder="6Lc..." data-testid="set-recaptcha-secret" /></div>
      </Group>

      <Group icon={Mail} title="Resend (Email)" desc="Send new-testimonial alerts and password reset emails. Verify a domain at resend.com/domains to email anyone.">
        <div><Label className="mb-1.5 block text-xs">API key</Label><Input type="password" value={s.resend_api_key || ""} onChange={(e) => set("resend_api_key", e.target.value)} placeholder="re_..." data-testid="set-resend-key" /></div>
        <div><Label className="mb-1.5 block text-xs">Sender email</Label><Input value={s.sender_email || ""} onChange={(e) => set("sender_email", e.target.value)} placeholder="hello@yourdomain.com" data-testid="set-sender" /></div>
      </Group>

      <Group icon={MapPin} title="Google Places (Review import)" desc="Enable pulling real Google reviews. Create a key with the Places API enabled at console.cloud.google.com.">
        <div><Label className="mb-1.5 block text-xs">API key</Label><Input type="password" value={s.google_places_api_key || ""} onChange={(e) => set("google_places_api_key", e.target.value)} placeholder="AIza..." data-testid="set-google-key" /></div>
      </Group>

      <Button className="gap-1.5" onClick={() => save.mutate()} disabled={save.isPending} data-testid="save-integrations"><Save size={15} /> Save integrations</Button>
    </div>
  );
}
