import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, ShieldCheck, ShieldOff } from "lucide-react";

const MfaEnroll = () => {
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [existingFactorId, setExistingFactorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkExistingFactors();
  }, []);

  const checkExistingFactors = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error && data) {
      const verifiedTotp = data.totp.find((f) => f.status === "verified");
      if (verifiedTotp) {
        setEnrolled(true);
        setExistingFactorId(verifiedTotp.id);
      }
    }
    setLoading(false);
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator App",
    });
    if (error) {
      toast.error(error.message);
      setEnrolling(false);
      return;
    }
    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setEnrolling(false);
  };

  const handleVerifyEnrollment = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast.error("Enter a 6-digit code");
      return;
    }
    setVerifying(true);
    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
      toast.error(challengeError.message);
      setVerifying(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: verifyCode,
    });
    if (verifyError) {
      toast.error(verifyError.message);
      setVerifying(false);
      return;
    }

    toast.success("MFA enabled successfully!");
    setEnrolled(true);
    setExistingFactorId(factorId);
    setQrCode("");
    setSecret("");
    setVerifyCode("");
    setVerifying(false);
  };

  const handleUnenroll = async () => {
    if (!existingFactorId) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId: existingFactorId });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("MFA disabled");
    setEnrolled(false);
    setExistingFactorId(null);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading MFA status...</p>;
  }

  if (enrolled) {
    return (
      <div className="space-y-3 rounded-lg border border-border/50 bg-card p-4">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <ShieldCheck className="h-5 w-5" />
          <span className="font-medium">MFA is enabled</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Your account is protected with TOTP two-factor authentication.
        </p>
        <Button variant="destructive" size="sm" onClick={handleUnenroll}>
          <ShieldOff className="mr-1 h-4 w-4" /> Disable MFA
        </Button>
      </div>
    );
  }

  if (qrCode) {
    return (
      <div className="space-y-4 rounded-lg border border-border/50 bg-card p-4">
        <h3 className="font-semibold">Scan this QR code with your authenticator app</h3>
        <div className="flex justify-center">
          <img src={qrCode} alt="TOTP QR Code" className="h-48 w-48 rounded" />
        </div>
        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer">Can't scan? Use manual entry</summary>
          <code className="mt-2 block break-all rounded bg-muted p-2 text-xs">{secret}</code>
        </details>
        <div className="space-y-2">
          <label className="text-sm font-medium">Enter the 6-digit code from your app</label>
          <Input
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="text-center text-lg tracking-widest"
          />
          <Button onClick={handleVerifyEnrollment} disabled={verifying} className="w-full">
            {verifying ? "Verifying..." : "Verify & Enable MFA"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/50 bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Shield className="h-5 w-5" />
        <span className="font-medium">MFA is not enabled</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Add an extra layer of security to your admin account with a TOTP authenticator app.
      </p>
      <Button onClick={handleEnroll} disabled={enrolling}>
        <Shield className="mr-1 h-4 w-4" />
        {enrolling ? "Setting up..." : "Enable MFA"}
      </Button>
    </div>
  );
};

export default MfaEnroll;
