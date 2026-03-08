import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

const MfaVerify = () => {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      toast.error("Enter a 6-digit code");
      return;
    }

    setVerifying(true);

    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError || !factors?.totp?.length) {
      toast.error("Could not retrieve MFA factors");
      setVerifying(false);
      return;
    }

    const factor = factors.totp.find((f) => f.status === "verified");
    if (!factor) {
      toast.error("No verified MFA factor found");
      setVerifying(false);
      return;
    }

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challengeError) {
      toast.error(challengeError.message);
      setVerifying(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: challengeData.id,
      code,
    });

    if (verifyError) {
      toast.error("Invalid code. Please try again.");
      setVerifying(false);
      return;
    }

    toast.success("MFA verified!");
    navigate("/admin");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Two-Factor Authentication</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="text-center text-2xl tracking-[0.5em]"
            autoFocus
            required
          />
          <Button type="submit" className="w-full" disabled={verifying}>
            {verifying ? "Verifying..." : "Verify"}
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={handleSignOut}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default MfaVerify;
