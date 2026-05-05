import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Clock, Calendar, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { servicesService, authService } from "../services/storage";
import { ServiceRequest } from "../services/types";
import { toast } from "sonner";
import { motion } from "motion/react";

export default function ServiceRequests() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const isProvider = currentUser.isProvider;
  
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, [isProvider]);

  const loadRequests = async () => {
    try {
      let data: ServiceRequest[] = [];
      if (isProvider) {
        data = await servicesService.getProviderRequests(currentUser.name);
      } else {
        data = await servicesService.getMyRequests();
      }
      setRequests(data);
    } catch (error) {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'accepted': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="glass-header sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">
            {isProvider ? "Received Requests" : "Sent Requests"}
          </h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-10">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No requests found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-5 rounded-2xl border border-border shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{request.serviceName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {isProvider ? `Requested by User ID: ${request.userId}` : `Provider: ${request.provider}`}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
                
                <div className="bg-muted/30 p-3 rounded-xl mb-3">
                  <p className="text-sm text-foreground/80">{request.description}</p>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Requested: {new Date(request.requestDate).toLocaleDateString()}
                  </div>
                  {request.scheduledDate && (
                    <div className="flex items-center gap-1 text-primary font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      For: {new Date(request.scheduledDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
