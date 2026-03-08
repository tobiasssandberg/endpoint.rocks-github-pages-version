import { useState } from "react";
import { Search, Github, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  toolCount?: number;
  blogCount?: number;
}

const HeroSection = ({ searchQuery, onSearchChange, toolCount = 0, blogCount = 0 }: HeroSectionProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const isSearching = searchQuery.trim().length > 0;
  const totalResults = toolCount + blogCount;

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Glow effect */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl">
          <span className="text-primary">Endpoint</span>
          <span className="text-foreground">.rocks</span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Your gateway to the best community tools and insights for Microsoft Intune
        </p>

        <div className="mx-auto max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tools and blog posts..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => { if (e.key === "Escape") { onSearchChange(""); (e.target as HTMLInputElement).blur(); } }}
              className="h-12 rounded-xl border-border/50 bg-card pl-10 pr-10 text-base shadow-lg shadow-primary/5 placeholder:text-muted-foreground focus-visible:ring-primary"
            />
            {isSearching && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {isSearching ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Found <span className="font-medium text-foreground">{totalResults}</span> {totalResults === 1 ? "result" : "results"}
              {totalResults > 0 && (
                <span className="text-muted-foreground">
                  {" "}— {toolCount} {toolCount === 1 ? "tool" : "tools"}, {blogCount} {blogCount === 1 ? "post" : "posts"}
                </span>
              )}
              <span className="ml-2 text-muted-foreground/60">· Press Escape to clear</span>
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground/40">
              Press <kbd className="rounded border border-border/50 px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd> to clear
            </p>
          )}
        </div>

        <Link
          to="/blog"
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          📝 Read the latest blog posts →
        </Link>
        <div className="mt-3">
          <a
            href="https://github.com/hillihappo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <Github className="h-4 w-4" /> GitHub →
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
