import React, { useState } from "react";
import { Link } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import AuthShell from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MailCheck } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) { setError(formatApiError(err)); }
    finally { setLoading(false); }
  };

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a secure link to reset it.">
      {sent ? (
        <div className="p-6 rounded-2xl bg-card border border-border/60 text-center space-y-3" data-testid="forgot-success">
          <MailCheck className="mx-auto text-primary" size={32} />
          <p className="text-sm">If an account exists for <strong>{email}</strong>, a reset link is on its way.</p>
          <Link to="/login" className="text-primary hover:underline text-sm">Back to login</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" data-testid="forgot-form">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" data-testid="forgot-email" className="h-11" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full h-11" data-testid="forgot-submit">
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Send reset link"}
          </Button>
          <p className="text-sm text-center text-muted-foreground"><Link to="/login" className="text-primary hover:underline">Back to login</Link></p>
        </form>
      )}
    </AuthShell>
  );
}
