import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";
const Admin = lazy(() => import("./pages/Admin.tsx"));
const Aktivnost = lazy(() => import("./pages/Aktivnost.tsx"));
const Intervencija = lazy(() => import("./pages/Intervencija.tsx"));
const ArhivIntervencij = lazy(() => import("./pages/ArhivIntervencij.tsx"));
const Ida = lazy(() => import("./pages/Ida.tsx"));
const IdaMaske = lazy(() => import("./pages/ida/IdaMaske.tsx"));
const IdaHrbtisca = lazy(() => import("./pages/ida/IdaHrbtisca.tsx"));
const IdaTlacnePosode = lazy(() => import("./pages/ida/IdaTlacnePosode.tsx"));
const IdaPljucniAvtomati = lazy(() => import("./pages/ida/IdaPljucniAvtomati.tsx"));
const IdaPolnjenja = lazy(() => import("./pages/ida/IdaPolnjenja.tsx"));
const IdaSeznamVozil = lazy(() => import("./pages/ida/IdaSeznamVozil.tsx"));
const VecjiObseg = lazy(() => import("./pages/VecjiObseg.tsx"));
const Statistika = lazy(() => import("./pages/Statistika.tsx"));
const Vozila = lazy(() => import("./pages/Vozila.tsx"));
const Servisi = lazy(() => import("./pages/Servisi.tsx"));
const KnjigaServisov = lazy(() => import("./pages/servisi/KnjigaServisov.tsx"));
const TehnicniPregledi = lazy(() => import("./pages/servisi/TehnicniPregledi.tsx"));
const Pranja = lazy(() => import("./pages/Pranja.tsx"));
const VnosPranja = lazy(() => import("./pages/pranja/VnosPranja.tsx"));
const ArhivPranj = lazy(() => import("./pages/pranja/ArhivPranj.tsx"));
const ZdravniskiPregledi = lazy(() => import("./pages/ZdravniskiPregledi.tsx"));
const PotniNalog = lazy(() => import("./pages/PotniNalog.tsx"));
const Spin = lazy(() => import("./pages/Spin.tsx"));
const ArhivAktivnosti = lazy(() => import("./pages/ArhivAktivnosti.tsx"));
const CmsPage = lazy(() => import("./pages/CmsPage.tsx"));
import { AuthProvider } from "@/hooks/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<div className="h-screen flex items-center justify-center text-sm text-muted-foreground">Nalagam…</div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/aktivnost" element={<Aktivnost />} />
            <Route path="/intervencija" element={<Intervencija />} />
            <Route path="/arhiv-intervencij" element={<ArhivIntervencij />} />
            <Route path="/ida" element={<Ida />} />
            <Route path="/ida/maske" element={<IdaMaske />} />
            <Route path="/ida/hrbtisca" element={<IdaHrbtisca />} />
            <Route path="/ida/tlacne-posode" element={<IdaTlacnePosode />} />
            <Route path="/ida/pljucni-avtomati" element={<IdaPljucniAvtomati />} />
            <Route path="/ida/polnjenja" element={<IdaPolnjenja />} />
            <Route path="/ida/seznam-vozil" element={<IdaSeznamVozil />} />
            <Route path="/vecji-obseg" element={<VecjiObseg />} />
            <Route path="/statistika" element={<Statistika />} />
            <Route path="/vozila" element={<Vozila />} />
            <Route path="/servisi" element={<Servisi />} />
            <Route path="/servisi/knjiga" element={<KnjigaServisov />} />
            <Route path="/servisi/tehnicni-pregledi" element={<TehnicniPregledi />} />
            <Route path="/pranja" element={<Pranja />} />
            <Route path="/pranja/vnos" element={<VnosPranja />} />
            <Route path="/pranja/arhiv" element={<ArhivPranj />} />
            <Route path="/zdravniski-pregledi" element={<ZdravniskiPregledi />} />
            <Route path="/potni-nalog" element={<PotniNalog />} />
            <Route path="/spin" element={<Spin />} />
            <Route path="/arhiv-aktivnosti" element={<ArhivAktivnosti />} />
            <Route path="/p/:slug" element={<CmsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
