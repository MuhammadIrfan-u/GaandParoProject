import * as service from '../services/documentVerification.service.js';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

async function checkPermissionForNeighborhood(user, neighborhoodId) {
  // Allow if global admin flag present on token
  if (user?.isAdmin) return true;

  // Check Superadmin table
  try {
    const { data: sa } = await supabaseAdmin.from('Superadmin').select('id').eq('user_id', user?.id).maybeSingle();
    if (sa) return true;
  } catch (e) {
    console.error('[perm] superadmin check failed:', e.message || e);
  }

  // Check neighborhood admin field
  try {
    const nid = parseInt(String(neighborhoodId).replace(/\D/g, ''), 10);
    if (!isNaN(nid)) {
      const { data: n } = await supabaseAdmin.from('neighborhoods').select('id, admin_id').eq('id', nid).maybeSingle();
      if (n && (String(n.admin_id) === String(user?.id) || String(n.adminId) === String(user?.id))) return true;
    }
  } catch (e) {
    console.error('[perm] neighborhood admin check failed:', e.message || e);
  }

  return false;
}

/**
 * GET /api/admin/neighborhoods/:neighborhoodId/documents
 */
export async function listDocumentsByNeighborhood(req, res) {
  try {
    const { neighborhoodId } = req.params;
    const { status } = req.query;
    if (!neighborhoodId) return res.status(400).json({ error: 'Neighborhood ID is required' });
    // permission check: only global admins, superadmins, or the neighborhood's admin may view
    const allowed = await checkPermissionForNeighborhood(req.user, neighborhoodId);
    if (!allowed) return res.status(403).json({ error: 'Admin access required' });

    const docs = await service.listByNeighborhood(neighborhoodId, status);
    return res.json(docs.map((d) => ({
      id: d.id,
      userId: d.user_id,
      neighborhoodId: d.neighborhood_id,
      documentUrl: d.document_url,
      ocrName: d.ocr_name,
      ocrAddress: d.ocr_address,
      status: d.status,
      submittedAt: d.submitted_at,
      reviewedAt: d.reviewed_at,
      reviewedBy: d.reviewed_by,
      reviewNotes: d.review_notes,
    })));
  } catch (err) {
    console.error('[adminDocumentVerificationController] list error:', err.message || err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

/**
 * PATCH /api/admin/neighborhoods/:neighborhoodId/documents/:docId/status
 */
export async function changeDocumentStatus(req, res) {
  try {
    const { neighborhoodId, docId } = req.params;
    const { status, reviewNotes } = req.body;

    if (!neighborhoodId || !docId) return res.status(400).json({ error: 'Neighborhood ID and Document ID are required' });
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'status must be "approved" or "rejected"' });

    // permission check: only allow neighborhood admin/superadmin/global admin
    const allowed = await checkPermissionForNeighborhood(req.user, neighborhoodId);
    if (!allowed) return res.status(403).json({ error: 'Admin access required' });

    const reviewer = req.user?.id || req.user?.userId || null;

    const updated = await service.changeStatus(neighborhoodId, docId, status, reviewer, reviewNotes);
    return res.json({ success: true, verification: updated });
  } catch (err) {
    console.error('[adminDocumentVerificationController] changeStatus error:', err.message || err);
    if (err.message === 'Verification request not found') return res.status(404).json({ error: 'Not found' });
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
