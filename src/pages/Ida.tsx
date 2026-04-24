import { Link } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Wind, Droplets, Cylinder, Stethoscope, Gauge } from "lucide-react";

const TILES = [
  { to: "/ida/maske", label: "Maske", icon: Wind, desc: "Evidenca obraznih mask" },
  { to: "/ida/hrbtisca", label: "Hrbtišča", icon: Droplets, desc: "Evidenca hrbtišč IDA" },
  { to: "/ida/tlacne-posode", label: "Tlačne posode", icon: Cylinder, desc: "Evidenca tlačnih posod" },
  { to: "/ida/pljucni-avtomati", label: "Pljučni avtomati", icon: Stethoscope, desc: "Evidenca pljučnih avtomatov" },
  { to: "/ida/polnjenja", label: "Polnjenja posod", icon: Gauge, desc: "Evidenca polnjenj tlačnih posod" },
  { to: "/ida/seznam-vozila", label: "Seznam IDA po vozilih", icon: Gauge, desc: "Seznam IDA po vozilih" },
];

export default function Ida() {
  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-brand-red flex items-center justify-center text-brand-red-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Evidenca IDA</h1>
            <p className="text-sm text-muted-foreground">Izberi evidenco</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TILES.map((t) => (
            <Link key={t.to} to={t.to} className="group">
              <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-brand-red border-2 border-transparent">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="h-14 w-14 rounded-xl bg-brand-navy/5 group-hover:bg-brand-red/10 flex items-center justify-center transition-colors">
                    <t.icon className="h-7 w-7 text-brand-red" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold tracking-tight">{t.label}</h2>
                    <p className="text-sm text-muted-foreground">{t.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
