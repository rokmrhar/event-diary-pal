import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import ForgotPassword from "@/components/ForgotPassword";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);

  useEffect(() => {
    if (!loading && user && !forgot) navigate("/", { replace: true });
  }, [user, loading, navigate, forgot]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast({ title: "Napaka pri prijavi", description: error.message, variant: "destructive" });
    } else {
      navigate("/", { replace: true });
    }
  };

  return (
  <main
    className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
    style={{ backgroundImage: "url('/background.jpg')" }}>
    <div className="absolute inset-0 bg-black/50" />

    <div className="relative w-full max-w-md space-y-6 z-10">
      <div className="text-center space-y-2 text-white">
        <h1 className="text-3xl font-bold tracking-tight">EVIDENCA AKTIVNOSTI</h1>
        <h1 className="text-3xl font-bold tracking-tight">E - PGD</h1>
        <p className="text-sm text-white/80">Prijavite se za nadaljevanje</p>
      </div>

      <div className="bg-white/90 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6">
        {forgot ? (
          <ForgotPassword onDone={() => setForgot(false)} />
        ) : (
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email-in">E-pošta</Label>
            <Input id="email-in" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pass-in">Geslo</Label>
            <Input id="pass-in" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Prijavljam..." : "Prijava"}
          </Button>

          <button type="button" onClick={() => setForgot(true)} className="text-xs underline w-full text-center text-muted-foreground">
            Pozabljeno geslo?
          </button>

          <p className="text-xs text-muted-foreground text-center">
            Za nov račun se obrnite na administratorja.
          </p>
        </form>
        )}
      </div>

      <p className="text-center text-xs text-white/80">
        <Link to="/" className="underline">Nazaj</Link>
      </p>
    </div>
  </main>
);
}
