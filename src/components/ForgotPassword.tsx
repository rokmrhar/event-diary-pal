import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function ForgotPassword({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [busy, setBusy] = useState(false);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth`,
    });
    setBusy(false);
    if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
    toast({ title: "Koda poslana", description: "Preverite e-pošto in vpišite prejeto kodo." });
    setStep(2);
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pass.length < 6) return toast({ title: "Geslo mora imeti vsaj 6 znakov", variant: "destructive" });
    if (pass !== pass2) return toast({ title: "Gesli se ne ujemata", variant: "destructive" });
    setBusy(true);
    const { error: vErr } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "recovery" });
    if (vErr) {
      setBusy(false);
      return toast({ title: "Napačna ali potekla koda", description: vErr.message, variant: "destructive" });
    }
    const { error } = await supabase.auth.updateUser({ password: pass });
    setBusy(false);
    if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
    toast({ title: "Geslo spremenjeno" });
    onDone();
  };

  if (step === 1)
    return (
      <form onSubmit={sendCode} className="space-y-4">
        <h2 className="font-semibold">Pozabljeno geslo</h2>
        <div className="space-y-1.5">
          <Label htmlFor="fp-email">E-pošta uporabnika</Label>
          <Input id="fp-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Pošiljam..." : "Pošlji kodo"}</Button>
        <button type="button" onClick={onDone} className="text-xs underline w-full text-center text-muted-foreground">Nazaj na prijavo</button>
      </form>
    );

  return (
    <form onSubmit={reset} className="space-y-4">
      <h2 className="font-semibold">Nastavi novo geslo</h2>
      <p className="text-xs text-muted-foreground">Koda je bila poslana na {email}.</p>
      <div className="space-y-1.5">
        <Label htmlFor="fp-code">Koda iz e-pošte</Label>
        <Input id="fp-code" inputMode="numeric" required value={code} onChange={(e) => setCode(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fp-p1">Novo geslo</Label>
        <Input id="fp-p1" type="password" required value={pass} onChange={(e) => setPass(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fp-p2">Ponovi novo geslo</Label>
        <Input id="fp-p2" type="password" required value={pass2} onChange={(e) => setPass2(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Shranjujem..." : "Zamenjaj geslo"}</Button>
      <div className="flex justify-between text-xs">
        <button type="button" onClick={() => setStep(1)} className="underline text-muted-foreground">Ponovno pošlji kodo</button>
        <button type="button" onClick={onDone} className="underline text-muted-foreground">Nazaj na prijavo</button>
      </div>
    </form>
  );
}
