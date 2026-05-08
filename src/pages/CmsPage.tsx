import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

type Page = {
  title: string;
  content: string;
  content_type: "html" | "text";
  visible: boolean;
};

export default function CmsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("cms_pages")
        .select("title, content, content_type, visible")
        .eq("slug", slug ?? "")
        .maybeSingle();
      if (!alive) return;
      if (!data) setNotFound(true);
      else setPage(data as Page);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [slug]);

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto">
        {loading ? (
          <div className="text-sm text-muted-foreground">Nalagam…</div>
        ) : notFound || !page ? (
          <div className="text-sm text-muted-foreground">Stran ne obstaja.</div>
        ) : (
          <article>
            <h1 className="text-2xl font-bold mb-4">{page.title}</h1>
            {page.content_type === "html" ? (
              <div className="cms-content" dangerouslySetInnerHTML={{ __html: page.content }} />
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{page.content}</div>
            )}
          </article>
        )}
      </div>
    </AppShell>
  );
}