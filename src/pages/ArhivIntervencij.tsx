import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AppShell from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Trash2, Calendar, MapPin, Clock, User, Users, Truck } from "lucide-react";

type InterventionRow = {
  id: string;
  user_id: string;
  stevilka: string | null;
  datum: string;
  trajanje_od: string;
  trajanje_do: string;
  cas_polne_ure: string | null;
  naziv: string;
  skupina: string;
  obcina: string;
  vodja: string;
  opombe: string | null;
};

type AttendeeRow = { intervention_id: string; person_name: string };
type VehicleRow = { intervention_id: string; tip_vozila: string; klicni_znak: string | null };

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("sl-SI");
const formatTime = (t: string) => t.slice(0, 5);

const ArhivIntervencij = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);
  const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  const load = async () => {
    const [iRes, aRes, vRes] = await Promise.all([
      supabase.from("interventions").select("*").order("datum", { ascending: false }),
      supabase.from("intervention_attendees").select("intervention_id, person_name"),
      supabase.from("intervention_vehicles").select("intervention_id, tip_vozila, klicni_znak"),
    ]);
    if (iRes.error) {
      toast({ title: "Napaka pri nalaganju", description: iRes.error.message, variant: "destructive" });
      return;
    }
    setInterventions((iRes.data ?? []) as InterventionRow[]);
    setAttendees((aRes.data ?? []) as AttendeeRow[]);
    setVehicles((vRes.data ?? []) as VehicleRow[]);
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return interventions;
    return interventions.filter(
      (i) =>
        i.naziv.toLowerCase().includes(q) ||
        i.vodja.toLowerCase().includes(q) ||
        (i.stevilka ?? "").toLowerCase().includes(q) ||
        i.obcina.toLowerCase().includes(q)
    );
  }, [interventions, search]);

  const handleDelete = async (i: InterventionRow) => {
    if (!confirm(`Izbriši intervencijo "${i.naziv}"?`)) return;
    setBusy(true);
    const { error } = await supabase.from("interventions").delete().eq("id", i.id);
    setBusy(false);
    if (error) {
      toast({ title: "Napaka pri brisanju", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Intervencija izbrisana" });
    load();
  };

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Nalagam...</p>
      </main>
    );
  }

  return (
    <AppShell>
      <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto p-3 sm:p-6 lg:p-8 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-wide uppercase text-foreground">
            Arhiv intervencij
          </h1>
          <Button onClick={() => navigate("/intervencija")} size="sm">
            Nova intervencija
          </Button>
        </div>

        <Input
          placeholder="Išči po nazivu, vodji, številki, občini..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {visible.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
            Ni zapisov.
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {visible.map((i) => {
              const att = attendees.filter((a) => a.intervention_id === i.id);
              const veh = vehicles.filter((v) => v.intervention_id === i.id);
              const canDelete = isAdmin || i.user_id === user.id;
              return (
                <AccordionItem
                  key={i.id}
                  value={i.id}
                  className="bg-card border border-border rounded-xl px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-1 items-center justify-between gap-3 pr-2 text-left">
                      <div className="flex flex-col items-start gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {i.stevilka && (
                            <Badge variant="secondary" className="text-xs">#{i.stevilka}</Badge>
                          )}
                          <span className="font-semibold truncate">{i.naziv}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(i.datum)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(i.trajanje_od)}–{formatTime(i.trajanje_do)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {i.obcina}
                          </span>
                        </div>
                      </div>
                      <Badge className="shrink-0">SKUP. {i.skupina}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="text-xs text-muted-foreground">Vodja</div>
                          <div className="font-medium">{i.vodja}</div>
                        </div>
                      </div>
                      {i.cas_polne_ure && (
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="text-xs text-muted-foreground">Čas (h)</div>
                            <div className="font-medium">{i.cas_polne_ure}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {veh.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Truck className="h-3 w-3" /> Vozila ({veh.length})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {veh.map((v, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {v.tip_vozila}
                              {v.klicni_znak ? ` · ${v.klicni_znak}` : ""}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {att.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Users className="h-3 w-3" /> Prisotni ({att.length})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {att.map((a, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {a.person_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {i.opombe && (
                      <div>
                        <div className="text-xs text-muted-foreground">Opombe</div>
                        <div className="text-sm whitespace-pre-wrap">{i.opombe}</div>
                      </div>
                    )}

                    {canDelete && (
                      <div className="flex justify-end pt-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={busy}
                          onClick={() => handleDelete(i)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Izbriši
                        </Button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </AppShell>
  );
};

export default ArhivIntervencij;