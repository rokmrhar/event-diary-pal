import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EvidencaAktivnostiApp from "@/components/EvidencaAktivnostiApp";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
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

  return <EvidencaAktivnostiApp />;
};

export default Index;
