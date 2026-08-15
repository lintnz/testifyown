import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { formatApiError, mediaUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserPlus, Loader2, X, Crown, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

export default function TeamMembers() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const { data, isLoading } = useQuery({ queryKey: ["members"], queryFn: async () => (await api.get("/members")).data });

  const invite = useMutation({
    mutationFn: () => api.post("/members/invite", { email, role }),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["members"] }); setEmail(""); toast.success(r.data.status === "added" ? "Teammate added!" : "Invite sent!"); },
    onError: (e) => toast.error(formatApiError(e)),
  });
  const remove = useMutation({
    mutationFn: (uid) => api.delete(`/members/${uid}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["members"] }); toast.success("Member removed"); },
    onError: (e) => toast.error(formatApiError(e)),
  });

  if (isLoading) return <div className="p-6 rounded-2xl border border-border bg-card lg:col-span-2"><Skeleton className="h-40 rounded-xl" /></div>;

  const isBusiness = data.plan === "business";

  return (
    <div className="p-6 rounded-2xl border border-border bg-card lg:col-span-2" data-testid="team-members">
      <div className="flex items-center gap-2 mb-1"><Users size={18} className="text-primary" /><h3 className="font-heading font-semibold">Team members</h3>
        {!isBusiness && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium flex items-center gap-1"><Lock size={11} /> Business</span>}
      </div>
      <p className="text-sm text-muted-foreground mb-5">Invite teammates to manage testimonials together.</p>

      {data.can_manage && (
        <div className="flex flex-col sm:flex-row gap-2 mb-5">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" type="email" data-testid="invite-email" disabled={!isBusiness} className="flex-1" />
          <Select value={role} onValueChange={setRole} disabled={!isBusiness}>
            <SelectTrigger className="w-full sm:w-32" data-testid="invite-role"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="member">Member</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
          </Select>
          <Button className="gap-1.5" onClick={() => invite.mutate()} disabled={!email.trim() || invite.isPending || !isBusiness} data-testid="invite-btn">
            {invite.isPending ? <Loader2 className="animate-spin" size={15} /> : <><UserPlus size={15} /> Invite</>}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {data.members.map((mMember) => (
          <div key={mMember.user_id} className="flex items-center gap-3 p-3 rounded-xl border border-border" data-testid={`member-${mMember.user_id}`}>
            <Avatar className="w-9 h-9"><AvatarImage src={mediaUrl(mMember.avatar)} /><AvatarFallback className="bg-primary/10 text-primary text-xs">{mMember.name?.[0]?.toUpperCase()}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1"><div className="text-sm font-medium truncate flex items-center gap-1.5">{mMember.name} {mMember.is_owner && <Crown size={13} className="text-primary" />}</div><div className="text-xs text-muted-foreground truncate">{mMember.email}</div></div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary capitalize">{mMember.role}</span>
            {data.can_manage && !mMember.is_owner && (
              <button onClick={() => remove.mutate(mMember.user_id)} className="text-muted-foreground hover:text-destructive p-1" data-testid={`remove-${mMember.user_id}`}><X size={16} /></button>
            )}
          </div>
        ))}
        {data.invites.map((inv) => (
          <div key={inv.email} className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border" data-testid={`invite-pending-${inv.email}`}>
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"><Mail size={15} className="text-muted-foreground" /></div>
            <div className="min-w-0 flex-1"><div className="text-sm truncate">{inv.email}</div><div className="text-xs text-muted-foreground">Invitation pending</div></div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary capitalize">{inv.role}</span>
          </div>
        ))}
      </div>

      {!isBusiness && <p className="text-xs text-muted-foreground mt-4">Upgrade to the <span className="text-foreground font-medium">Business</span> plan to invite teammates.</p>}
    </div>
  );
}
