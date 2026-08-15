import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AuthShell from "@/components/AuthShell";
import GoogleButton from "@/components/GoogleButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login, formatApiError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const user = await login(email, password);
      toast.success("Welcome back!");
      navigate(user.onboarded ? "/dashboard" : "/onboarding");
    } catch (err) {
      setError(formatApiError(err));
    } finally { setLoading(false); }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage your testimonials and widgets.">
      <form onSubmit={submit} className="space-y-4" data-testid="login-form">
        <GoogleButton label="Log in with Google" />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com" data-testid="login-email" className="h-11" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline" data-testid="forgot-link">Forgot?</Link>
          </div>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" data-testid="login-password" className="h-11" />
        </div>
        {error && <p className="text-sm text-destructive" data-testid="login-error">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full h-11" data-testid="login-submit">
          {loading ? <Loader2 className="animate-spin" size={18} /> : "Log in"}
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          Don't have an account? <Link to="/register" className="text-primary hover:underline font-medium" data-testid="to-register">Sign up free</Link>
        </p>
      </form>
    </AuthShell>
  );
}
