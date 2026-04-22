import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Profile = { user_id: string; email: string | null; display_name: string | null };
type RoleRow = { user_id: string; role: "admin" | "user" };

export default function UsersTab() {
  const { user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [p, r] = await Promise.all([
      supabase.from("profiles").select("user_id, email, display_name"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (p.error || r.error) {
      toast({
        title: "Napaka",
        description: p.error?.message ?? r.error?.message ?? "",
        variant: "destructive",
      });
    } else {
      setProfiles((p.data ?? []) as Profile[]);
      setRoles((r.data ?? []) as RoleRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const isAdminUser = (uid: string) => roles.some((r) => r.user_id === uid && r.role === "admin");

  const toggleAdmin = async (uid: string, makeAdmin: boolean) => {
    if (uid === currentUser?.id && !makeAdmin) {
      if (!confirm("Ali res želite sebi odvzeti admin pravice?")) return;
    }
    setPendingId(uid);
    if (makeAdmin) {
      // Add admin role (keep user role too)
      const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: "admin" });
      if (error && error.code !== "23505") {
        setPendingId(null);
        toast({ title: "Napaka", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", uid)
        .eq("role", "admin");
      if (error) {
        setPendingId(null);
        toast({ title: "Napaka", description: error.message, variant: "destructive" });
        return;
      }
    }
    setPendingId(null);
    toast({ title: makeAdmin ? "Admin pravice dodane" : "Admin pravice odvzete" });
    load();
  };

  const visible = profiles.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.email ?? "").toLowerCase().includes(q) ||
      (p.display_name ?? "").toLowerCase().includes(q)
    );
  });

  const openEdit = (p: Profile) => {
    setEditing(p);
    setEditEmail(p.email ?? "");
    setEditName(p.display_name ?? "");
    setEditPassword("");
  };

  const closeEdit = () => {
    setEditing(null);
    setEditPassword("");
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const payload: Record<string, unknown> = { user_id: editing.user_id };
    if (editEmail.trim() && editEmail.trim() !== (editing.email ?? "")) {
      payload.email = editEmail.trim();
    }
    if (editName !== (editing.display_name ?? "")) {
      payload.display_name = editName;
    }
    if (editPassword.length > 0) {
      payload.password = editPassword;
    }

    const { data, error } = await supabase.functions.invoke("admin-update-user", {
      body: payload,
    });
    setSaving(false);

    if (error || (data && (data as { error?: string }).error)) {
      const msg = (data as { error?: string })?.error ?? error?.message ?? "Napaka";
      toast({ title: "Napaka pri shranjevanju", description: msg, variant: "destructive" });
      return;
    }
    toast({ title: "Shranjeno", description: "Podatki uporabnika so posodobljeni." });
    closeEdit();
    load();
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Išči uporabnika..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm w-full"
      />

      <div className="hidden sm:block overflow-x-auto border border-border rounded-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>E-pošta</TableHead>
              <TableHead>Ime</TableHead>
              <TableHead className="text-center">Vloga</TableHead>
              <TableHead className="text-center w-[100px]">Admin</TableHead>
              <TableHead className="text-right w-[100px]">Uredi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nalagam...
                </TableCell>
              </TableRow>
            ) : visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Ni uporabnikov
                </TableCell>
              </TableRow>
            ) : (
              visible.map((p) => {
                const admin = isAdminUser(p.user_id);
                const isSelf = p.user_id === currentUser?.id;
                return (
                  <TableRow key={p.user_id}>
                    <TableCell className="font-medium">
                      {p.email ?? "—"}
                      {isSelf && <span className="ml-2 text-xs text-muted-foreground">(vi)</span>}
                    </TableCell>
                    <TableCell>{p.display_name ?? "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={admin ? "default" : "secondary"}>
                        {admin ? "admin" : "user"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Label htmlFor={`adm-${p.user_id}`} className="sr-only">
                          Admin pravice
                        </Label>
                        <Switch
                          id={`adm-${p.user_id}`}
                          checked={admin}
                          disabled={pendingId === p.user_id}
                          onCheckedChange={(checked) => toggleAdmin(p.user_id, checked)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(p)}
                        aria-label="Uredi uporabnika"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Nalagam...</p>
        ) : visible.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Ni uporabnikov</p>
        ) : (
          visible.map((p) => {
            const admin = isAdminUser(p.user_id);
            const isSelf = p.user_id === currentUser?.id;
            return (
              <div key={p.user_id} className="border border-border rounded-xl p-3 bg-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-medium truncate">
                      {p.email ?? "—"}
                      {isSelf && <span className="ml-1 text-xs text-muted-foreground">(vi)</span>}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {p.display_name ?? "—"}
                    </p>
                    <Badge variant={admin ? "default" : "secondary"}>
                      {admin ? "admin" : "user"}
                    </Badge>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Label htmlFor={`adm-m-${p.user_id}`} className="text-xs text-muted-foreground">
                      Admin
                    </Label>
                    <Switch
                      id={`adm-m-${p.user_id}`}
                      checked={admin}
                      disabled={pendingId === p.user_id}
                      onCheckedChange={(checked) => toggleAdmin(p.user_id, checked)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="h-3 w-3 mr-1" /> Uredi
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && closeEdit()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Uredi uporabnika</DialogTitle>
            <DialogDescription>
              Spremeni e-pošto, ime ali geslo. Geslo pusti prazno, če ga ne želiš spremeniti.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">E-pošta</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Ime / prikazno ime</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-pass">Novo geslo</Label>
              <Input
                id="edit-pass"
                type="password"
                placeholder="Pusti prazno za nespremenjeno"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Najmanj 6 znakov.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeEdit} disabled={saving}>
              Prekliči
            </Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? "Shranjujem..." : "Shrani"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}