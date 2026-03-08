import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback } from "react";

const Footer = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const goToSection = useCallback((id: string) => {
    if (location.pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/#${id}`);
    }
  }, [location.pathname, navigate]);

  return (
    <footer className="border-t border-border/50 py-8">
      <div className="container mx-auto px-4 text-center">
        <div className="mb-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <button onClick={() => goToSection("tools")} className="transition-colors hover:text-foreground">Tools</button>
          <Link to="/blog" className="transition-colors hover:text-foreground">Blog</Link>
          <button onClick={() => goToSection("about")} className="transition-colors hover:text-foreground">About</button>
        </div>
        <p className="text-sm text-muted-foreground">
          Endpoint.rocks is not affiliated with Microsoft. All tools are community-created and maintained by their respective authors.
        </p>
        <p className="mt-2 text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Endpoint.rocks
        </p>
      </div>
    </footer>
  );
};

export default Footer;
