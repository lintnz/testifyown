import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import AuthShell from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await api.post("/auth/reset-password", { token, password });
      toast.success("Password reset! Please log in.");
      navigate("/login");
    } catch (err) { setError(formatApiError(err)); }
    finally { setLoading(false); }
  };

  if (!token) {
    return (
      <AuthShell title="Invalid link" subtitle="This reset link is missing or invalid.">
        <Link to="/forgot-password" className="text-primary hover:underline">Request a new link</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password you'll remember.">
      <form onSubmit={submit} className="space-y-4" data-testid="reset-form">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" data-testid="reset-password" className="h-11" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full h-11" data-testid="reset-submit">
          {loading ? <Loader2 className="animate-spin" size={18} /> : "Reset password"}
        </Button>
      </form>
    </AuthShell>
  );
}
