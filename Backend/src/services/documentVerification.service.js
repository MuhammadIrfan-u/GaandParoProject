import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

/**
 * List verification requests for a neighborhood. Optionally filter by status.
 */
export async function listByNeighborhood(neighborhoodId, status = null) {
  const parsedNeighborhoodId = parseInt(String(neighborhoodId).replace(/\D/g, ''), 10);
  if (isNaN(parsedNeighborhoodId)) throw new Error('Invalid neighborhood ID');

  let query = supabaseAdmin
    .from('verification_requests')
    .select('id, user_id, neighborhood_id, document_url, storage_path, ocr_text, ocr_name, ocr_address, status, submitted_at, reviewed_at, review_notes, reviewed_by')
    .eq('neighborhood_id', parsedNeighborhoodId)
    .order('submitted_at', { ascending: false });

  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Change the status of a verification request.
 * Also handles side-effects: upsert membership for approved and set users.verified when conditions met.
 */
export async function changeStatus(neighborhoodId, docId, status, reviewedBy, reviewNotes = null) {
  const parsedNeighborhoodId = parseInt(String(neighborhoodId).replace(/\D/g, ''), 10);
  if (isNaN(parsedNeighborhoodId)) throw new Error('Invalid neighborhood ID');

  const numericDocId = parseInt(String(docId).replace(/\D/g, ''), 10);
  if (isNaN(numericDocId)) throw new Error('Invalid document ID');

  if (!['approved', 'rejected'].includes(status)) throw new Error('Invalid status');

  // Fetch existing request
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from('verification_requests')
    .select('*')
    .eq('id', numericDocId)
    .eq('neighborhood_id', parsedNeighborhoodId)
    .single();

  if (fetchErr || !existing) {
    const msg = fetchErr ? fetchErr.message : 'Not found';
    const err = new Error('Verification request not found');
    err.detail = msg;
    throw err;
  }

  // Update verification_requests
  const now = new Date().toISOString();
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('verification_requests')
    .update({
      status,
      review_notes: reviewNotes || null,
      reviewed_at: now,
      reviewed_by: reviewedBy,
    })
    .eq('id', numericDocId)
    .select()
    .single();

  if (updateErr) throw updateErr;

  // If approved, ensure neighborhood_members entry exists/set to verified
  if (status === 'approved' && existing.neighborhood_id) {
    try {
      await supabaseAdmin
        .from('neighborhood_members')
        .upsert(
          [{ user_id: String(existing.user_id), neighborhood_id: parsedNeighborhoodId, status: 'verified', verified_at: now }],
          { onConflict: 'user_id,neighborhood_id', ignoreDuplicates: false }
        );
    } catch (e) {
      // non-fatal, log
      console.error('[documentVerification.service] neighborhood_members upsert failed:', e.message || e);
    }
  }

  // After status change, evaluate whether we should set users.verified = true
  try {
    // Check for any approved verification_requests for this user
    const { data: docApproval } = await supabaseAdmin
      .from('verification_requests')
      .select('id')
      .eq('user_id', existing.user_id)
      .eq('status', 'approved')
      .limit(1)
      .maybeSingle();

    // Check neighborhood_members verified
    const { data: locVerified } = await supabaseAdmin
      .from('neighborhood_members')
      .select('id')
      .eq('user_id', String(existing.user_id))
      .eq('status', 'verified')
      .limit(1)
      .maybeSingle();

    const bothVerified = !!docApproval && !!locVerified;
    if (bothVerified) {
      await supabaseAdmin.from('users').update({ verified: true }).eq('id', existing.user_id);
    }
  } catch (e) {
    console.error('[documentVerification.service] post-status check failed:', e.message || e);
  }

  // Create a notification for the user
  try {
    const notifType = status === 'approved' ? 'document_approved' : 'document_rejected';
    const title = status === 'approved' ? 'Document Verified' : 'Document Rejected';
    const message = status === 'approved'
      ? 'Your verification document has been approved by neighborhood admin.'
      : `Your verification document was rejected. ${reviewNotes || ''}`;

    await supabaseAdmin.from('notifications').insert([{
      user_id: existing.user_id,
      type: notifType,
      title,
      message,
      neighborhood_id: parsedNeighborhoodId,
    }]);
  } catch (e) {
    console.error('[documentVerification.service] notification insert failed:', e.message || e);
  }

  return updated;
}
