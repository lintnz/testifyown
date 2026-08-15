import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { formatApiError } from "@/lib/api";
import TestimonialWidget from "@/components/TestimonialWidget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save, Code2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const LAYOUTS = [["grid", "Grid"], ["carousel", "Carousel"], ["masonry", "Masonry"], ["single", "Single"], ["video_wall", "Video Wall"]];

export default function WidgetBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [type, setType] = useState("grid");
  const [cfg, setCfg] = useState(null);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["widget", id], queryFn: async () => (await api.get(`/widgets/${id}`)).data });
  const { data: approved = [] } = useQuery({ queryKey: ["approved-testimonials"], queryFn: async () => (await api.get("/testimonials", { params: { status: "approved" } })).data });
  const { data: tags = [] } = useQuery({ queryKey: ["tags"], queryFn: async () => (await api.get("/tags")).data });

  useEffect(() => { if (data) { setName(data.name); setType(data.type); setCfg(data.configuration); } }, [data]);

  const save = useMutation({
    mutationFn: () => api.put(`/widgets/${id}`, { name, type, configuration: cfg }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["widgets"] }); qc.invalidateQueries({ queryKey: ["widget", id] }); toast.success("Widget saved — live everywhere it's embedded"); },
    onError: (e) => toast.error(formatApiError(e)),
  });

  if (isLoading || !cfg) return <div className="space-y-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-96 rounded-2xl" /></div>;

  const set = (k, v) => setCfg((c) => ({ ...c, [k]: v }));

  // live preview filtering
  let preview = approved;
  if (cfg.source === "featured") preview = preview.filter((t) => t.featured);
  else if (cfg.source === "tag" && cfg.tag) preview = preview.filter((t) => (t.tags || []).includes(cfg.tag));
  preview = preview.slice(0, parseInt(cfg.limit) || 9);

  const embedCode = `<script src="${BACKEND_URL}/api/widget.js" data-widget-id="${id}"></script>`;
  const copyEmbed = () => { navigator.clipboard.writeText(embedCode); setCopied(true); toast.success("Copied!"); setTimeout(() => setCopied(false), 2000); };

  return (
    <div>
      <button onClick={() => navigate("/dashboard/widgets")} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-6" data-testid="back-widgets"><ArrowLeft size={16} /> Back to widgets</button>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight">{name}</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setEmbedOpen(true)} data-testid="get-embed-btn"><Code2 size={15} /> Get embed code</Button>
          <Button size="sm" className="gap-1.5" onClick={() => save.mutate()} data-testid="save-widget-btn"><Save size={15} /> Save</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Settings 40% */}
        <div className="lg:col-span-2 space-y-5">
          <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
            <div><Label className="mb-1.5 block">Widget name</Label><Input value={name} onChange={(e) => setName(e.target.value)} data-testid="wb-name" /></div>
            <div><Label className="mb-2 block">Layout</Label>
              <div className="grid grid-cols-3 gap-2">
                {LAYOUTS.map(([v, l]) => (
                  <button key={v} onClick={() => setType(v)} data-testid={`layout-${v}`} className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors ${type === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
            <h3 className="font-heading font-semibold text-sm">Content</h3>
            <div><Label className="mb-1.5 block">Show testimonials</Label>
              <Select value={cfg.source} onValueChange={(v) => set("source", v)}><SelectTrigger data-testid="wb-source"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="approved">All approved</SelectItem><SelectItem value="featured">Featured only</SelectItem><SelectItem value="tag">By tag</SelectItem></SelectContent>
              </Select>
            </div>
            {cfg.source === "tag" && (
              <div><Label className="mb-1.5 block">Tag</Label>
                <Select value={cfg.tag || ""} onValueChange={(v) => set("tag", v)}><SelectTrigger data-testid="wb-tag"><SelectValue placeholder="Select a tag" /></SelectTrigger>
                  <SelectContent>{tags.map((t) => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div><Label className="mb-2 block">Number of testimonials: {cfg.limit}</Label><Slider value={[cfg.limit]} min={1} max={20} step={1} onValueChange={([v]) => set("limit", v)} data-testid="wb-limit" /></div>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
            <h3 className="font-heading font-semibold text-sm">Appearance</h3>
            <div><Label className="mb-2 block">Theme</Label>
              <div className="grid grid-cols-2 gap-2">
                {["dark", "light"].map((th) => <button key={th} onClick={() => set("theme", th)} data-testid={`theme-${th}`} className={`px-3 py-2 rounded-lg text-sm capitalize border transition-colors ${cfg.theme === th ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{th}</button>)}
              </div>
            </div>
            {(type === "grid" || type === "masonry") && <div><Label className="mb-2 block">Columns: {cfg.columns}</Label><Slider value={[cfg.columns]} min={1} max={4} step={1} onValueChange={([v]) => set("columns", v)} data-testid="wb-columns" /></div>}
            <div className="flex gap-3 items-center"><Label className="flex-1">Accent color</Label><input type="color" value={cfg.accent_color} onChange={(e) => set("accent_color", e.target.value)} className="w-10 h-9 rounded-lg border border-border bg-transparent cursor-pointer" data-testid="wb-accent" /></div>
            <div><Label className="mb-2 block">Corner radius: {cfg.border_radius}px</Label><Slider value={[cfg.border_radius]} min={0} max={28} step={2} onValueChange={([v]) => set("border_radius", v)} data-testid="wb-radius" /></div>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <h3 className="font-heading font-semibold text-sm">Display options</h3>
            {[["show_photo", "Customer photo"], ["show_company", "Company"], ["show_role", "Role"], ["show_rating", "Rating"], ["show_video", "Video"]].map(([k, l]) => (
              <div key={k} className="flex items-center justify-between"><Label className="cursor-pointer">{l}</Label><Switch checked={cfg[k]} onCheckedChange={(v) => set(k, v)} data-testid={`wb-${k}`} /></div>
            ))}
          </div>
        </div>

        {/* Preview 60% */}
        <div className="lg:col-span-3">
          <div className="sticky top-24">
            <div className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">Live preview</div>
            <div className="rounded-2xl border border-border overflow-hidden" style={{ background: cfg.theme === "dark" ? "#0a0a0a" : "#f5f5f5" }} data-testid="widget-preview">
              <div className="p-5 min-h-[400px]">
                <TestimonialWidget widget={{ type, configuration: cfg }} testimonials={preview} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">This is how your widget will look. Changes apply live to every site once you save.</p>
          </div>
        </div>
      </div>

      <Dialog open={embedOpen} onOpenChange={setEmbedOpen}>
        <DialogContent className="max-w-lg" data-testid="embed-dialog">
          <DialogHeader><DialogTitle>Embed your widget</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">Paste this snippet where you want the testimonials to appear. Works with Webflow, WordPress, Shopify, Wix, Squarespace, Framer, Carrd, and custom HTML.</p>
          <div className="relative">
            <pre className="p-4 pr-12 rounded-xl bg-secondary text-sm overflow-x-auto font-mono text-foreground/90" data-testid="embed-code">{embedCode}</pre>
            <button onClick={copyEmbed} className="absolute top-3 right-3 p-2 rounded-lg bg-background border border-border hover:border-primary/40" data-testid="copy-embed-btn">{copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}</button>
          </div>
          <Button onClick={copyEmbed} className="gap-1.5">{copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy embed code</>}</Button>
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Installation:</p>
            <p>1. Copy the code above.</p>
            <p>2. Paste it into an HTML / embed / custom code block on your site.</p>
            <p>3. Publish — your approved testimonials appear instantly and stay in sync.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
