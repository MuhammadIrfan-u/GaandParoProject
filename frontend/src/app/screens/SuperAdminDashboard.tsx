import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, CheckCircle, XCircle, Trash2, MapPin, Users, Shield, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { proposalsService, neighborhoodsService, authService, superadminService } from "../services/storage";
import { supabase } from "../services/supabaseClient";
import { NeighborhoodProposal, Neighborhood, User } from "../services/types";
import { toast } from "sonner";

type Tab = 'proposals' | 'neighborhoods' | 'superadmins';

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

  // Superadmin Management States
  const [nbAdmins, setNbAdmins] = useState<any[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);
  const [promotionDescription, setPromotionDescription] = useState("");
  const [isPromoting, setIsPromoting] = useState(false);

  // Admin Change States
  const [selectedNeighborhoodForAdminChange, setSelectedNeighborhoodForAdminChange] = useState<Neighborhood | null>(null);
  const [neighborhoodMembers, setNeighborhoodMembers] = useState<User[]>([]);
  const [newAdmin, setNewAdmin] = useState<User | null>(null);
  const [adminChangeDescription, setAdminChangeDescription] = useState("");
  const [isChangingAdmin, setIsChangingAdmin] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const userNeighborhood = await neighborhoodsService.getUserNeighborhood();
      const isNeighborhoodAdmin = userNeighborhood?.adminId && String(userNeighborhood.adminId) === String(currentUser?.id);

      let isSuperadmin = false;
      try {
        const { data } = await supabase
          .from('Superadmin')
          .select('id')
          .eq('user_id', currentUser?.id)
          .maybeSingle();
        if (data) isSuperadmin = true;
      } catch (err) {
        console.error('Error checking superadmin status:', err);
      }

      if (!currentUser?.isAdmin && !isNeighborhoodAdmin && !isSuperadmin) {
        toast.error("Access denied. Authorized admins only.");
        navigate("/home");
        return;
      }
      loadData();
    };
    checkAccess();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [proposalsData, neighborhoodsData, adminsData] = await Promise.all([
        proposalsService.getProposals(),
        neighborhoodsService.getNeighborhoods(),
        superadminService.getAdmins()
      ]);

      setNbAdmins(adminsData);
      setNeighborhoods(neighborhoodsData);
      setProposals(proposalsData);
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

  const handleAddSuperadmin = async () => {
    if (!selectedAdmin) {
      toast.error("Please select an admin");
      return;
    }
    if (!promotionDescription.trim()) {
      toast.error("Please provide a description");
      return;
    }

    setIsPromoting(true);
    try {
      await superadminService.addSuperadmin({
        userId: selectedAdmin.userId,
        description: promotionDescription,
        neighborhoodId: selectedAdmin.neighborhoods[0]?.id // Using first neighborhood for context
      });
      toast.success(`${selectedAdmin.userName} is now a Super Admin!`);
      setPromotionDescription("");
      setSelectedAdmin(null);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to add superadmin");
    } finally {
      setIsPromoting(false);
    }
  };

  const handleOpenAdminChange = async (neighborhood: Neighborhood) => {
    setLoading(true);
    try {
      const members = await neighborhoodsService.getMembers(neighborhood.id);
      setNeighborhoodMembers(members);
      setSelectedNeighborhoodForAdminChange(neighborhood);
    } catch (error) {
      toast.error("Failed to load neighborhood members");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeAdmin = async () => {
    if (!selectedNeighborhoodForAdminChange || !newAdmin) return;
    if (!adminChangeDescription.trim()) {
      toast.error("Please provide a description for the change");
      return;
    }

    setIsChangingAdmin(true);
    try {
      await neighborhoodsService.changeAdmin(selectedNeighborhoodForAdminChange.id, {
        newAdminId: newAdmin.id,
        description: adminChangeDescription
      });
      toast.success(`Admin for ${selectedNeighborhoodForAdminChange.name} updated successfully`);
      setSelectedNeighborhoodForAdminChange(null);
      setNewAdmin(null);
      setAdminChangeDescription("");
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update admin");
    } finally {
      setIsChangingAdmin(false);
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
              className={`flex-1 py-3 px-4 rounded-xl transition-all ${activeTab === 'proposals'
                ? 'bg-white text-purple-600 shadow-lg'
                : 'bg-white/10 text-white hover:bg-white/20'
                }`}
            >
              <div className="text-sm">Proposals</div>
              <div className="text-xl mt-1">{pendingProposals.length}</div>
            </button>
            <button
              onClick={() => setActiveTab('neighborhoods')}
              className={`flex-1 py-3 px-4 rounded-xl transition-all ${activeTab === 'neighborhoods'
                ? 'bg-white text-purple-600 shadow-lg'
                : 'bg-white/10 text-white hover:bg-white/20'
                }`}
            >
              <div className="text-sm">Neighborhoods</div>
              <div className="text-xl mt-1">{neighborhoods.length}</div>
            </button>
            <button
              onClick={() => setActiveTab('superadmins')}
              className={`flex-1 py-3 px-4 rounded-xl transition-all ${activeTab === 'superadmins'
                ? 'bg-white text-purple-600 shadow-lg'
                : 'bg-white/10 text-white hover:bg-white/20'
                }`}
            >
              <div className="text-sm">Add Superadmin</div>
              <div className="text-xl mt-1">{nbAdmins.length}</div>
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
                          className={`bg-white rounded-xl border p-4 ${proposal.status === 'approved'
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

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm relative">
                              <div className="text-muted-foreground mb-1 font-medium">Neighborhood Lead</div>
                              <div className="flex items-center justify-between">
                                <div className="font-bold">{neighborhood.leadName}</div>
                                <button
                                  onClick={() => handleOpenAdminChange(neighborhood)}
                                  className="text-blue-600 hover:text-blue-800 font-bold text-xs bg-white px-3 py-1.5 rounded-lg shadow-sm border border-blue-200 transition-all hover:shadow-md"
                                >
                                  Change
                                </button>
                              </div>
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

            {/* Superadmins Tab */}
            {activeTab === 'superadmins' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-border p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-purple-600" />
                    Promote Neighborhood Admin to Super Admin
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Select an active neighborhood admin to grant them platform-wide administrative privileges.
                    They will receive a notification with your description.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Admin</label>
                      <div className="grid grid-cols-1 gap-3">
                        {nbAdmins.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground bg-muted/20 rounded-xl border-2 border-dashed">
                            No neighborhood admins found
                          </div>
                        ) : (
                          nbAdmins.map((admin) => (
                            <button
                              key={admin.userId}
                              onClick={() => setSelectedAdmin(admin)}
                              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedAdmin?.userId === admin.userId
                                ? 'border-purple-600 bg-purple-50 shadow-sm'
                                : 'border-border hover:border-purple-200'
                                }`}
                            >
                              <div className="flex items-center gap-4 text-left">
                                <div className="bg-purple-100 text-purple-700 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                                  {admin.userName.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold">{admin.userName}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Admin of: {admin.neighborhoods.map((n: any) => n.name).join(", ")}
                                  </div>
                                </div>
                              </div>
                              {selectedAdmin?.userId === admin.userId && (
                                <CheckCircle className="w-6 h-6 text-purple-600" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {selectedAdmin && (
                      <div className="pt-4 space-y-4 border-t animate-in fade-in slide-in-from-top-2">
                        <div>
                          <label className="block text-sm font-medium mb-2">Promotion Description</label>
                          <Textarea
                            value={promotionDescription}
                            onChange={(e) => setPromotionDescription(e.target.value)}
                            placeholder="Explain why this user is being promoted. This will be sent as a notification."
                            className="min-h-[120px] rounded-xl"
                          />
                        </div>
                        <Button
                          onClick={handleAddSuperadmin}
                          disabled={isPromoting || !promotionDescription.trim()}
                          className="w-full bg-purple-600 hover:bg-purple-700 h-12 rounded-xl text-lg font-bold shadow-lg shadow-purple-500/20"
                        >
                          {isPromoting ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Promoting...
                            </div>
                          ) : (
                            <>
                              <Shield className="w-5 h-5 mr-2" />
                              Confirm Promotion
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-purple-50 border-2 border-purple-100 rounded-2xl p-6">
                  <h3 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Important Note
                  </h3>
                  <p className="text-sm text-purple-700">
                    Super Admins have full control over all neighborhoods, proposals, and system settings.
                    Grant this permission only to highly trusted community members.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Change Admin Screen Overlay */}
        {selectedNeighborhoodForAdminChange && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b flex items-center justify-between bg-purple-600 text-white">
                <div>
                  <h2 className="text-2xl font-bold">Change Neighborhood Lead</h2>
                  <p className="text-purple-100 text-sm">{selectedNeighborhoodForAdminChange.name}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedNeighborhoodForAdminChange(null);
                    setNewAdmin(null);
                    setAdminChangeDescription("");
                  }}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-700">Select New Admin from Members</label>
                  <div className="space-y-3">
                    {neighborhoodMembers.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-muted-foreground">
                        No members found in this neighborhood
                      </div>
                    ) : (
                      neighborhoodMembers.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => setNewAdmin(member)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${newAdmin?.id === member.id
                              ? 'border-purple-600 bg-purple-50 shadow-sm'
                              : 'border-border hover:border-purple-200'
                            }`}
                        >
                          <div className="flex items-center gap-4 text-left">
                            <div className="bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-inner">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{member.name}</div>
                              <div className="text-sm text-gray-500">{member.email}</div>
                              {member.verified && (
                                <div className="inline-flex items-center mt-1 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                  <Shield className="w-2.5 h-2.5 mr-1" />
                                  Verified
                                </div>
                              )}
                            </div>
                          </div>
                          {newAdmin?.id === member.id && (
                            <div className="bg-purple-600 rounded-full p-1">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {newAdmin && (
                  <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Promotion Reason / Comment</label>
                      <Textarea
                        value={adminChangeDescription}
                        onChange={(e) => setAdminChangeDescription(e.target.value)}
                        placeholder="Explain the reason for this admin change. This will be sent as a notification and logged."
                        className="min-h-[120px] rounded-2xl border-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-4">
                <Button
                  onClick={() => {
                    setSelectedNeighborhoodForAdminChange(null);
                    setNewAdmin(null);
                    setAdminChangeDescription("");
                  }}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleChangeAdmin}
                  disabled={!newAdmin || !adminChangeDescription.trim() || isChangingAdmin}
                  className="flex-[2] h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20"
                >
                  {isChangingAdmin ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </div>
                  ) : (
                    <>
                      <Users className="w-5 h-5 mr-2" />
                      Confirm New Lead
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}