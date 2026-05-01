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
import { Pencil, UserPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { MODULES, type ModuleKey } from "@/hooks/useModulePermissions";

type Profile = { user_id: string; email: string | null; display_name: string | null };
type RoleRow = { user_id: string; role: "admin" | "user" };
type PermRow = { user_id: string; module: string };

export default function UsersTab() {
  const { user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [perms, setPerms] = useState<PermRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [permPending, setPermPending] = useState<string | null>(null);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newAdmin, setNewAdmin] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const [p, r, mp] = await Promise.all([
      supabase.from("profiles").select("user_id, email, display_name"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("user_module_permissions").select("user_id, module"),
    ]);
    if (p.error || r.error || mp.error) {
      toast({
        title: "Napaka",
        description: p.error?.message ?? r.error?.message ?? mp.error?.message ?? "",
        variant: "destructive",
      });
    } else {
      setProfiles((p.data ?? []) as Profile[]);
      setRoles((r.data ?? []) as RoleRow[]);
      setPerms((mp.data ?? []) as PermRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const isAdminUser = (uid: string) => roles.some((r) => r.user_id === uid && r.role === "admin");
  const hasPerm = (uid: string, module: ModuleKey) =>
    perms.some((p) => p.user_id === uid && p.module === module);

  const togglePerm = async (uid: string, module: ModuleKey, enable: boolean) => {
    setPermPending(`${uid}-${module}`);
    if (enable) {
      const { error } = await supabase
        .from("user_module_permissions")
        .insert({ user_id: uid, module });
      if (error && error.code !== "23505") {
        setPermPending(null);
        toast({ title: "Napaka", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase
        .from("user_module_permissions")
        .delete()
        .eq("user_id", uid)
        .eq("module", module);
      if (error) {
        setPermPending(null);
        toast({ title: "Napaka", description: error.message, variant: "destructive" });
        return;
      }
    }
    setPermPending(null);
    toast({ title: enable ? "Pravica dodana" : "Pravica odvzeta" });
    load();
  };

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
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder="Išči uporabnika..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm w-full"
        />
        <Button onClick={() => { setNewEmail(""); setNewName(""); setNewPass(""); setNewAdmin(false); setCreateOpen(true); }}>
          <UserPlus className="h-4 w-4 mr-1" /> Dodaj uporabnika
        </Button>
      </div>

      <div className="hidden sm:block overflow-x-auto border border-border rounded-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>E-pošta</TableHead>
              <TableHead>Ime</TableHead>
              <TableHead className="text-center">Vloga</TableHead>
              <TableHead className="text-right w-[120px]">Uredi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Nalagam...
                </TableCell>
              </TableRow>
            ) : visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
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
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="h-4 w-4 mr-1" /> Uredi
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
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                    <Pencil className="h-3 w-3 mr-1" /> Uredi
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && closeEdit()}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Uredi uporabnika</DialogTitle>
            <DialogDescription>
              Spremeni podatke, vlogo in pravice modulov. Geslo pusti prazno, če ga ne želiš spremeniti.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-email">E-pošta</Label>
                  <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name">Ime / prikazno ime</Label>
                  <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="edit-pass">Novo geslo</Label>
                  <Input id="edit-pass" type="password" placeholder="Pusti prazno za nespremenjeno" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Najmanj 6 znakov.</p>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Admin pravice</Label>
                  <Switch
                    checked={isAdminUser(editing.user_id)}
                    disabled={pendingId === editing.user_id}
                    onCheckedChange={(c) => toggleAdmin(editing.user_id, c)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Admin ima samodejno vse pravice modulov.</p>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <Label className="text-base font-semibold">Pravice urejanja po modulih</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MODULES.map((m) => {
                    const admin = isAdminUser(editing.user_id);
                    const enabled = admin || hasPerm(editing.user_id, m.key);
                    return (
                      <div key={m.key} className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
                        <Label className="text-sm">{m.label}</Label>
                        <Switch
                          checked={enabled}
                          disabled={admin || permPending === `${editing.user_id}-${m.key}`}
                          onCheckedChange={(c) => togglePerm(editing.user_id, m.key, c)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeEdit} disabled={saving}>
              Zapri
            </Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? "Shranjujem..." : "Shrani"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dodaj novega uporabnika</DialogTitle>
            <DialogDescription>Račun se ustvari brez potrditvene e-pošte.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-email">E-pošta</Label>
              <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-name">Ime</Label>
              <Input id="new-name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pass">Geslo</Label>
              <Input id="new-pass" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
              <p className="text-xs text-muted-foreground">Najmanj 6 znakov.</p>
            </div>
            <div className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
              <Label htmlFor="new-admin">Admin pravice</Label>
              <Switch id="new-admin" checked={newAdmin} onCheckedChange={setNewAdmin} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>Prekliči</Button>
            <Button
              disabled={creating}
              onClick={async () => {
                setCreating(true);
                const { data, error } = await supabase.functions.invoke("admin-create-user", {
                  body: { email: newEmail, password: newPass, display_name: newName, make_admin: newAdmin },
                });
                setCreating(false);
                const errMsg = (data as { error?: string })?.error ?? error?.message;
                if (errMsg) {
                  toast({ title: "Napaka", description: errMsg, variant: "destructive" });
                  return;
                }
                toast({ title: "Uporabnik ustvarjen" });
                setCreateOpen(false);
                load();
              }}
            >
              {creating ? "Ustvarjam..." : "Ustvari"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}