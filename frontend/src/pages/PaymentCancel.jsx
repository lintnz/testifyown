import React from "react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function PaymentCancel() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen dark bg-background text-foreground flex flex-col">
      <div className="p-6"><Logo /></div>
      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="max-w-md w-full text-center">
          <XCircle className="text-muted-foreground mx-auto mb-5" size={36} />
          <h1 className="font-heading text-2xl font-bold mb-2" data-testid="payment-cancel">Checkout cancelled</h1>
          <p className="text-muted-foreground mb-8">No worries — you haven't been charged. You can upgrade anytime.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>Back to dashboard</Button>
            <Button onClick={() => navigate("/dashboard/settings")}>View plans</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
