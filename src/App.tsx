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
import VecjiObseg from "./pages/VecjiObseg.tsx";
import Statistika from "./pages/Statistika.tsx";
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
            <Route path="/vecji-obseg" element={<VecjiObseg />} />
            <Route path="/statistika" element={<Statistika />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
