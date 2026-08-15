import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, AlertTriangle, PartyPopper } from "lucide-react";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [state, setState] = useState("checking"); // checking|paid|timeout|error
  const [plan, setPlan] = useState(null);
  const tries = useRef(0);

  useEffect(() => {
    if (!sessionId) { setState("error"); return; }
    let cancelled = false;
    const poll = async () => {
      if (cancelled) return;
      tries.current += 1;
      try {
        const { data } = await api.get(`/payments/status/${sessionId}`);
        if (data.payment_status === "paid") {
          setPlan(data.plan);
          setState("paid");
          refreshUser().catch(() => {});
          return;
        }
        if (["expired", "failed"].includes(data.payment_status)) { setState("error"); return; }
      } catch (e) { /* keep polling */ }
      if (tries.current >= 12) { setState("timeout"); return; }
      setTimeout(poll, 2000);
    };
    poll();
    return () => { cancelled = true; };
  }, [sessionId]); // eslint-disable-line

  return (
    <div className="min-h-screen dark bg-background text-foreground flex flex-col">
      <div className="p-6"><Logo /></div>
      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="max-w-md w-full text-center">
          {state === "checking" && (<><Loader2 className="animate-spin text-primary mx-auto mb-5" size={36} /><h1 className="font-heading text-2xl font-bold mb-2">Confirming your payment…</h1><p className="text-muted-foreground">This only takes a moment.</p></>)}
          {state === "paid" && (<>
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6"><PartyPopper className="text-primary" size={30} /></div>
            <h1 className="font-heading text-3xl font-bold mb-2" data-testid="payment-success">Welcome to {plan === "business" ? "Business" : "Pro"}! 🎉</h1>
            <p className="text-muted-foreground mb-8">Your subscription is active. All premium features are unlocked.</p>
            <Button onClick={() => navigate("/dashboard")} className="h-11 px-8" data-testid="go-dashboard">Go to dashboard</Button>
          </>)}
          {state === "timeout" && (<><Loader2 className="animate-spin text-muted-foreground mx-auto mb-5" size={32} /><h1 className="font-heading text-2xl font-bold mb-2">Still processing…</h1><p className="text-muted-foreground mb-6">Your payment is being confirmed. It may take a minute to reflect.</p><Button variant="outline" onClick={() => navigate("/dashboard/settings")}>Back to settings</Button></>)}
          {state === "error" && (<><AlertTriangle className="text-destructive mx-auto mb-5" size={36} /><h1 className="font-heading text-2xl font-bold mb-2">Something went wrong</h1><p className="text-muted-foreground mb-6">We couldn't confirm this payment. If you were charged, contact support.</p><Button variant="outline" onClick={() => navigate("/dashboard/settings")}>Back to settings</Button></>)}
        </div>
      </div>
    </div>
  );
}
