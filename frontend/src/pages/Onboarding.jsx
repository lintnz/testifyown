import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, Copy, ExternalLink, ArrowRight, PartyPopper } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#ff5722", "#6366f1", "#ec4899", "#10b981", "#f59e0b", "#0ea5e9", "#8b5cf6", "#ef4444"];

export default function Onboarding() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [business, setBusiness] = useState("");
  const [color, setColor] = useState("#ff5722");
  const [collectionName, setCollectionName] = useState("Customer Testimonials");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const publicUrl = result ? `${window.location.origin}/t/${result.collection.slug}` : "";

  const finish = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/onboarding", { business_name: business, primary_color: color, collection_name: collectionName });
      setResult(data);
      await refreshUser();
      setStep(4);
    } catch (e) { toast.error(formatApiError(e)); }
    finally { setLoading(false); }
  };

  const copy = () => { navigator.clipboard.writeText(publicUrl); toast.success("Link copied!"); };

  return (
    <div className="min-h-screen dark bg-background text-foreground flex flex-col">
      <div className="p-6"><Logo /></div>
      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-lg">
          {step < 4 && (
            <div className="flex gap-2 mb-10">
              {[1, 2, 3].map((s) => <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-secondary"}`} />)}
            </div>
          )}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="font-heading text-3xl font-bold tracking-tight mb-2">What's your business called?</h1>
                <p className="text-muted-foreground mb-8">This appears on your public testimonial page.</p>
                <Input autoFocus value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="Acme Inc." className="h-12 text-lg mb-6" data-testid="onboard-business" />
                <Button disabled={!business.trim()} onClick={() => setStep(2)} className="w-full h-11 gap-2" data-testid="onboard-next-1">Continue <ArrowRight size={16} /></Button>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="font-heading text-3xl font-bold tracking-tight mb-2">Pick your brand color</h1>
                <p className="text-muted-foreground mb-8">We'll use this across your collection page and widgets.</p>
                <div className="grid grid-cols-4 gap-3 mb-8">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setColor(c)} data-testid={`color-${c}`}
                      className={`h-16 rounded-2xl transition-transform active:scale-95 ${color === c ? "ring-2 ring-offset-2 ring-offset-background ring-white" : ""}`}
                      style={{ background: c }}>{color === c && <Check className="text-white mx-auto" />}</button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="h-11">Back</Button>
                  <Button onClick={() => setStep(3)} className="flex-1 h-11 gap-2" data-testid="onboard-next-2">Continue <ArrowRight size={16} /></Button>
                </div>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="font-heading text-3xl font-bold tracking-tight mb-2">Name your collection page</h1>
                <p className="text-muted-foreground mb-8">The public page where customers leave testimonials.</p>
                <Input value={collectionName} onChange={(e) => setCollectionName(e.target.value)} placeholder="Customer Testimonials" className="h-12 text-lg mb-6" data-testid="onboard-collection" />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="h-11">Back</Button>
                  <Button disabled={loading || !collectionName.trim()} onClick={finish} className="flex-1 h-11 gap-2" data-testid="onboard-finish">
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <>Create my page <ArrowRight size={16} /></>}
                  </Button>
                </div>
              </motion.div>
            )}
            {step === 4 && result && (
              <motion.div key="4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6"><PartyPopper className="text-primary" size={30} /></div>
                <h1 className="font-heading text-3xl font-bold tracking-tight mb-2">Your testimonial link is ready! 🎉</h1>
                <p className="text-muted-foreground mb-8">Share it with a happy customer and watch the testimonials roll in.</p>
                <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-card mb-6">
                  <span className="flex-1 text-sm truncate text-left px-1" data-testid="onboard-link">{publicUrl}</span>
                  <Button size="sm" variant="secondary" onClick={copy} className="gap-1.5 flex-shrink-0" data-testid="onboard-copy"><Copy size={14} /> Copy</Button>
                </div>
                <div className="flex flex-col gap-3">
                  <a href={publicUrl} target="_blank" rel="noreferrer"><Button variant="outline" className="w-full h-11 gap-2" data-testid="onboard-preview"><ExternalLink size={16} /> Preview page</Button></a>
                  <Button onClick={() => navigate("/dashboard")} className="w-full h-11" data-testid="onboard-dashboard">Go to dashboard</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
