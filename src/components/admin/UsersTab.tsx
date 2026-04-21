import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

  return (
    <div className="space-y-4">
      <Input
        placeholder="Išči uporabnika..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="overflow-x-auto border border-border rounded-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>E-pošta</TableHead>
              <TableHead>Ime</TableHead>
              <TableHead className="text-center">Vloga</TableHead>
              <TableHead className="text-right w-[140px]">Admin</TableHead>
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
                      <div className="flex items-center justify-end gap-2">
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
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}