import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Mail, Send } from "lucide-react";

type Settings = {
  id: string;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  smtp_pass: string | null;
  smtp_from: string | null;
  smtp_from_name: string | null;
  smtp_secure: boolean | null;
  reminder_recipients: string[] | null;
  reminder_days_before: number | null;
  inspection_recipients: string[] | null;
  inspection_days_before: number | null;
};

export default function SettingsTab() {
  const [s, setS] = useState<Settings | null>(null);
  const [recipientsText, setRecipientsText] = useState("");
  const [inspRecipientsText, setInspRecipientsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingInsp, setTestingInsp] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) toast({ title: "Napaka", description: error.message, variant: "destructive" });
    if (data) {
      setS(data as Settings);
      setRecipientsText(((data as Settings).reminder_recipients ?? []).join("\n"));
      setInspRecipientsText(((data as Settings).inspection_recipients ?? []).join("\n"));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (patch: Partial<Settings>) => setS((p) => (p ? { ...p, ...patch } : p));

  const save = async () => {
    if (!s) return;
    setSaving(true);
    const parseEmails = (txt: string) => txt.split(/[\n,;]+/).map((e) => e.trim()).filter((e) => e.includes("@"));
    const recipients = parseEmails(recipientsText);
    const inspRecipients = parseEmails(inspRecipientsText);
    const { error } = await supabase
      .from("app_settings")
      .update({
        smtp_host: s.smtp_host,
        smtp_port: s.smtp_port,
        smtp_user: s.smtp_user,
        smtp_pass: s.smtp_pass,
        smtp_from: s.smtp_from,
        smtp_from_name: s.smtp_from_name,
        smtp_secure: s.smtp_secure,
        reminder_recipients: recipients,
        reminder_days_before: s.reminder_days_before,
        inspection_recipients: inspRecipients,
        inspection_days_before: s.inspection_days_before,
      })
      .eq("id", s.id);
    setSaving(false);
    if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
    toast({ title: "Shranjeno" });
    load();
  };

  const runNow = async () => {
    setTesting(true);
    const { data, error } = await supabase.functions.invoke("send-medical-reminders", { body: { mode: "zdravniski" } });
    setTesting(false);
    if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
    const r = data as { ok: boolean; sent?: number; message?: string; error?: string };
    toast({
      title: r.ok ? "Izvedeno" : "Težava",
      description: r.message ?? r.error ?? `Poslano: ${r.sent ?? 0}`,
      variant: r.ok ? "default" : "destructive",
    });
  };

  const runInspectionsNow = async () => {
    setTestingInsp(true);
    const { data, error } = await supabase.functions.invoke("send-medical-reminders", { body: { mode: "tehnicni" } });
    setTestingInsp(false);
    if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
    const r = data as { ok: boolean; sent?: number; message?: string; error?: string };
    toast({
      title: r.ok ? "Izvedeno" : "Težava",
      description: r.message ?? r.error ?? `Poslano: ${r.sent ?? 0}`,
      variant: r.ok ? "default" : "destructive",
    });
  };

  const sendTest = async () => {
    const to = testEmail.trim();
    if (!to.includes("@")) {
      return toast({ title: "Neveljaven naslov", description: "Vpiši veljaven e-naslov.", variant: "destructive" });
    }
    setSendingTest(true);
    const { data, error } = await supabase.functions.invoke("send-medical-reminders", {
      body: { test: true, recipient: to },
    });
    setSendingTest(false);
    if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
    const r = data as { ok: boolean; message?: string; error?: string };
    toast({
      title: r.ok ? "Testno sporočilo poslano" : "Napaka pri pošiljanju",
      description: r.message ?? r.error ?? "",
      variant: r.ok ? "default" : "destructive",
    });
  };

  if (loading || !s) return <p className="text-sm text-muted-foreground">Nalagam...</p>;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-brand-red" />
          <h2 className="text-lg font-semibold">SMTP nastavitve</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>SMTP strežnik</Label>
            <Input value={s.smtp_host ?? ""} onChange={(e) => update({ smtp_host: e.target.value })} placeholder="smtp.gmail.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Port</Label>
            <Input type="number" value={s.smtp_port ?? 587} onChange={(e) => update({ smtp_port: parseInt(e.target.value) || 587 })} />
          </div>
          <div className="space-y-1.5">
            <Label>Uporabnik</Label>
            <Input value={s.smtp_user ?? ""} onChange={(e) => update({ smtp_user: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Geslo</Label>
            <Input type="password" value={s.smtp_pass ?? ""} onChange={(e) => update({ smtp_pass: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Pošiljatelj (e-pošta)</Label>
            <Input type="email" value={s.smtp_from ?? ""} onChange={(e) => update({ smtp_from: e.target.value })} placeholder="opomniki@pgd.si" />
          </div>
          <div className="space-y-1.5">
            <Label>Pošiljatelj (ime)</Label>
            <Input value={s.smtp_from_name ?? ""} onChange={(e) => update({ smtp_from_name: e.target.value })} />
          </div>
          <div className="flex items-center justify-between border border-border rounded-lg px-3 py-2 sm:col-span-2">
            <Label>SSL/TLS (port 465)</Label>
            <Switch checked={!!s.smtp_secure} onCheckedChange={(c) => update({ smtp_secure: c })} />
          </div>
        </div>

        <div className="border border-dashed border-border rounded-lg p-4 mt-2 space-y-3">
          <div>
            <Label className="text-sm font-semibold">Pošlji testno sporočilo</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Najprej shrani SMTP nastavitve, nato vpiši e-naslov za preizkus delovanja.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="prejemnik@example.com"
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={sendTest} disabled={sendingTest}>
              <Send className="h-4 w-4 mr-1" />
              {sendingTest ? "Pošiljam..." : "Pošlji test"}
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-3 border-t border-border pt-5">
        <h2 className="text-lg font-semibold">Opomniki za zdravniške preglede</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Število dni pred pretekom</Label>
            <Input
              type="number"
              min={1}
              max={365}
              value={s.reminder_days_before ?? 14}
              onChange={(e) => update({ reminder_days_before: parseInt(e.target.value) || 14 })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Prejemniki opomnikov (en e-mail na vrstico)</Label>
            <Textarea rows={5} value={recipientsText} onChange={(e) => setRecipientsText(e.target.value)} placeholder="vodja@pgd.si&#10;tajnik@pgd.si" />
          </div>
        </div>
      </section>

      <section className="space-y-3 border-t border-border pt-5">
        <h2 className="text-lg font-semibold">Opomniki za tehnične preglede vozil</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Število dni pred pretekom</Label>
            <Input
              type="number"
              min={1}
              max={365}
              value={s.inspection_days_before ?? 14}
              onChange={(e) => update({ inspection_days_before: parseInt(e.target.value) || 14 })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Prejemniki opomnikov za tehnične preglede (en e-mail na vrstico)</Label>
            <Textarea rows={4} value={inspRecipientsText} onChange={(e) => setInspRecipientsText(e.target.value)} placeholder="serviser@pgd.si" />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Button onClick={save} disabled={saving} className="bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
          {saving ? "Shranjujem..." : "Shrani nastavitve"}
        </Button>
        <Button variant="outline" onClick={runNow} disabled={testing}>
          <Send className="h-4 w-4 mr-1" /> {testing ? "Pošiljam..." : "Pošlji opomnike zdaj"}
        </Button>
        <Button variant="outline" onClick={runInspectionsNow} disabled={testingInsp}>
          <Send className="h-4 w-4 mr-1" /> {testingInsp ? "Pošiljam..." : "Pošlji tehnične opomnike"}
        </Button>
      </div>
    </div>
  );
}