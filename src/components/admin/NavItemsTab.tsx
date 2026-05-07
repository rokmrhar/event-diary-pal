import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Pencil,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Minus,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { MODULES } from "@/hooks/useModulePermissions";
import { useNavItems, type NavItem } from "@/hooks/useNavItems";

const ICON_OPTIONS = [
  "Home","ClipboardList","PencilLine","Archive","AlertCircle","Map","Wrench",
  "Truck","Stethoscope","ShieldCheck","Biohazard","BarChart3","Flame",
  "Settings","Bell","Users","FileText","Folder","Calendar","Star","Heart",
  "Activity","BookOpen","Camera","Phone","Mail","Link2","Globe","Image",
];

type FormState = {
  id?: string;
  kind: "link" | "separator";
  label: string;
  url: string;
  icon: string;
  module_key: string;
  external: boolean;
  visible: boolean;
};

const empty: FormState = {
  kind: "link", label: "", url: "", icon: "Circle",
  module_key: "", external: false, visible: true,
};

function SortableRow({ item, onEdit, onDelete, onToggle }: {
  item: NavItem;
  onEdit: (it: NavItem) => void;
  onDelete: (it: NavItem) => void;
  onToggle: (it: NavItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 border border-border rounded-lg px-2 py-2 bg-card ${
        item.kind === "separator" ? "bg-muted/40" : ""
      }`}
    >
      <button
        className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground"
        {...attributes}
        {...listeners}
        aria-label="Premakni"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {item.kind === "separator" ? (
        <Minus className="h-4 w-4 text-muted-foreground shrink-0" />
      ) : null}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {item.kind === "separator" ? `— ${item.label} —` : item.label}
        </p>
        {item.kind === "link" && (
          <p className="text-xs text-muted-foreground truncate">
            {item.external ? "↗ " : ""}
            {item.url || "(brez povezave)"}
            {item.module_key ? ` • modul: ${item.module_key}` : ""}
          </p>
        )}
      </div>
      <Button size="icon" variant="ghost" onClick={() => onToggle(item)} aria-label="Skrij/prikaži">
        {item.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
      </Button>
      <Button size="icon" variant="ghost" onClick={() => onEdit(item)} aria-label="Uredi">
        <Pencil className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" className="hover:bg-destructive/10 hover:text-destructive" onClick={() => onDelete(item)} aria-label="Izbriši">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function NavItemsTab() {
  const { items, refresh } = useNavItems();
  const [list, setList] = useState<NavItem[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setList(items);
  }, [items]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = list.findIndex((i) => i.id === active.id);
    const newIdx = list.findIndex((i) => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(list, oldIdx, newIdx);
    setList(next);
    // Persist new sort_orders (10, 20, 30, ...)
    const updates = next.map((it, i) =>
      supabase.from("nav_items").update({ sort_order: (i + 1) * 10 }).eq("id", it.id)
    );
    await Promise.all(updates);
    refresh();
  };

  const startNew = (kind: "link" | "separator") => {
    setForm({ ...empty, kind });
    setOpen(true);
  };

  const startEdit = (it: NavItem) => {
    setForm({
      id: it.id,
      kind: it.kind,
      label: it.label,
      url: it.url ?? "",
      icon: it.icon ?? "Circle",
      module_key: it.module_key ?? "",
      external: it.external,
      visible: it.visible,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.label.trim()) {
      toast({ title: "Manjka oznaka", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      kind: form.kind,
      label: form.label.trim(),
      url: form.kind === "link" ? (form.url.trim() || null) : null,
      icon: form.kind === "link" ? form.icon : null,
      module_key: form.kind === "link" && form.module_key ? form.module_key : null,
      external: form.kind === "link" ? form.external : false,
      visible: form.visible,
    };
    if (form.id) {
      const { error } = await supabase.from("nav_items").update(payload).eq("id", form.id);
      if (error) { toast({ title: "Napaka", description: error.message, variant: "destructive" }); setSaving(false); return; }
    } else {
      const maxOrder = list.reduce((m, i) => Math.max(m, i.sort_order), 0);
      const { error } = await supabase.from("nav_items").insert({ ...payload, sort_order: maxOrder + 10 });
      if (error) { toast({ title: "Napaka", description: error.message, variant: "destructive" }); setSaving(false); return; }
    }
    setSaving(false);
    setOpen(false);
    refresh();
    toast({ title: "Shranjeno" });
  };

  const remove = async (it: NavItem) => {
    if (!confirm(`Izbrisati "${it.label}"?`)) return;
    const { error } = await supabase.from("nav_items").delete().eq("id", it.id);
    if (error) { toast({ title: "Napaka", description: error.message, variant: "destructive" }); return; }
    refresh();
  };

  const toggleVisible = async (it: NavItem) => {
    const { error } = await supabase.from("nav_items").update({ visible: !it.visible }).eq("id", it.id);
    if (error) { toast({ title: "Napaka", description: error.message, variant: "destructive" }); return; }
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="text-base font-semibold">Levi meni</h3>
          <p className="text-xs text-muted-foreground">Povleci za razvrščanje. Skrite povezave se ne pokažejo nikomur.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => startNew("separator")}>
            <Plus className="h-4 w-4 mr-1" /> Ločnik
          </Button>
          <Button onClick={() => startNew("link")}>
            <Plus className="h-4 w-4 mr-1" /> Povezava
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={list.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {list.map((it) => (
              <SortableRow key={it.id} item={it} onEdit={startEdit} onDelete={remove} onToggle={toggleVisible} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Uredi" : "Dodaj"} {form.kind === "link" ? "povezavo" : "ločnik"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Oznaka</Label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </div>
            {form.kind === "link" && (
              <>
                <div className="space-y-1.5">
                  <Label>URL / pot</Label>
                  <Input
                    value={form.url}
                    placeholder={form.external ? "https://..." : "/moja-pot"}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
                  <Label>Zunanja povezava</Label>
                  <Switch checked={form.external} onCheckedChange={(c) => setForm({ ...form, external: c })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Ikona</Label>
                  <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {ICON_OPTIONS.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Vezan na modul (pravice)</Label>
                  <Select
                    value={form.module_key || "__none"}
                    onValueChange={(v) => setForm({ ...form, module_key: v === "__none" ? "" : v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— brez —</SelectItem>
                      {MODULES.map((m) => (
                        <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Če je nastavljen modul, povezavo vidijo le uporabniki s pravico ogleda za ta modul.</p>
                </div>
              </>
            )}
            <div className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
              <Label>Vidno</Label>
              <Switch checked={form.visible} onCheckedChange={(c) => setForm({ ...form, visible: c })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Prekliči</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Shranjujem..." : "Shrani"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}