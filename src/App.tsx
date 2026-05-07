import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Admin from "./pages/Admin.tsx";
import Aktivnost from "./pages/Aktivnost.tsx";
import Intervencija from "./pages/Intervencija.tsx";
import ArhivIntervencij from "./pages/ArhivIntervencij.tsx";
import Ida from "./pages/Ida.tsx";
import IdaMaske from "./pages/ida/IdaMaske.tsx";
import IdaHrbtisca from "./pages/ida/IdaHrbtisca.tsx";
import IdaTlacnePosode from "./pages/ida/IdaTlacnePosode.tsx";
import IdaPljucniAvtomati from "./pages/ida/IdaPljucniAvtomati.tsx";
import IdaPolnjenja from "./pages/ida/IdaPolnjenja.tsx";
import IdaSeznamVozil from "./pages/ida/IdaSeznamVozil.tsx";
import VecjiObseg from "./pages/VecjiObseg.tsx";
import Statistika from "./pages/Statistika.tsx";
import Vozila from "./pages/Vozila.tsx";
import Servisi from "./pages/Servisi.tsx";
import KnjigaServisov from "./pages/servisi/KnjigaServisov.tsx";
import TehnicniPregledi from "./pages/servisi/TehnicniPregledi.tsx";
import Pranja from "./pages/Pranja.tsx";
import VnosPranja from "./pages/pranja/VnosPranja.tsx";
import ArhivPranj from "./pages/pranja/ArhivPranj.tsx";
import ZdravniskiPregledi from "./pages/ZdravniskiPregledi.tsx";
import PotniNalog from "./pages/PotniNalog.tsx";
import Spin from "./pages/Spin.tsx";
import ArhivAktivnosti from "./pages/ArhivAktivnosti.tsx";
import { AuthProvider } from "@/hooks/useAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
