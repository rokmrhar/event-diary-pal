import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pass.length < 6) return toast({ title: "Geslo mora imeti vsaj 6 znakov", variant: "destructive" });
    if (pass !== pass2) return toast({ title: "Gesli se ne ujemata", variant: "destructive" });
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pass });
    setBusy(false);
    if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
    await logAudit("Ponastavitev gesla");
    toast({ title: "Geslo spremenjeno" });
    navigate("/", { replace: true });
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center" style={{ backgroundImage: "url('/background.jpg')" }}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-md bg-white/90 rounded-2xl shadow-xl p-6 z-10">
        {ready ? (
          <form onSubmit={submit} className="space-y-4">
            <h2 className="font-semibold">Nastavi novo geslo</h2>
            <div className="space-y-1.5">
              <Label htmlFor="rp1">Novo geslo</Label>
              <Input id="rp1" type="password" required value={pass} onChange={(e) => setPass(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rp2">Ponovi novo geslo</Label>
              <Input id="rp2" type="password" required value={pass2} onChange={(e) => setPass2(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Shranjujem..." : "Zamenjaj geslo"}</Button>
          </form>
        ) : (
          <div className="space-y-3 text-sm">
            <p>Povezava za ponastavitev gesla ni veljavna ali je potekla.</p>
            <Link to="/auth" className="underline">Nazaj na prijavo</Link>
          </div>
        )}
      </div>
    </main>
  );
}
