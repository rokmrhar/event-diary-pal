import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, LogOut } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import StatsTab from "@/components/admin/StatsTab";
import MembersTab from "@/components/admin/MembersTab";
import ActivitiesTab from "@/components/admin/ActivitiesTab";
import UsersTab from "@/components/admin/UsersTab";

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
    <main className="min-h-screen bg-background p-3 sm:p-6 lg:p-8 text-foreground">
      <div className="max-w-7xl mx-auto space-y-4">
        <header className="flex items-center justify-between gap-2 flex-wrap sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-3 px-3 sm:-mx-6 sm:px-6 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon">
              <Link to="/" aria-label="Nazaj"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Admin</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Odjava">
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto gap-1">
            <TabsTrigger value="stats" className="text-xs sm:text-sm">Statistika</TabsTrigger>
            <TabsTrigger value="activities" className="text-xs sm:text-sm">Aktivnosti</TabsTrigger>
            <TabsTrigger value="members" className="text-xs sm:text-sm">Člani</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm">Uporabniki</TabsTrigger>
          </TabsList>

          <div className="bg-card border border-border rounded-2xl shadow-sm p-3 sm:p-5 lg:p-6 mt-4">
            <TabsContent value="stats" className="mt-0">
              <StatsTab />
            </TabsContent>
            <TabsContent value="activities" className="mt-0">
              <ActivitiesTab />
            </TabsContent>
            <TabsContent value="members" className="mt-0">
              <MembersTab />
            </TabsContent>
            <TabsContent value="users" className="mt-0">
              <UsersTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </main>
  );
}