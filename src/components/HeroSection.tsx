import { Search, Github } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const HeroSection = ({ searchQuery, onSearchChange }: HeroSectionProps) => {
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
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-12 rounded-xl border-border/50 bg-card pl-10 text-base shadow-lg shadow-primary/5 placeholder:text-muted-foreground focus-visible:ring-primary"
            />
          </div>
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
