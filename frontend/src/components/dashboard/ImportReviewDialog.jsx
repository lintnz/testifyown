import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api, { formatApiError, mediaUrl } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Loader2, Upload, DownloadCloud } from "lucide-react";
import { toast } from "sonner";

export default function ImportReviewDialog({ open, onClose }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ first_name: "", last_name: "", company: "", role: "", text: "", rating: 5, source: "Google", avatar_url: null });
  const [uploading, setUploading] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const reset = () => setF({ first_name: "", last_name: "", company: "", role: "", text: "", rating: 5, source: "Google", avatar_url: null });

  const imp = useMutation({
    mutationFn: () => api.post("/testimonials/import", { ...f, rating: f.rating || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["testimonials"] }); qc.invalidateQueries({ queryKey: ["overview"] }); toast.success("Review imported & approved"); reset(); onClose(); },
    onError: (e) => toast.error(formatApiError(e)),
  });

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { const fd = new FormData(); fd.append("file", file); const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } }); set("avatar_url", data.url); }
    catch (err) { toast.error(formatApiError(err)); } finally { setUploading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="import-dialog">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><DownloadCloud size={18} /> Import a review</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">Paste a review from Google, G2, Trustpilot, or anywhere. It's added as an approved testimonial.</p>
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="imp-first" className="mb-1.5 block">First name *</Label><Input id="imp-first" value={f.first_name} onChange={(e) => set("first_name", e.target.value)} data-testid="imp-first" /></div>
            <div><Label htmlFor="imp-last" className="mb-1.5 block">Last name</Label><Input id="imp-last" value={f.last_name} onChange={(e) => set("last_name", e.target.value)} data-testid="imp-last" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="imp-company" className="mb-1.5 block">Company</Label><Input id="imp-company" value={f.company} onChange={(e) => set("company", e.target.value)} data-testid="imp-company" /></div>
            <div><Label htmlFor="imp-role" className="mb-1.5 block">Role</Label><Input id="imp-role" value={f.role} onChange={(e) => set("role", e.target.value)} data-testid="imp-role" /></div>
          </div>
          <div><Label htmlFor="imp-text" className="mb-1.5 block">Review text *</Label><Textarea id="imp-text" rows={4} value={f.text} onChange={(e) => set("text", e.target.value)} placeholder="Paste the review here..." data-testid="imp-text" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Source</Label>
              <Select value={f.source} onValueChange={(v) => set("source", v)}>
                <SelectTrigger data-testid="imp-source"><SelectValue /></SelectTrigger>
                <SelectContent>{["Google", "G2", "Trustpilot", "Capterra", "LinkedIn", "Email", "Other"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Rating</Label>
              <div className="flex gap-1 h-10 items-center" data-testid="imp-rating">
                {[1,2,3,4,5].map((i) => <button type="button" key={i} onClick={() => set("rating", i)}><Star size={22} className={i <= f.rating ? "text-primary" : "text-muted"} fill={i <= f.rating ? "currentColor" : "transparent"} /></button>)}
              </div>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Photo (optional)</Label>
            <label className="flex items-center gap-3 p-2.5 rounded-xl border border-border cursor-pointer hover:border-primary/40 transition-colors" data-testid="imp-photo">
              {f.avatar_url ? <img src={mediaUrl(f.avatar_url)} className="w-9 h-9 rounded-full object-cover" alt="" /> : <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">{uploading ? <Loader2 className="animate-spin" size={15} /> : <Upload size={15} />}</div>}
              <span className="text-sm text-muted-foreground">{f.avatar_url ? "Change photo" : "Upload a photo"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!f.first_name.trim() || !f.text.trim() || imp.isPending} onClick={() => imp.mutate()} data-testid="imp-submit">
            {imp.isPending ? <Loader2 className="animate-spin" size={16} /> : "Import review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
