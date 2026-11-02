import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function ForgotPassword({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
    setSent(true);
  };

  if (sent)
    return (
      <div className="space-y-4 text-sm">
        <h2 className="font-semibold">Preverite e-pošto</h2>
        <p>Na <b>{email}</b> smo poslali povezavo za ponastavitev gesla. Kliknite povezavo v sporočilu in nastavite novo geslo.</p>
        <button type="button" onClick={onDone} className="text-xs underline w-full text-center text-muted-foreground">Nazaj na prijavo</button>
      </div>
    );

  return (
    <form onSubmit={sendLink} className="space-y-4">
      <h2 className="font-semibold">Pozabljeno geslo</h2>
      <div className="space-y-1.5">
        <Label htmlFor="fp-email">E-pošta uporabnika</Label>
        <Input id="fp-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Pošiljam..." : "Pošlji povezavo"}</Button>
      <button type="button" onClick={onDone} className="text-xs underline w-full text-center text-muted-foreground">Nazaj na prijavo</button>
    </form>
  );
}
