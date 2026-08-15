import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { formatApiError } from "@/lib/api";
import { PageHeader, EmptyState, GridSkeleton } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FolderOpen, Plus, ExternalLink, Copy, MoreVertical, Trash2, Settings2, Eye, Share2, MessageSquareQuote } from "lucide-react";
import { toast } from "sonner";
import ShareDialog from "@/components/dashboard/ShareDialog";

export default function Collections() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [shareCol, setShareCol] = useState(null);

  const { data: cols = [], isLoading } = useQuery({ queryKey: ["collections"], queryFn: async () => (await api.get("/collections")).data });

  const create = useMutation({
    mutationFn: () => api.post("/collections", { name, published: true }),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["collections"] }); setOpen(false); setName(""); toast.success("Collection created"); navigate(`/dashboard/collections/${r.data.id}`); },
    onError: (e) => toast.error(formatApiError(e)),
  });
  const togglePub = useMutation({
    mutationFn: ({ id, published }) => api.put(`/collections/${id}`, { published }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["collections"] }); toast.success("Updated"); },
  });
  const del = useMutation({
    mutationFn: (id) => api.delete(`/collections/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["collections"] }); toast.success("Collection deleted"); },
  });

  const urlFor = (slug) => `${window.location.origin}/t/${slug}`;

  return (
    <div>
      <PageHeader title="Collection Pages" subtitle="Public pages where your customers leave testimonials.">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1.5" data-testid="new-collection-btn"><Plus size={16} /> New collection</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create a collection page</DialogTitle></DialogHeader>
            <div className="space-y-2 py-2"><Label>Page name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product Feedback" data-testid="collection-name-input" autoFocus /></div>
            <DialogFooter><Button disabled={!name.trim() || create.isPending} onClick={() => create.mutate()} data-testid="create-collection-confirm">Create page</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {isLoading ? <GridSkeleton /> : cols.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No collection pages yet"
          description="Create your first collection page to start gathering testimonials from happy customers.">
          <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-1.5" /> Create collection page</Button>
        </EmptyState>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cols.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card overflow-hidden group" data-testid={`collection-${c.id}`}>
              <div className="h-24 relative flex items-center justify-center" style={{ background: c.brand_color || "#ff5722" }}>
                <span className="font-heading font-bold text-white/90 text-lg px-4 text-center line-clamp-2">{c.headline}</span>
                <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium ${c.published ? "bg-white/25 text-white" : "bg-black/30 text-white/70"}`}>{c.published ? "Live" : "Draft"}</span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{c.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">/t/{c.slug}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><button className="text-muted-foreground p-1" data-testid={`col-menu-${c.id}`}><MoreVertical size={16} /></button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/dashboard/collections/${c.id}`)}><Settings2 size={14} className="mr-2" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(urlFor(c.slug), "_blank")}><Eye size={14} className="mr-2" /> Preview</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => togglePub.mutate({ id: c.id, published: !c.published })}>{c.published ? "Unpublish" : "Publish"}</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => del.mutate(c.id)}><Trash2 size={14} className="mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MessageSquareQuote size={13} /> {c.testimonial_count} testimonials</span>
                  <span className="flex items-center gap-1"><Eye size={13} /> {c.views} views</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="secondary" className="flex-1 gap-1.5" onClick={() => setShareCol(c)} data-testid={`share-${c.id}`}><Share2 size={14} /> Share</Button>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate(`/dashboard/collections/${c.id}`)} data-testid={`edit-${c.id}`}><Settings2 size={14} /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {shareCol && <ShareDialog url={urlFor(shareCol.slug)} name={shareCol.name} onClose={() => setShareCol(null)} />}
    </div>
  );
}
