import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { proposalsService, authService } from "../services/storage";
import { NeighborhoodProposal } from "../services/types";
import { toast } from "sonner";

export default function NeighborhoodProposalStatus() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<NeighborhoodProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      const data = await proposalsService.getProposals();
      const userProposals = data.filter(p => p.proposerId === currentUser.id);
      setProposals(userProposals);
    } catch (error) {
      toast.error("Failed to load proposals");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-12 h-12 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-12 h-12 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-12 h-12 text-red-600" />;
      default:
        return <Clock className="w-12 h-12 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 border-yellow-300';
      case 'approved':
        return 'bg-green-50 border-green-300';
      case 'rejected':
        return 'bg-red-50 border-red-300';
      default:
        return 'bg-gray-50 border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          title: 'Under Review',
          message: 'Your proposal is being reviewed by our team. This typically takes 24-48 hours.',
        };
      case 'approved':
        return {
          title: 'Approved!',
          message: 'Congratulations! Your neighborhood proposal has been approved and is now live.',
        };
      case 'rejected':
        return {
          title: 'Not Approved',
          message: 'Your proposal was not approved at this time. See details below.',
        };
      default:
        return {
          title: 'Status Unknown',
          message: 'Please contact support for more information.',
        };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl">Proposal Status</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>You haven't submitted any proposals yet.</p>
            <Button className="mt-4" onClick={() => navigate("/propose-neighborhood")}>
              Propose a Neighborhood
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {proposals.map((proposal) => {
              const status = getStatusText(proposal.status);
              return (
                <div
                  key={proposal.id}
                  className={`border-2 rounded-2xl p-6 ${getStatusColor(proposal.status)}`}
                >
                  <div className="text-center mb-6">
                    {getStatusIcon(proposal.status)}
                    <h2 className="text-2xl mt-3 mb-2">{status.title}</h2>
                    <p className="text-sm text-muted-foreground">{status.message}</p>
                  </div>

                  <div className="bg-white/50 rounded-xl p-4 space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Neighborhood Name</div>
                      <div>{proposal.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Description</div>
                      <div className="text-sm">{proposal.description}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Primary Landmark</div>
                      <div className="text-sm">{proposal.primaryLandmark}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <div className="text-xs text-muted-foreground">Submitted</div>
                        <div className="text-sm">
                          {new Date(proposal.submittedDate).toLocaleDateString()}
                        </div>
                      </div>
                      {proposal.reviewedDate && (
                        <div>
                          <div className="text-xs text-muted-foreground">Reviewed</div>
                          <div className="text-sm">
                            {new Date(proposal.reviewedDate).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                    {proposal.reviewNotes && (
                      <div className="pt-2 border-t border-border/50">
                        <div className="text-xs text-muted-foreground mb-1">Review Notes</div>
                        <div className="text-sm">{proposal.reviewNotes}</div>
                      </div>
                    )}
                  </div>

                  {proposal.status === 'pending' && (
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                      You'll receive a notification once your proposal is reviewed.
                    </div>
                  )}

                  {proposal.status === 'approved' && (
                    <Button
                      className="w-full mt-4"
                      onClick={() => {
                        toast.success("Redirecting to your neighborhood...");
                        navigate("/home");
                      }}
                    >
                      Visit Your Neighborhood
                    </Button>
                  )}

                  {proposal.status === 'rejected' && (
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => navigate("/propose-neighborhood")}
                    >
                      Submit New Proposal
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
