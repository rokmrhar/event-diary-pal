import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useMembers";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerSI } from "@/components/ui/date-picker-si";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Lock } from "lucide-react";
import { PRANJA_PROGRAMI } from "@/lib/pranja";

export default function VnosPranja() {
  const { user } = useAuth();
  const { members } = useMembers();
  const { canEdit, loading: permLoading } = useModulePermissions();
  const allowed = canEdit("pranja");
  const navigate = useNavigate();

  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10));
  const [oprema, setOprema] = useState("");
  const [programi, setProgrami] = useState<string[]>([]);
  const [dalPrat, setDalPrat] = useState("");
  const [opombe, setOpombe] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleProgram = (p: string) =>
    setProgrami((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!datum || !oprema.trim() || programi.length === 0 || !dalPrat) {
      toast({
        title: "Manjkajoči podatki",
        description: "Vnesi datum, opremo, izberi vsaj en program in osebo.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("pranja").insert({
      user_id: user.id,
      datum,
      oprema: oprema.trim(),
      programi,
      dal_prat: dalPrat,
      opombe: opombe.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Napaka", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Pranje shranjeno" });
    navigate("/pranja/arhiv");
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/pranja"><ArrowLeft className="h-4 w-4 mr-1" /> Nazaj</Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight uppercase">Vnos pranja</h1>
        </div>

        {!permLoading && !allowed && (
          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-2">
            <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
            <h2 className="font-semibold">Nimate pravic za vnos</h2>
            <p className="text-sm text-muted-foreground">
              Za vnos pranj vas mora administrator omogočiti pravice.
            </p>
          </div>
        )}

        {allowed && (
          <form onSubmit={handleSubmit} className="bg-card text-card-foreground rounded-2xl border border-border p-4 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Datum *</Label>
                <DatePickerSI value={datum} onChange={setDatum} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="oprema">Oprema / oblačilo *</Label>
                <Input
                  id="oprema"
                  placeholder="npr. Zaščitna obleka — Janez"
                  value={oprema}
                  onChange={(e) => setOprema(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Programi * <span className="text-muted-foreground font-normal">({programi.length})</span></Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 border border-border rounded-xl p-3 text-sm bg-muted/40 max-h-80 overflow-auto">
                {PRANJA_PROGRAMI.map((p) => (
                  <label key={p} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={programi.includes(p)} onCheckedChange={() => toggleProgram(p)} />
                    <span>{p}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Dal/-a prat *</Label>
              <Select value={dalPrat} onValueChange={setDalPrat}>
                <SelectTrigger><SelectValue placeholder="Izberi gasilca" /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="opombe">Opombe</Label>
              <Textarea id="opombe" rows={3} value={opombe} onChange={(e) => setOpombe(e.target.value)} />
            </div>

            <Button type="submit" disabled={saving} className="w-full rounded-2xl h-12 text-base font-semibold bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
              {saving ? "Shranjujem..." : "Shrani pranje"}
            </Button>
          </form>
        )}
      </div>
    </AppShell>
  );
}