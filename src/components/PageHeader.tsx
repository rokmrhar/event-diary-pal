import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  icon: LucideIcon;
  description?: string;
  backTo?: string;
  actions?: ReactNode;
}

/**
 * Unified page header. Consistent icon, title, optional description, optional
 * back-button and right-aligned actions. Use on every top-level page so the
 * visual style is the same across the app.
 */
export default function PageHeader({ title, icon: Icon, description, backTo = "/", actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {backTo && (
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link to={backTo}><ArrowLeft className="h-4 w-4 mr-1" /> Domov</Link>
          </Button>
        )}
        <div className="h-10 w-10 rounded-full bg-brand-red flex items-center justify-center text-brand-red-foreground shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase truncate">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
