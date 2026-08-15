import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Mail, MessageCircle, Linkedin, QrCode } from "lucide-react";
import { toast } from "sonner";

export default function ShareDialog({ url, name, onClose }) {
  const copy = () => { navigator.clipboard.writeText(url); toast.success("Link copied!"); };
  const msg = encodeURIComponent(`I'd love your feedback! Please leave a quick testimonial: ${url}`);
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;

  const links = [
    { icon: Mail, label: "Email", href: `mailto:?subject=${encodeURIComponent("Share your testimonial")}&body=${msg}` },
    { icon: MessageCircle, label: "WhatsApp", href: `https://wa.me/?text=${msg}` },
    { icon: Linkedin, label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent data-testid="share-dialog">
        <DialogHeader><DialogTitle>Share "{name}"</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">Ask your customers for a testimonial using this link.</p>
        <div className="flex gap-2">
          <Input readOnly value={url} className="text-sm" data-testid="share-url" />
          <Button variant="secondary" className="gap-1.5 flex-shrink-0" onClick={copy} data-testid="share-copy"><Copy size={15} /> Copy</Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {links.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/40 transition-colors" data-testid={`share-${l.label.toLowerCase()}`}>
              <l.icon size={20} className="text-muted-foreground" /><span className="text-xs">{l.label}</span>
            </a>
          ))}
        </div>
        <div className="flex flex-col items-center gap-2 pt-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><QrCode size={15} /> Scan the QR code</div>
          <img src={qr} alt="QR code" className="rounded-xl border border-border" width={160} height={160} data-testid="share-qr" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
