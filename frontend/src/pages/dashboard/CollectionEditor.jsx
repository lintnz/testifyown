import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save, ExternalLink, Share2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import ShareDialog from "@/components/dashboard/ShareDialog";

function Section({ title, children }) {
  return (
    <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
      <h3 className="font-heading font-semibold">{title}</h3>
      {children}
    </div>
  );
}
function Toggle({ label, checked, onChange, testid }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="cursor-pointer">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} data-testid={testid} />
    </div>
  );
}

export default function CollectionEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(null);
  const [share, setShare] = useState(false);
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["collection", id], queryFn: async () => (await api.get(`/collections/${id}`)).data });
  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: (body) => api.put(`/collections/${id}`, body),
    onSuccess: (r) => { setForm(r.data); qc.invalidateQueries({ queryKey: ["collections"] }); qc.invalidateQueries({ queryKey: ["collection", id] }); toast.success("Collection saved"); },
    onError: (e) => toast.error(formatApiError(e)),
  });

  if (isLoading || !form) return <div className="space-y-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-96 rounded-2xl" /></div>;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const url = `${window.location.origin}/t/${form.slug}`;
  const payload = () => {
    const { id: _i, workspace_id, views, submissions, testimonial_count, created_at, updated_at, ...rest } = form;
    return rest;
  };

  return (
    <div>
      <button onClick={() => navigate("/dashboard/collections")} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-6" data-testid="back-collections"><ArrowLeft size={16} /> Back to collections</button>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight">{form.name}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(url, "_blank")} data-testid="editor-preview"><ExternalLink size={15} /> Preview</Button>
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setShare(true)} data-testid="editor-share"><Share2 size={15} /> Share</Button>
          <Button size="sm" className="gap-1.5" onClick={() => save.mutate(payload())} data-testid="editor-save"><Save size={15} /> Save</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Section title="Page details">
            <div><Label className="mb-1.5 block">Page name</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} data-testid="ed-name" /></div>
            <div><Label className="mb-1.5 block">URL slug</Label>
              <div className="flex items-center gap-1"><span className="text-sm text-muted-foreground">/t/</span><Input value={form.slug} onChange={(e) => set("slug", e.target.value)} data-testid="ed-slug" /></div>
            </div>
            <div><Label className="mb-1.5 block">Headline</Label><Input value={form.headline || ""} onChange={(e) => set("headline", e.target.value)} data-testid="ed-headline" /></div>
            <div><Label className="mb-1.5 block">Description</Label><Textarea rows={2} value={form.description || ""} onChange={(e) => set("description", e.target.value)} data-testid="ed-description" /></div>
          </Section>

          <Section title="Branding">
            <div className="flex gap-4">
              <div className="flex-1"><Label className="mb-1.5 block">Brand color</Label><div className="flex gap-2"><input type="color" value={form.brand_color || "#ff5722"} onChange={(e) => set("brand_color", e.target.value)} className="w-11 h-10 rounded-lg border border-border bg-transparent cursor-pointer" data-testid="ed-brand-color" /><Input value={form.brand_color || ""} onChange={(e) => set("brand_color", e.target.value)} /></div></div>
            </div>
          </Section>

          <Section title="What to collect">
            <Toggle label="Allow video testimonials" checked={form.allow_video} onChange={(v) => set("allow_video", v)} testid="ed-allow-video" />
            <Toggle label="Allow written testimonials" checked={form.allow_text} onChange={(v) => set("allow_text", v)} testid="ed-allow-text" />
            <Toggle label="Collect star rating" checked={form.collect_rating} onChange={(v) => set("collect_rating", v)} testid="ed-collect-rating" />
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Customer fields">
            <Toggle label="Require email" checked={form.require_email} onChange={(v) => set("require_email", v)} testid="ed-require-email" />
            <Toggle label="Require company" checked={form.require_company} onChange={(v) => set("require_company", v)} testid="ed-require-company" />
            <Toggle label="Require job title" checked={form.require_role} onChange={(v) => set("require_role", v)} testid="ed-require-role" />
          </Section>

          <Section title="Custom questions">
            <div className="space-y-2">
              {(form.custom_questions || []).map((cq, i) => (
                <div key={i} className="flex items-center gap-2"><Input value={cq} onChange={(e) => { const arr = [...form.custom_questions]; arr[i] = e.target.value; set("custom_questions", arr); }} /><button onClick={() => set("custom_questions", form.custom_questions.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><X size={16} /></button></div>
              ))}
            </div>
            <div className="flex gap-2"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add a question" data-testid="ed-question-input" /><Button variant="secondary" size="sm" className="px-3" onClick={() => { if (q.trim()) { set("custom_questions", [...(form.custom_questions || []), q.trim()]); setQ(""); } }}><Plus size={15} /></Button></div>
          </Section>

          <Section title="Thank you & publishing">
            <div><Label className="mb-1.5 block">Thank-you message</Label><Textarea rows={2} value={form.thank_you_message || ""} onChange={(e) => set("thank_you_message", e.target.value)} data-testid="ed-thankyou" /></div>
            <div><Label className="mb-1.5 block">Redirect URL (optional)</Label><Input value={form.redirect_url || ""} onChange={(e) => set("redirect_url", e.target.value)} placeholder="https://yoursite.com/thanks" data-testid="ed-redirect" /></div>
            <Toggle label="Published (page is live)" checked={form.published} onChange={(v) => set("published", v)} testid="ed-published" />
          </Section>
        </div>
      </div>

      {share && <ShareDialog url={url} name={form.name} onClose={() => setShare(false)} />}
    </div>
  );
}
