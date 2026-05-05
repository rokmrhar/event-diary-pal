import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import { Map } from "lucide-react";

export default function Spin() {
  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 h-full flex flex-col">
        <PageHeader
          title="SPIN"
          icon={Map}
          description="Javni zemljevid intervencij in obvestil (SPIN3, URSZR)"
        />
        <div className="flex-1 min-h-[70vh] border border-border rounded-xl overflow-hidden bg-card">
          <iframe
            src="https://spin3.sos112.si/javno/zemljevid"
            title="SPIN javni zemljevid"
            className="w-full h-full min-h-[70vh]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </AppShell>
  );
}