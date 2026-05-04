import { Link } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Biohazard, Plus, Archive } from "lucide-react";
import PageHeader from "@/components/PageHeader";

export default function Pranja() {
  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <PageHeader title="Evidenca pranj" icon={Biohazard} description="Vnos in pregled pranj opreme" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/pranja/vnos" className="block group">
            <Card className="h-full transition-all group-hover:shadow-md group-hover:border-brand-red/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plus className="h-5 w-5 text-brand-red" />
                  Vnos pranja
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Zabeleži novo pranje opreme ali oblačil.
              </CardContent>
            </Card>
          </Link>

          <Link to="/pranja/arhiv" className="block group">
            <Card className="h-full transition-all group-hover:shadow-md group-hover:border-brand-red/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Archive className="h-5 w-5 text-brand-red" />
                  Arhiv pranj
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Pregled vseh evidentiranih pranj.
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
