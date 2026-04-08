import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) setVisible(true);
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
