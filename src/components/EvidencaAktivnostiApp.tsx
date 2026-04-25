import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DatePickerSI } from "@/components/ui/date-picker-si";
import { toast } from "@/hooks/use-toast";
import { ACTIVITY_TYPES } from "@/lib/people";
import { useMembers } from "@/hooks/useMembers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { Lock } from "lucide-react";

export default function EvidencaAktivnostiApp() {
  const { user } = useAuth();
  const { members } = useMembers();
  const { canEdit, loading: permLoading } = useModulePermissions();
  const allowed = canEdit("activities");
  const [datum, setDatum] = useState("");
  const [aktivnost, setAktivnost] = useState("VAJE");
  const [drugo, setDrugo] = useState("");
  const [zacetek, setZacetek] = useState("");
  const [konec, setKonec] = useState("");
  const [kraj, setKraj] = useState("");
  const [opis, setOpis] = useState("");
  const [iskanje, setIskanje] = useState("");
  const [prisotni, setPrisotni] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () => members.filter((p) => p.name.toLowerCase().includes(iskanje.toLowerCase())),
    [iskanje, members]
  );

  const togglePerson = (name: string) => {
    setPrisotni((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  const resetForm = () => {
    setDatum("");
    setAktivnost("VAJE");
    setDrugo("");
    setZacetek("");
    setKonec("");
    setKraj("");
    setOpis("");
    setIskanje("");
    setPrisotni([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Niste prijavljeni", description: "Prijavite se za shranjevanje.", variant: "destructive" });
      return;
    }
    if (!datum || !zacetek || !konec || !kraj || !opis || prisotni.length === 0) {
      toast({ title: "Manjkajoči podatki", description: "Izpolnite vsa obvezna polja.", variant: "destructive" });
      return;
    }
    if (aktivnost === "DRUGO" && !drugo.trim()) {
      toast({ title: "Manjka opis aktivnosti", description: "Vnesite ime aktivnosti.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { data: inserted, error } = await supabase
      .from("activities")
      .insert({
        user_id: user.id,
        datum,
        aktivnost,
        aktivnost_drugo: aktivnost === "DRUGO" ? drugo.trim() : null,
        zacetek,
        konec,
        kraj,
        opis,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      setSaving(false);
      toast({ title: "Napaka pri shranjevanju", description: error?.message ?? "Poskusite znova.", variant: "destructive" });
      return;
    }

    const { error: attErr } = await supabase
      .from("activity_attendees")
      .insert(prisotni.map((person_name) => ({ activity_id: inserted.id, person_name })));

    setSaving(false);
    if (attErr) {
      toast({ title: "Napaka pri prisotnih", description: attErr.message, variant: "destructive" });
      return;
    }

    toast({ title: "Zapis shranjen", description: `${aktivnost === "DRUGO" ? drugo : aktivnost} • ${datum}` });
    resetForm();
  };

  return (
    <AppShell>
      <div className="max-w-md md:max-w-2xl lg:max-w-3xl mx-auto p-3 sm:p-6 lg:p-8 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-wide uppercase text-foreground">
            Evidenca aktivnosti
          </h1>
        </div>

        {!permLoading && !allowed && (
          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-2">
            <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
            <h2 className="font-semibold">Nimate pravic za vnos</h2>
            <p className="text-sm text-muted-foreground">
              Za vnos aktivnosti vas mora administrator omogočiti pravice. Lahko si ogledate
              obstoječe zapise v statistiki.
            </p>
          </div>
        )}

        {allowed && (
        <form
          onSubmit={handleSubmit}
          className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-4 sm:p-6 space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="datum">DATUM *</Label>
              <DatePickerSI id="datum" value={datum} onChange={setDatum} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kraj">KRAJ *</Label>
              <Input id="kraj" placeholder="Lokacija" value={kraj} onChange={(e) => setKraj(e.target.value)} required />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium mb-2">AKTIVNOST *</legend>
            <RadioGroup value={aktivnost} onValueChange={setAktivnost} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ACTIVITY_TYPES.filter((t) => t !== "DRUGO").map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <RadioGroupItem value={opt} id={opt} />
                  <Label htmlFor={opt} className="font-normal">{opt}</Label>
                </div>
              ))}
              <div className="flex items-center gap-2 sm:col-span-2">
                <RadioGroupItem value="DRUGO" id="DRUGO" />
                <Label htmlFor="DRUGO" className="font-normal">DRUGO</Label>
                <Input
                  className="flex-1 h-9"
                  placeholder="Vnesi aktivnost"
                  value={drugo}
                  onChange={(e) => setDrugo(e.target.value)}
                  onFocus={() => setAktivnost("DRUGO")}
                />
              </div>
            </RadioGroup>
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="zacetek">ZAČETEK *</Label>
              <Input id="zacetek" type="time" value={zacetek} onChange={(e) => setZacetek(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="konec">KONEC *</Label>
              <Input id="konec" type="time" value={konec} onChange={(e) => setKonec(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="opis">OPIS / OPOMBE *</Label>
            <Textarea
              id="opis"
              placeholder="Vaš odgovor"
              className="min-h-24"
              value={opis}
              onChange={(e) => setOpis(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">PRISOTNI * <span className="text-muted-foreground font-normal">({prisotni.length})</span></div>
            <Input
              placeholder="Išči osebo..."
              value={iskanje}
              onChange={(e) => setIskanje(e.target.value)}
            />
            <div className="max-h-64 md:max-h-80 overflow-auto grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 border border-border rounded-xl p-3 text-sm bg-muted/50">
              {filtered.length === 0 && (
                <p className="text-muted-foreground text-center py-2 sm:col-span-2">Ni zadetkov</p>
              )}
              {filtered.map((m) => (
                <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={prisotni.includes(m.name)}
                    onCheckedChange={() => togglePerson(m.name)}
                    id={`p-${m.id}`}
                  />
                  <span>{m.name}</span>
                </label>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full rounded-2xl h-12 text-base font-semibold" disabled={saving}>
            {saving ? "Shranjujem..." : "Shrani zapis"}
          </Button>
        </form>
        )}
      </div>
    </AppShell>
  );
}