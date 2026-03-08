import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchPublicRows, withTimeout } from "@/lib/publicData";
import { ExternalLink } from "lucide-react";
import { isSafeUrl } from "@/lib/urlValidation";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = [
  "All",
  "Management Tools & Scripts",
  "Solutions",
  "Tools for Documentation",
  "Application Management",
];

interface ToolCatalogProps {
  searchQuery: string;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onResultCount?: (count: number) => void;
}

const ToolCatalog = ({ searchQuery, selectedCategory, onCategoryChange, onResultCount }: ToolCatalogProps) => {
  const [tools, setTools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadTools = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const sdkPromise = supabase
          .from("tools")
          .select("*")
          .order("name")
          .then(({ data, error }) => {
            if (error) throw error;
            return data ?? [];
          });

        let rows: any[];
        try {
          rows = await withTimeout(Promise.resolve(sdkPromise), 7000);
        } catch {
          rows = await fetchPublicRows<any>("tools?select=*&order=name.asc");
        }

        if (active) setTools(rows);
      } catch (error) {
        console.error('[ToolCatalog] load error:', error);
        if (active) setErrorMessage("Could not load tools. Please try again later.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadTools();
    return () => {
      active = false;
    };
  }, []);

  const filtered = tools.filter((tool) => {
    const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    if (searchQuery) {
      onResultCount?.(filtered.length);
    } else {
      onResultCount?.(0);
    }
  }, [filtered.length, searchQuery, onResultCount]);

  return (
    <section id="tools" className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-2xl font-bold md:text-3xl">
          Community Tools
          {searchQuery && (
            <span className="ml-3 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
              {filtered.length} {filtered.length === 1 ? "result" : "results"}
            </span>
          )}
        </h2>

        {/* Category filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tools grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : errorMessage ? (
          <p className="py-12 text-center text-muted-foreground">
            Kunde inte hämta verktyg just nu. Ladda om sidan och försök igen.
          </p>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tool) => (
              <a
                key={tool.id}
                href={isSafeUrl(tool.url) ? tool.url : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {tool.name}
                  </h3>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="mb-4 flex-1 text-sm text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
                <Badge variant="secondary" className="w-fit text-xs">
                  {tool.category}
                </Badge>
              </a>
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-muted-foreground">No tools found matching your search.</p>
        )}
      </div>
    </section>
  );
};

export default ToolCatalog;
