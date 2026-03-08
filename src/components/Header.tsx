import { useState, useCallback } from "react";
import { Menu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Header = () => {
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const goToSection = useCallback((id: string) => {
    setOpen(false);
    if (location.pathname === "/") {
      // Delay scroll to let Sheet close and layout settle
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 350);
    } else {
      navigate(`/#${id}`);
    }
  }, [location.pathname, navigate]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center">
          <span className="text-xl font-bold text-primary">Endpoint</span>
          <span className="text-xl font-bold text-foreground">.rocks</span>
        </Link>

        <nav className="hidden gap-6 md:flex items-center">
          <Link to="/blog" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Blog
          </Link>
          <button onClick={() => goToSection("tools")} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Community Tools
          </button>
          <button onClick={() => goToSection("about")} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            About
          </button>
          {isAdmin && (
            <Link to="/admin" className="text-sm text-primary transition-colors hover:text-primary/80 flex items-center gap-1">
              <Settings className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 bg-background">
            <nav className="mt-8 flex flex-col gap-4">
              <Link to="/blog" onClick={() => setOpen(false)} className="text-left text-lg text-muted-foreground hover:text-foreground">
                Blog
              </Link>
              <button onClick={() => goToSection("tools")} className="text-left text-lg text-muted-foreground hover:text-foreground">
                Community Tools
              </button>
              <button onClick={() => goToSection("about")} className="text-left text-lg text-muted-foreground hover:text-foreground">
                About
              </button>
              {isAdmin && (
                <Link to="/admin" onClick={() => setOpen(false)} className="text-left text-lg text-primary hover:text-primary/80 flex items-center gap-2">
                  <Settings className="h-4 w-4" /> Admin
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
