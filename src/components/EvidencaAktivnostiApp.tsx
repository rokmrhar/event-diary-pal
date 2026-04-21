import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const PEOPLE = [
  "Melissa Bajt Vodopivec",
  "Dimitrij Bensa",
  "Aljaž Bremec",
  "Klemen Brisko",
  "Leon Cijan",
  "Boris Cotič",
  "Filip Černič",
  "Tadej Devetak",
];

export default function EvidencaAktivnostiApp() {
  const [datum, setDatum] = useState("");
  const [aktivnost, setAktivnost] = useState("VAJE");
  const [drugo, setDrugo] = useState("");
  const [zacetek, setZacetek] = useState("");
  const [konec, setKonec] = useState("");
  const [kraj, setKraj] = useState("");
  const [opis, setOpis] = useState("");
  const [iskanje, setIskanje] = useState("");
  const [prisotni, setPrisotni] = useState<string[]>([]);

  const filtered = useMemo(
    () => PEOPLE.filter((p) => p.toLowerCase().includes(iskanje.toLowerCase())),
    [iskanje]
  );

  const togglePerson = (name: string) => {
    setPrisotni((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!datum || !zacetek || !konec || !kraj || !opis || prisotni.length === 0) {
      toast({ title: "Manjkajoči podatki", description: "Izpolnite vsa obvezna polja.", variant: "destructive" });
      return;
    }
    toast({ title: "Zapis shranjen", description: `${aktivnost === "DRUGO" ? drugo : aktivnost} • ${datum}` });
  };

  return (
    <main className="min-h-screen bg-background p-4 text-foreground">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">EVIDENCA AKTIVNOSTI</h1>

        <form
          onSubmit={handleSubmit}
          className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-4 space-y-5"
        >
          <div className="space-y-1.5">
            <Label htmlFor="datum">DATUM *</Label>
            <Input id="datum" type="date" value={datum} onChange={(e) => setDatum(e.target.value)} required />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium mb-2">AKTIVNOST *</legend>
            <RadioGroup value={aktivnost} onValueChange={setAktivnost} className="space-y-2">
              {["VAJE", "DELOVNI PONEDELJEK", "DELOVNI DAN"].map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <RadioGroupItem value={opt} id={opt} />
                  <Label htmlFor={opt} className="font-normal">{opt}</Label>
                </div>
              ))}
              <div className="flex items-center gap-2">
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
            <Label htmlFor="kraj">KRAJ *</Label>
            <Input id="kraj" placeholder="Lokacija" value={kraj} onChange={(e) => setKraj(e.target.value)} required />
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
            <div className="max-h-64 overflow-auto space-y-2 border border-border rounded-xl p-3 text-sm bg-secondary/30">
              {filtered.length === 0 && (
                <p className="text-muted-foreground text-center py-2">Ni zadetkov</p>
              )}
              {filtered.map((n) => (
                <label key={n} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={prisotni.includes(n)}
                    onCheckedChange={() => togglePerson(n)}
                    id={`p-${n}`}
                  />
                  <span>{n}</span>
                </label>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full rounded-2xl h-12 text-base font-semibold">
            Shrani zapis
          </Button>
        </form>
      </div>
    </main>
  );
}