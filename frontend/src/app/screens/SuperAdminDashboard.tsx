import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, CheckCircle, XCircle, Trash2, MapPin, Users, Shield, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { proposalsService, neighborhoodsService, authService } from "../services/storage";
import { NeighborhoodProposal, Neighborhood } from "../services/types";
import { toast } from "sonner";

type Tab = 'proposals' | 'neighborhoods';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [activeTab, setActiveTab] = useState<Tab>('proposals');
  const [proposals, setProposals] = useState<NeighborhoodProposal[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<NeighborhoodProposal | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is super admin
    if (!currentUser.isAdmin) {
      toast.error("Access denied. Super Admin only.");
      navigate("/home");
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [proposalsData, neighborhoodsData] = await Promise.all([
        proposalsService.getProposals(),
        neighborhoodsService.getNeighborhoods(),
      ]);
      setProposals(proposalsData);
      setNeighborhoods(neighborhoodsData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (proposalId: string) => {
    if (!reviewNotes.trim()) {
      toast.error("Please add review notes");
      return;
    }

    try {
      await proposalsService.updateProposalStatus(proposalId, 'approved', reviewNotes);
      toast.success("Proposal approved!");
      setSelectedProposal(null);
      setReviewNotes("");
      await loadData();
    } catch (error) {
      toast.error("Failed to approve proposal");
    }
  };

  const handleReject = async (proposalId: string) => {
    if (!reviewNotes.trim()) {
      toast.error("Please add review notes explaining the rejection");
      return;
    }

    try {
      await proposalsService.updateProposalStatus(proposalId, 'rejected', reviewNotes);
      toast.success("Proposal rejected");
      setSelectedProposal(null);
      setReviewNotes("");
      await loadData();
    } catch (error) {
      toast.error("Failed to reject proposal");
    }
  };

  const handleDeleteNeighborhood = async (neighborhoodId: string) => {
    try {
      await neighborhoodsService.deleteNeighborhood(neighborhoodId);
      toast.success("Neighborhood deleted successfully");
      setShowDeleteConfirm(null);
      await loadData();
    } catch (error) {
      toast.error("Failed to delete neighborhood");
    }
  };

  const pendingProposals = proposals.filter(p => p.status === 'pending');
  const reviewedProposals = proposals.filter(p => p.status !== 'pending');

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-6 h-6" />
                <h1 className="text-2xl">Super Admin</h1>
              </div>
              <p className="text-sm opacity-90">Neighborhood Management Dashboard</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('proposals')}
              className={`flex-1 py-3 px-4 rounded-xl transition-all ${
                activeTab === 'proposals'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <div className="text-sm">Proposals</div>
              <div className="text-xl mt-1">{pendingProposals.length}</div>
            </button>
            <button
              onClick={() => setActiveTab('neighborhoods')}
              className={`flex-1 py-3 px-4 rounded-xl transition-all ${
                activeTab === 'neighborhoods'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <div className="text-sm">Neighborhoods</div>
              <div className="text-xl mt-1">{neighborhoods.length}</div>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <>
            {/* Proposals Tab */}
            {activeTab === 'proposals' && (
              <div className="space-y-6">
                {/* Pending Proposals */}
                {pendingProposals.length > 0 && (
                  <div>
                    <h2 className="text-lg mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      Pending Review ({pendingProposals.length})
                    </h2>
                    <div className="space-y-4">
                      {pendingProposals.map((proposal) => (
                        <div
                          key={proposal.id}
                          className="bg-white rounded-2xl border-2 border-yellow-200 overflow-hidden"
                        >
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-xl mb-2">{proposal.name}</h3>
                                <p className="text-sm text-muted-foreground mb-3">{proposal.description}</p>
                                
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                    <span>{proposal.primaryLandmark}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span>{new Date(proposal.submittedDate).toLocaleDateString()}</span>
                                  </div>
                                </div>

                                <div className="bg-muted/30 rounded-xl p-3 text-sm mb-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <div className="text-muted-foreground text-xs mb-1">City</div>
                                      <div>{proposal.city}, {proposal.state}</div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground text-xs mb-1">Proposed by</div>
                                      <div>{proposal.proposerName}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="ml-4">
                                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                                  Pending
                                </div>
                              </div>
                            </div>

                            {selectedProposal?.id === proposal.id ? (
                              /* Review Form */
                              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                                <label className="block text-sm mb-2">Review Notes *</label>
                                <Textarea
                                  value={reviewNotes}
                                  onChange={(e) => setReviewNotes(e.target.value)}
                                  placeholder="Add notes about this proposal (required)..."
                                  className="mb-3 min-h-[100px]"
                                />
                                <div className="flex gap-3">
                                  <Button
                                    onClick={() => handleApprove(proposal.id)}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    onClick={() => handleReject(proposal.id)}
                                    variant="outline"
                                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                                  >
                                    <XCircle className="w-5 h-5 mr-2" />
                                    Reject
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setSelectedProposal(null);
                                      setReviewNotes("");
                                    }}
                                    variant="outline"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              /* Action Buttons */
                              <Button
                                onClick={() => setSelectedProposal(proposal)}
                                className="w-full bg-primary hover:bg-primary/90"
                              >
                                Review Proposal
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviewed Proposals */}
                {reviewedProposals.length > 0 && (
                  <div>
                    <h2 className="text-lg mb-4">Recently Reviewed ({reviewedProposals.length})</h2>
                    <div className="space-y-3">
                      {reviewedProposals.map((proposal) => (
                        <div
                          key={proposal.id}
                          className={`bg-white rounded-xl border p-4 ${
                            proposal.status === 'approved' 
                              ? 'border-green-200 bg-green-50/30' 
                              : 'border-red-200 bg-red-50/30'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4>{proposal.name}</h4>
                                {proposal.status === 'approved' ? (
                                  <div className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Approved
                                  </div>
                                ) : (
                                  <div className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                                    <XCircle className="w-3 h-3" />
                                    Rejected
                                  </div>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mb-2">
                                Reviewed: {new Date(proposal.reviewedDate!).toLocaleDateString()}
                              </div>
                              {proposal.reviewNotes && (
                                <div className="text-sm bg-white/50 rounded p-2">
                                  <span className="text-muted-foreground">Notes: </span>
                                  {proposal.reviewNotes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {proposals.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No proposals submitted yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Neighborhoods Tab */}
            {activeTab === 'neighborhoods' && (
              <div className="space-y-4">
                {neighborhoods.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No neighborhoods created yet</p>
                  </div>
                ) : (
                  neighborhoods.map((neighborhood) => (
                    <div
                      key={neighborhood.id}
                      className="bg-white rounded-2xl border border-border overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl">{neighborhood.name}</h3>
                              {neighborhood.verified && (
                                <div className="bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center">
                                  <Shield className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{neighborhood.description}</p>
                            
                            <div className="grid grid-cols-3 gap-3 mb-4">
                              <div className="bg-muted/30 rounded-xl p-3 text-center">
                                <Users className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                                <div className="text-lg">{neighborhood.population}</div>
                                <div className="text-xs text-muted-foreground">Members</div>
                              </div>
                              <div className="bg-muted/30 rounded-xl p-3 text-center">
                                <MapPin className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                                <div className="text-sm mt-1">{neighborhood.city}</div>
                                <div className="text-xs text-muted-foreground">City</div>
                              </div>
                              <div className="bg-muted/30 rounded-xl p-3 text-center">
                                <Calendar className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                                <div className="text-xs mt-1">{new Date(neighborhood.createdDate).getFullYear()}</div>
                                <div className="text-xs text-muted-foreground">Created</div>
                              </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm">
                              <div className="text-muted-foreground mb-1">Neighborhood Lead</div>
                              <div>{neighborhood.leadName}</div>
                            </div>
                          </div>
                        </div>

                        {showDeleteConfirm === neighborhood.id ? (
                          /* Delete Confirmation */
                          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
                            <div className="flex items-start gap-3 mb-4">
                              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="text-sm mb-1"><strong>Confirm Deletion</strong></div>
                                <p className="text-xs text-red-800">
                                  This will permanently delete "{neighborhood.name}" and all associated data. 
                                  This action cannot be undone.
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <Button
                                onClick={() => handleDeleteNeighborhood(neighborhood.id)}
                                className="flex-1 bg-red-600 hover:bg-red-700"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Confirm Delete
                              </Button>
                              <Button
                                onClick={() => setShowDeleteConfirm(null)}
                                variant="outline"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* Action Buttons */
                          <div className="flex gap-3">
                            <Button
                              onClick={() => navigate("/hub-settings")}
                              variant="outline"
                              className="flex-1"
                            >
                              Hub Settings
                            </Button>
                            <Button
                              onClick={() => setShowDeleteConfirm(neighborhood.id)}
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}