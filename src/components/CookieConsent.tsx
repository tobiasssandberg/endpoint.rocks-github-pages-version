import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

const GA_ID = "G-ETF88872KS";

function loadGA() {
  if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_ID}"]`)) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID);
}

function removeGACookies() {
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0].trim();
    if (name.startsWith("_ga") || name.startsWith("_gid")) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${location.hostname}`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  });
}

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function getConsent(): string | null {
  return localStorage.getItem("cookie-consent");
}

export function initGA() {
  loadGA();
}

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getConsent()) setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-xs rounded-lg border border-border bg-card p-4 shadow-lg animate-in slide-in-from-bottom-4">
      <p className="text-sm text-muted-foreground mb-3">
        This website uses Google Analytics
      </p>
      <Button variant="outline" size="sm" className="w-full" onClick={dismiss}>
        Got it!
      </Button>
    </div>
  );
};

export default CookieConsent;
