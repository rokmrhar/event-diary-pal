import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { VEHICLES, SKUPINE } from "@/lib/people";
import { useMembers } from "@/hooks/useMembers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";

export default function EvidencaIntervencijApp() {
  const { user } = useAuth();
  const { members } = useMembers();
  const [stevilka, setStevilka] = useState("");
  const [datum, setDatum] = useState("");
  const [trajanjeOd, setTrajanjeOd] = useState("");
  const [trajanjeDo, setTrajanjeDo] = useState("");
  const [casPolneUre, setCasPolneUre] = useState("");
  const [naziv, setNaziv] = useState("");
  const [skupina, setSkupina] = useState<string>("VSA");
  const [obcina, setObcina] = useState<"sempeter" | "drugo">("sempeter");
  const [obcinaDrugo, setObcinaDrugo] = useState("");
  const [vodja, setVodja] = useState("");
  const [opombe, setOpombe] = useState("");
  const [iskanje, setIskanje] = useState("");
  const [prisotni, setPrisotni] = useState<string[]>([]);
  const [vozila, setVozila] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () => members.filter((p) => p.name.toLowerCase().includes(iskanje.toLowerCase())),
    [iskanje, members]
  );

  const togglePerson = (name: string) =>
    setPrisotni((prev) => (prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]));

  const toggleVehicle = (tip: string) =>
    setVozila((prev) => (prev.includes(tip) ? prev.filter((v) => v !== tip) : [...prev, tip]));

  const resetForm = () => {
    setStevilka("");
    setDatum("");
    setTrajanjeOd("");
    setTrajanjeDo("");
    setCasPolneUre("");
    setNaziv("");
    setSkupina("VSA");
    setObcina("sempeter");
    setObcinaDrugo("");
    setVodja("");
    setOpombe("");
    setIskanje("");
    setPrisotni([]);
    setVozila([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Niste prijavljeni", description: "Prijavite se za shranjevanje.", variant: "destructive" });
      return;
    }
    if (!datum || !trajanjeOd || !trajanjeDo || !naziv.trim() || !vodja.trim()) {
      toast({ title: "Manjkajoči podatki", description: "Izpolnite vsa obvezna polja.", variant: "destructive" });
      return;
    }
    if (obcina === "drugo" && !obcinaDrugo.trim()) {
      toast({ title: "Manjka občina", description: "Vnesite ime druge občine.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { data: inserted, error } = await supabase
      .from("interventions")
      .insert({
        user_id: user.id,
        stevilka: stevilka.trim() || null,
        datum,
        trajanje_od: trajanjeOd,
        trajanje_do: trajanjeDo,
        cas_polne_ure: casPolneUre.trim() || null,
        naziv: naziv.trim(),
        skupina,
        obcina: obcina === "sempeter" ? "Šempeter - Vrtojba" : (obcinaDrugo.trim() || "Drugo"),
        obcina_drugo: obcina === "drugo" ? obcinaDrugo.trim() : null,
        vodja: vodja.trim(),
        opombe: opombe.trim() || null,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      setSaving(false);
      toast({ title: "Napaka pri shranjevanju", description: error?.message ?? "Poskusite znova.", variant: "destructive" });
      return;
    }

    if (prisotni.length > 0) {
      const { error: pErr } = await supabase
        .from("intervention_attendees")
        .insert(prisotni.map((person_name) => ({ intervention_id: inserted.id, person_name })));
      if (pErr) {
        setSaving(false);
        toast({ title: "Napaka pri prisotnih", description: pErr.message, variant: "destructive" });
        return;
      }
    }

    if (vozila.length > 0) {
      const vRows = vozila.map((tip) => {
        const v = VEHICLES.find((x) => x.tip === tip);
        return { intervention_id: inserted.id, tip_vozila: tip, klicni_znak: v?.znak ?? null };
      });
      const { error: vErr } = await supabase.from("intervention_vehicles").insert(vRows);
      if (vErr) {
        setSaving(false);
        toast({ title: "Napaka pri vozilih", description: vErr.message, variant: "destructive" });
        return;
      }
    }

    setSaving(false);
    toast({ title: "Intervencija shranjena", description: `${naziv} • ${datum}` });
    resetForm();
  };

  return (
    <AppShell>
      <div className="max-w-md md:max-w-2xl lg:max-w-3xl mx-auto p-3 sm:p-6 lg:p-8 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-wide uppercase text-foreground">
            Poročilo o intervenciji
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-4 sm:p-6 space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="stevilka">ŠT. POROČILA</Label>
              <Input id="stevilka" placeholder="npr. 17/2026" value={stevilka} onChange={(e) => setStevilka(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="datum">DATUM *</Label>
              <Input id="datum" type="date" value={datum} onChange={(e) => setDatum(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="trajanjeOd">TRAJANJE OD *</Label>
              <Input id="trajanjeOd" type="time" value={trajanjeOd} onChange={(e) => setTrajanjeOd(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trajanjeDo">TRAJANJE DO *</Label>
              <Input id="trajanjeDo" type="time" value={trajanjeDo} onChange={(e) => setTrajanjeDo(e.target.value)} required />
            </div>
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <Label htmlFor="casPolneUre">ČAS (h, polne ure)</Label>
              <Input id="casPolneUre" placeholder="npr. 1" value={casPolneUre} onChange={(e) => setCasPolneUre(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="naziv">NAZIV INTERVENCIJE *</Label>
            <Input id="naziv" placeholder="npr. Tehnična pomoč" value={naziv} onChange={(e) => setNaziv(e.target.value)} required />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium mb-2">SKUPINA OPERATIVA *</legend>
            <RadioGroup value={skupina} onValueChange={setSkupina} className="flex flex-wrap gap-3">
              {SKUPINE.map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <RadioGroupItem value={s} id={`sk-${s}`} />
                  <Label htmlFor={`sk-${s}`} className="font-normal">{s}</Label>
                </div>
              ))}
            </RadioGroup>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium mb-2">OBČINA *</legend>
            <RadioGroup value={obcina} onValueChange={(v) => setObcina(v as "sempeter" | "drugo")} className="space-y-2">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="sempeter" id="o-sempeter" />
                <Label htmlFor="o-sempeter" className="font-normal">Šempeter – Vrtojba</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="drugo" id="o-drugo" />
                <Label htmlFor="o-drugo" className="font-normal">Druga:</Label>
                <Input
                  className="flex-1 h-9"
                  placeholder="Vnesi občino"
                  value={obcinaDrugo}
                  onChange={(e) => setObcinaDrugo(e.target.value)}
                  onFocus={() => setObcina("drugo")}
                />
              </div>
            </RadioGroup>
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="vodja">VODJA INTERVENCIJE *</Label>
            <Input id="vodja" placeholder="Ime in priimek" value={vodja} onChange={(e) => setVodja(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">VOZILA <span className="text-muted-foreground font-normal">({vozila.length})</span></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 border border-border rounded-xl p-3 text-sm bg-muted/50">
              {VEHICLES.map((v) => (
                <label key={v.tip} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={vozila.includes(v.tip)}
                    onCheckedChange={() => toggleVehicle(v.tip)}
                    id={`v-${v.tip}`}
                  />
                  <span className="font-medium">{v.tip}</span>
                  <span className="text-muted-foreground text-xs">{v.znak}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">PRISOTNI <span className="text-muted-foreground font-normal">({prisotni.length})</span></div>
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
                    id={`pi-${m.id}`}
                  />
                  <span>{m.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="opombe">OPOMBE</Label>
            <Textarea
              id="opombe"
              placeholder="Dodatne opombe..."
              className="min-h-24"
              value={opombe}
              onChange={(e) => setOpombe(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full rounded-2xl h-12 text-base font-semibold" disabled={saving}>
            {saving ? "Shranjujem..." : "Shrani intervencijo"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}