import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Upload, FileText, Home, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

export default function Verification() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [idUploaded, setIdUploaded] = useState(false);
  const [addressUploaded, setAddressUploaded] = useState(false);

  const handleSubmit = () => {
    if (!idUploaded || !addressUploaded) {
      toast.error("Please upload all required documents");
      return;
    }
    toast.success("Verification documents submitted!");
    navigate("/verification-status");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl">Identity Verification</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="mb-1"><strong>Why verify?</strong></p>
            <p>Verification helps build trust in our community and unlocks full access to all features.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`bg-white rounded-2xl border-2 p-6 ${idUploaded ? 'border-green-500' : 'border-border'}`}>
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-primary/10 rounded-full p-3">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg mb-1">Government ID</h3>
                <p className="text-sm text-muted-foreground">Upload a photo of your driver's license, passport, or national ID</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setIdUploaded(true);
                toast.success("ID document uploaded!");
              }}
              className="w-full"
              variant={idUploaded ? "outline" : "default"}
            >
              {idUploaded ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Uploaded
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload ID
                </>
              )}
            </Button>
          </div>

          <div className={`bg-white rounded-2xl border-2 p-6 ${addressUploaded ? 'border-green-500' : 'border-border'}`}>
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-primary/10 rounded-full p-3">
                <Home className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg mb-1">Proof of Address</h3>
                <p className="text-sm text-muted-foreground">Upload a utility bill, lease agreement, or bank statement</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setAddressUploaded(true);
                toast.success("Address proof uploaded!");
              }}
              className="w-full"
              variant={addressUploaded ? "outline" : "default"}
            >
              {addressUploaded ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Uploaded
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Proof
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={handleSubmit}
            disabled={!idUploaded || !addressUploaded}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Submit for Verification
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground mt-4">
          Your documents are encrypted and handled securely. Verification typically takes 24-48 hours.
        </div>
      </div>
    </div>
  );
}

export function VerificationStatus() {
  const navigate = useNavigate();
  const verified = true;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl">Verification Status</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {verified ? (
          <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-6 text-center">
            <div className="bg-green-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl mb-2">Verified!</h2>
            <p className="text-muted-foreground mb-4">Your account has been successfully verified.</p>
            <Button onClick={() => navigate("/home")} className="bg-primary hover:bg-primary/90">
              Go to Home
            </Button>
          </div>
        ) : (
          <div className="bg-yellow-50 border-2 border-yellow-500 rounded-2xl p-6 text-center">
            <div className="bg-yellow-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl mb-2">Under Review</h2>
            <p className="text-muted-foreground">Your documents are being reviewed. This typically takes 24-48 hours.</p>
          </div>
        )}
      </div>
    </div>
  );
}