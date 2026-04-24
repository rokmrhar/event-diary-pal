import { Link } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, ClipboardCheck } from "lucide-react";

const TILES = [
  { to: "/servisi/knjiga", label: "Knjiga servisov in popravil", icon: Wrench, desc: "Vsi servisi in popravila vozil" },
  { to: "/servisi/tehnicni-pregledi", label: "Tehnični pregledi", icon: ClipboardCheck, desc: "Datumi tehničnih pregledov vozil" },
];

export default function Servisi() {
  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-brand-red flex items-center justify-center text-brand-red-foreground">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pregled servisov</h1>
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