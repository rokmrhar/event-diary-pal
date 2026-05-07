import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import ActivitiesTab from "@/components/admin/ActivitiesTab";
import { Archive } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { toast } from "@/hooks/use-toast";

export default function ArhivAktivnosti() {
  const { user, loading } = useAuth();
  const { canView, loading: permsLoading } = useModulePermissions();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || permsLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!canView("activities")) {
      toast({ title: "Dostop zavrnjen", description: "Nimate pravic za ogled.", variant: "destructive" });
      navigate("/", { replace: true });
    }
  }, [user, loading, permsLoading, canView, navigate]);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 space-y-4">
        <PageHeader icon={Archive} title="Arhiv aktivnosti" />
        <div className="bg-card border border-border rounded-2xl shadow-sm p-3 sm:p-5 lg:p-6">
          <ActivitiesTab />
        </div>
      </div>
    </AppShell>
  );
}