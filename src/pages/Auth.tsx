import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/admin");
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast.error(error.message || "Sign in failed");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            <span className="text-primary">Endpoint</span>
            <span className="text-foreground">.rocks</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to admin portal
          </p>
        </div>

        <Button
          onClick={handleGoogleSignIn}
          className="w-full"
          disabled={loading}
        >
          {loading ? "Redirecting..." : "Sign in with Google"}
        </Button>

        <div className="text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to site
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
