import { useNavigate, useParams } from "react-router";
import { AlertCircle, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/button";

export default function DisabledServiceScreen() {
  const { serviceName } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="bg-red-600 p-8 rounded-full mb-8 shadow-2xl shadow-red-100 animate-in zoom-in-75 duration-300">
        <AlertCircle className="w-16 h-16 text-white" />
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{serviceName} Service Disabled</h1>
      
      <div className="flex items-center justify-center gap-2 mb-8 text-red-600 bg-red-50 px-6 py-2.5 rounded-full border border-red-100 shadow-sm">
        <AlertTriangle className="w-5 h-5" />
        <span className="text-sm font-bold uppercase tracking-wider">Access Restricted by Admin</span>
      </div>

      <div className="max-w-xs mx-auto space-y-4 mb-12">
        <p className="text-gray-600 text-lg leading-relaxed">
          Admin will temporarily off this service. <br/>
          <span className="font-bold text-gray-900">Keep patience for latest updates.</span>
        </p>
      </div>

      <div className="w-full max-w-xs">
        <Button 
          onClick={() => navigate(-1)}
          className="w-full h-14 rounded-2xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Button>
      </div>
      
      <div className="mt-12 text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">
        System Administration Control Active
      </div>
    </div>
  );
}
