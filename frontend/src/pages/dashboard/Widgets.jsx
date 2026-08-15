import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { formatApiError } from "@/lib/api";
import { PageHeader, EmptyState, GridSkeleton } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LayoutGrid, Plus, MoreVertical, Trash2, Settings2, Code2, GalleryHorizontal, Rows3, Square, Columns3, Film } from "lucide-react";
import { toast } from "sonner";

const TYPES = {
  grid: { label: "Grid", icon: LayoutGrid }, carousel: { label: "Carousel", icon: GalleryHorizontal },
  masonry: { label: "Masonry", icon: Rows3 }, single: { label: "Single", icon: Square }, video_wall: { label: "Video Wall", icon: Film },
};

export default function Widgets() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("grid");

  const { data: widgets = [], isLoading } = useQuery({ queryKey: ["widgets"], queryFn: async () => (await api.get("/widgets")).data });

  const create = useMutation({
    mutationFn: () => api.post("/widgets", { name, type }),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["widgets"] }); setOpen(false); setName(""); toast.success("Widget created"); navigate(`/dashboard/widgets/${r.data.id}`); },
    onError: (e) => toast.error(formatApiError(e)),
  });
  const del = useMutation({ mutationFn: (id) => api.delete(`/widgets/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ["widgets"] }); toast.success("Widget deleted"); } });

  return (
    <div>
      <PageHeader title="Widgets" subtitle="Embed beautiful testimonial widgets on any website.">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1.5" data-testid="new-widget-btn"><Plus size={16} /> New widget</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create a widget</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label className="mb-1.5 block">Widget name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Homepage Wall of Love" data-testid="widget-name-input" autoFocus /></div>
              <div><Label className="mb-1.5 block">Layout</Label>
                <Select value={type} onValueChange={setType}><SelectTrigger data-testid="widget-type-select"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TYPES).map(([v, t]) => <SelectItem key={v} value={v}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button disabled={!name.trim() || create.isPending} onClick={() => create.mutate()} data-testid="create-widget-confirm">Create widget</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {isLoading ? <GridSkeleton /> : widgets.length === 0 ? (
        <EmptyState icon={LayoutGrid} title="No widgets yet"
          description="Create a widget to showcase your approved testimonials on your website with one line of code.">
          <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-1.5" /> Create your first widget</Button>
        </EmptyState>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((w) => {
            const T = TYPES[w.type] || TYPES.grid;
            return (
              <div key={w.id} className="p-5 rounded-2xl border border-border bg-card" data-testid={`widget-${w.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center"><T.icon size={20} className="text-primary" /></div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><button className="text-muted-foreground p-1" data-testid={`wid-menu-${w.id}`}><MoreVertical size={16} /></button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/dashboard/widgets/${w.id}`)}><Settings2 size={14} className="mr-2" /> Edit & embed</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => del.mutate(w.id)}><Trash2 size={14} className="mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="font-semibold mb-1">{w.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{T.label} · {w.loads || 0} loads</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" className="flex-1 gap-1.5" onClick={() => navigate(`/dashboard/widgets/${w.id}`)} data-testid={`edit-widget-${w.id}`}><Settings2 size={14} /> Customize</Button>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate(`/dashboard/widgets/${w.id}`)}><Code2 size={14} /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
