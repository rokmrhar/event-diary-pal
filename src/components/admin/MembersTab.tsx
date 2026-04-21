import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMembers } from "@/hooks/useMembers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, UserPlus, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function MembersTab() {
  const { members, refresh } = useMembers();
  const [newMember, setNewMember] = useState("");
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [search, setSearch] = useState("");

  const visible = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newMember.trim();
    if (!name) return;
    setAdding(true);
    const { error } = await supabase.from("members").insert({ name });
    setAdding(false);
    if (error) {
      toast({
        title: "Napaka",
        description: error.code === "23505" ? "Član s tem imenom že obstaja." : error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Član dodan", description: name });
    setNewMember("");
    refresh();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Izbrisati člana "${name}"? Obstoječe aktivnosti ostanejo nespremenjene.`)) return;
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) {
      toast({ title: "Napaka", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Član izbrisan", description: name });
    refresh();
  };

  const startEdit = (id: string, name: string) => {
    setEditId(id);
    setEditName(name);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
  };

  const saveEdit = async () => {
    if (!editId) return;
    const name = editName.trim();
    if (!name) return;
    const { error } = await supabase.from("members").update({ name }).eq("id", editId);
    if (error) {
      toast({
        title: "Napaka",
        description: error.code === "23505" ? "Član s tem imenom že obstaja." : error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Posodobljeno", description: name });
    cancelEdit();
    refresh();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Ime in priimek novega člana"
          value={newMember}
          onChange={(e) => setNewMember(e.target.value)}
          maxLength={100}
        />
        <Button type="submit" disabled={adding || !newMember.trim()} className="sm:w-auto w-full">
          <UserPlus className="h-4 w-4 mr-1" />
          Dodaj
        </Button>
      </form>

      <Input
        placeholder="Išči člana..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm w-full"
      />

      <div className="overflow-x-auto border border-border rounded-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ime in priimek</TableHead>
              <TableHead className="w-[160px] text-right">Dejanja</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                  Ni članov
                </TableCell>
              </TableRow>
            ) : (
              visible.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    {editId === m.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium">{m.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editId === m.id ? (
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={saveEdit} aria-label="Shrani">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={cancelEdit} aria-label="Prekliči">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEdit(m.id, m.name)}
                          aria-label={`Uredi ${m.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(m.id, m.name)}
                          aria-label={`Izbriši ${m.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}