import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EvidencaIntervencijApp from "@/components/EvidencaIntervencijApp";
import { useAuth } from "@/hooks/useAuth";

const Intervencija = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Nalagam...</p>
      </main>
    );
  }

  return <EvidencaIntervencijApp />;
};

export default Intervencija;