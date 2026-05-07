import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, LogOut } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import StatsTab from "@/components/admin/StatsTab";
import MembersTab from "@/components/admin/MembersTab";
import UsersTab from "@/components/admin/UsersTab";
import SettingsTab from "@/components/admin/SettingsTab";
import EmailSchedulesTab from "@/components/admin/EmailSchedulesTab";
import EmailTemplatesTab from "@/components/admin/EmailTemplatesTab";
import EmailLogTab from "@/components/admin/EmailLogTab";
import NavItemsTab from "@/components/admin/NavItemsTab";

export default function Admin() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!isAdmin) {
      toast({ title: "Dostop zavrnjen", description: "Stran je le za admine.", variant: "destructive" });
      navigate("/", { replace: true });
    }
  }, [user, isAdmin, loading, navigate]);

  if (!isAdmin) return null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Glava v gasilskem slogu */}
      <header className="bg-brand-navy text-brand-navy-foreground border-b-4 border-brand-red shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="text-brand-navy-foreground hover:bg-white/10 hover:text-brand-navy-foreground">
              <Link to="/" aria-label="Nazaj"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div className="h-9 w-9 rounded-md bg-brand-red text-brand-red-foreground flex items-center justify-center font-bold shadow-sm">
              <span className="text-xs font-bold">A</span>
            </div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-wide uppercase">Admin</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Odjava" className="text-brand-navy-foreground hover:bg-white/10 hover:text-brand-navy-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 space-y-4">
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 w-full h-auto gap-1">
            <TabsTrigger value="stats" className="text-xs sm:text-sm">Statistika</TabsTrigger>
            <TabsTrigger value="members" className="text-xs sm:text-sm">Člani</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm">Uporabniki</TabsTrigger>
            <TabsTrigger value="menu" className="text-xs sm:text-sm">Meni</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">Nastavitve</TabsTrigger>
            <TabsTrigger value="schedules" className="text-xs sm:text-sm">Urniki</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs sm:text-sm">Predloge</TabsTrigger>
            <TabsTrigger value="emaillog" className="text-xs sm:text-sm">Dnevnik</TabsTrigger>
          </TabsList>

          <div className="bg-card border border-border rounded-2xl shadow-sm p-3 sm:p-5 lg:p-6 mt-4">
            <TabsContent value="stats" className="mt-0">
              <StatsTab />
            </TabsContent>
            <TabsContent value="members" className="mt-0">
              <MembersTab />
            </TabsContent>
            <TabsContent value="users" className="mt-0">
              <UsersTab />
            </TabsContent>
            <TabsContent value="menu" className="mt-0">
              <NavItemsTab />
            </TabsContent>
            <TabsContent value="settings" className="mt-0">
              <SettingsTab />
            </TabsContent>
            <TabsContent value="schedules" className="mt-0">
              <EmailSchedulesTab />
            </TabsContent>
            <TabsContent value="templates" className="mt-0">
              <EmailTemplatesTab />
            </TabsContent>
            <TabsContent value="emaillog" className="mt-0">
              <EmailLogTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </main>
  );
}