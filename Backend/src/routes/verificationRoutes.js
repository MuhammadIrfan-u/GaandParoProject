import express from 'express';
import multer from 'multer';
import { createWorker } from 'tesseract.js';
import { supabase } from '../supabaseClient.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ─── Thresholds (tune here without touching logic) ────────────────────────────
const THRESHOLDS = {
    AUTO_APPROVE: 0.85,   // finalScore >= this → auto-approve
    AUTO_REJECT: 0.40,   // finalScore <  this → auto-reject
    // between the two → pending admin review
};

// ─── Multer ───────────────────────────────────────────────────────────────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are accepted (jpeg, png, webp, etc.)'));
    },
});

// ─── Signal A: OCR confidence ─────────────────────────────────────────────────
/**
 * Compute OCR confidence from Tesseract output.
 *
 * Tesseract.js v7 changed the data structure — words/lines may be empty
 * even when text is extracted. We use a cascade of fallbacks:
 *
 *  1. Word-level average (most reliable when available)
 *  2. Line-level average
 *  3. Top-level data.confidence (0–100)
 *  4. Heuristic: if raw text has ≥ 3 words → assume 0.65 (readable)
 *
 * Returns 0–1.
 */
function computeOcrConfidence(tesseractData, rawText) {
    // Fallback 1: word-level average
    const words = tesseractData.words || [];
    const meaningfulWords = words.filter((w) => w.text && w.text.trim().length > 1);
    if (meaningfulWords.length > 0) {
        const avg = meaningfulWords.reduce((s, w) => s + (w.confidence || 0), 0) / meaningfulWords.length;
        return avg / 100;
    }

    // Fallback 2: line-level average
    const lines = tesseractData.lines || [];
    const meaningfulLines = lines.filter((l) => l.text && l.text.trim().length > 1);
    if (meaningfulLines.length > 0) {
        const avg = meaningfulLines.reduce((s, l) => s + (l.confidence || 0), 0) / meaningfulLines.length;
        return avg / 100;
    }

    // Fallback 3: top-level confidence field
    if (typeof tesseractData.confidence === 'number' && tesseractData.confidence > 0) {
        return tesseractData.confidence / 100;
    }

    // Fallback 4: heuristic from raw text
    // If we got readable text with multiple words, treat it as medium confidence
    if (rawText) {
        const tokenCount = rawText.trim().split(/\s+/).filter((t) => t.length > 1).length;
        if (tokenCount >= 10) return 0.72; // lots of text → decent quality
        if (tokenCount >= 5) return 0.65; // some text → medium quality
        if (tokenCount >= 2) return 0.55; // minimal text → low-medium
    }

    return 0; // truly nothing extracted
}

// ─── Signal B: Name match ─────────────────────────────────────────────────────
/**
 * Token-overlap fuzzy match — bidirectional.
 *
 * Standard overlap: matching tokens / max(len A, len B)
 * BUT also check if the shorter name is fully contained in the longer one.
 * This handles:
 *   "ALEX" vs "Alex Thompson" → "alex" is in ["alex","thompson"] → 1.0 contained
 *   "Ali Hassan" vs "Hassan Ali" → both tokens match → 1.0
 *   "Alex" vs "Alexander" → partial token match via startsWith → 0.8
 *
 * Returns 0–1.
 */
function fuzzyNameMatch(a, b) {
    if (!a || !b) return 0;

    const normalise = (s) =>
        s.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/).filter(Boolean);

    const tokensA = normalise(a);
    const tokensB = normalise(b);
    if (!tokensA.length || !tokensB.length) return 0;

    // Exact token overlap
    const exactMatches = tokensA.filter((t) => tokensB.includes(t)).length;
    const overlapScore = exactMatches / Math.max(tokensA.length, tokensB.length);

    // Containment bonus: if ALL tokens of the shorter name appear in the longer
    const shorter = tokensA.length <= tokensB.length ? tokensA : tokensB;
    const longer = tokensA.length <= tokensB.length ? tokensB : tokensA;
    const allContained = shorter.every((t) => longer.includes(t));
    if (allContained) return 1.0; // e.g. "ALEX" fully contained in "Alex Thompson"

    // Partial token match: startsWith (handles "Alex" vs "Alexander")
    const partialMatches = tokensA.filter((ta) =>
        tokensB.some((tb) => tb.startsWith(ta) || ta.startsWith(tb))
    ).length;
    const partialScore = partialMatches / Math.max(tokensA.length, tokensB.length);

    return Math.max(overlapScore, partialScore * 0.85); // partial match slightly discounted
}

// ─── Signal C: Address match ──────────────────────────────────────────────────
/**
 * Compare OCR address against neighborhood city/state.
 * Uses token overlap — addresses are messy so we're lenient.
 * Returns 0–1.
 */
function addressMatchScore(ocrAddress, neighborhoodCity, neighborhoodState) {
    if (!ocrAddress) return 0;
    const haystack = ocrAddress.toLowerCase();
    let score = 0;
    if (neighborhoodCity && haystack.includes(neighborhoodCity.toLowerCase())) score += 0.5;
    if (neighborhoodState && haystack.includes(neighborhoodState.toLowerCase())) score += 0.5;
    return score;
}

// ─── Decision engine ──────────────────────────────────────────────────────────
/**
 * Weighted verification score:
 *   40% OCR confidence  (text extraction quality)
 *   35% Name match      (identity signal)
 *   25% Address match   (location signal)
 *
 * Returns { finalScore, decision, signals, autoReviewNote }
 *   decision: 'approved' | 'pending' | 'rejected'
 */
function makeDecision({ ocrConfidence, nameMatch, addrMatch }) {
    const finalScore =
        0.40 * ocrConfidence +
        0.35 * nameMatch +
        0.25 * addrMatch;

    const signals = {
        ocrConfidence: +ocrConfidence.toFixed(3),
        nameMatch: +nameMatch.toFixed(3),
        addrMatch: +addrMatch.toFixed(3),
        finalScore: +finalScore.toFixed(3),
    };

    let decision;
    let autoReviewNote;

    if (finalScore >= THRESHOLDS.AUTO_APPROVE) {
        decision = 'approved';
        autoReviewNote = `Auto-approved. Score ${signals.finalScore} (OCR ${signals.ocrConfidence}, name ${signals.nameMatch}, addr ${signals.addrMatch})`;
    } else if (finalScore < THRESHOLDS.AUTO_REJECT) {
        decision = 'rejected';
        autoReviewNote = buildRejectReason(signals);
    } else {
        decision = 'pending';
        autoReviewNote = buildPendingReason(signals);
    }

    return { finalScore, decision, signals, autoReviewNote };
}

function buildRejectReason({ ocrConfidence, nameMatch, addrMatch }) {
    const reasons = [];
    if (ocrConfidence < 0.50) reasons.push('document unreadable or too blurry');
    if (nameMatch < 0.30) reasons.push('name could not be matched');
    if (addrMatch === 0) reasons.push('no address information found');
    return `Auto-rejected: ${reasons.join('; ') || 'score too low'}. Please re-upload a clearer image.`;
}

function buildPendingReason({ ocrConfidence, nameMatch, addrMatch }) {
    const flags = [];
    if (ocrConfidence < 0.70) flags.push('OCR quality below threshold');
    if (nameMatch < 0.70) flags.push('partial name match');
    if (addrMatch < 0.50) flags.push('address uncertain');
    return `Queued for admin review: ${flags.join('; ') || 'mixed signals'}`;
}

// ─── Field extractor ──────────────────────────────────────────────────────────
/**
 * Try to extract a labelled field first ("Name: John"),
 * then fall back to scanning for the value directly in the text.
 */
function extractField(text, labels) {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    for (let i = 0; i < lines.length; i++) {
        for (const label of labels) {
            // "Name: John Doe" on same line
            const inlineMatch = lines[i].match(new RegExp(`${label}[:\\s]+(.+)`, 'i'));
            if (inlineMatch?.[1]?.trim()) return inlineMatch[1].trim();
            // "Name" on its own line, value on next
            if (new RegExp(`^${label}\\s*:?\\s*$`, 'i').test(lines[i]) && lines[i + 1]) {
                return lines[i + 1].trim();
            }
        }
    }
    return null;
}

/**
 * Heuristic name extraction when no label is present.
 * Looks for ALL-CAPS lines of 2–4 words that look like a person's name.
 * e.g. "ALEX THOMPSON" → "Alex Thompson"
 */
function extractNameHeuristic(text) {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
        // Must be 2–4 words, all uppercase letters only
        const tokens = line.split(/\s+/);
        if (
            tokens.length >= 2 &&
            tokens.length <= 4 &&
            tokens.every((t) => /^[A-Z]{2,}$/.test(t))
        ) {
            // Title-case it
            return tokens.map((t) => t[0] + t.slice(1).toLowerCase()).join(' ');
        }
    }
    return null;
}

/**
 * Heuristic address extraction when no label is present.
 * Looks for lines containing city/country keywords or comma-separated location strings.
 */
function extractAddressHeuristic(text) {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
        // Line contains a comma and looks like "City, Country" or "Street, City"
        if (line.includes(',') && line.length > 5 && line.length < 120) {
            // Exclude lines that are clearly not addresses (dates, IDs, etc.)
            if (!/^\d/.test(line) && !/\d{4,}/.test(line)) {
                // Strip common OCR noise characters from start/end
                return line.replace(/^[\[\]|!@#$%^&*]+|[\[\]|!@#$%^&*]+$/g, '').trim();
            }
        }
    }
    return null;
}

// ─── Shared helper: add to neighborhood_members ───────────────────────────────
async function addToNeighborhood(userId, neighborhoodId) {
    const { error } = await supabase
        .from('neighborhood_members')
        .upsert(
            [{ user_id: String(userId), neighborhood_id: neighborhoodId, status: 'verified', verified_at: new Date().toISOString() }],
            { onConflict: 'user_id,neighborhood_id', ignoreDuplicates: true }
        );
    if (error) {
        console.error('neighborhood_members upsert error (non-fatal):', error.message);
    } else {
        console.log(`[MEMBERSHIP] User ${userId} successfully added/updated in neighborhood ${neighborhoodId}`);
    }
}

// ─── Shared helper: flip users.verified = true when BOTH conditions met ────────
/**
 * Sets users.verified = true when:
 *   1. verification_requests has an 'approved' row for this user  (OCR/document)
 *   2. neighborhood_members   has a  'verified' row for this user (location)
 *
 * Called after every approval event (auto or manual, OCR or location).
 */
async function checkAndSetUserVerified(userId) {
    try {
        const userIdStr = String(userId);

        // Check OCR document approval
        const { data: docApproval } = await supabase
            .from('verification_requests')
            .select('id')
            .eq('user_id', userId)          // integer column
            .eq('status', 'approved')
            .limit(1)
            .maybeSingle();

        // Check location verification
        const { data: locVerified } = await supabase
            .from('neighborhood_members')
            .select('id')
            .eq('user_id', userIdStr)       // varchar column
            .eq('status', 'verified')
            .limit(1)
            .maybeSingle();

        const bothVerified = !!docApproval && !!locVerified;

        console.log(`[VERIFIED CHECK] userId=${userId} docApproved=${!!docApproval} locVerified=${!!locVerified} → setVerified=${bothVerified}`);

        if (bothVerified) {
            const { error } = await supabase
                .from('users')
                .update({ verified: true })
                .eq('id', userId);

            if (error) {
                console.error('[VERIFIED CHECK] Failed to set users.verified:', error.message);
            } else {
                console.log(`[VERIFIED CHECK] ✓ users.verified = true for userId=${userId}`);
            }
        }
    } catch (err) {
        console.error('[VERIFIED CHECK] error (non-fatal):', err.message);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/verifications/upload
 *
 * Decision flow:
 *   1. OCR → extract text, words, confidence
 *   2. Extract name + address fields
 *   3. Fetch user's registered name + neighborhood city/state
 *   4. Compute weighted score
 *   5. Decide: auto-approve / pending / auto-reject
 *   6. Upload image to Supabase Storage
 *   7. Insert verification_request with decision
 *   8. If auto-approved → add to neighborhood_members immediately
 */
router.post('/verifications/upload', requireAuth, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded', code: 'NO_FILE' });
        }

        const { neighborhoodId } = req.body;
        const userId = req.user.id || req.user.userId;
        const parsedNeighborhoodId = neighborhoodId ? parseInt(neighborhoodId) : null;

        // ── 1. OCR ────────────────────────────────────────────────────────────────
        let ocrText = '';
        let ocrName = null;
        let ocrAddress = null;
        let ocrConfidence = 0;
        let tesseractWords = [];

        try {
            const worker = await createWorker('eng');
            const { data } = await worker.recognize(req.file.buffer);
            await worker.terminate();

            ocrText = data.text || '';
            tesseractWords = data.words || [];
            ocrConfidence = computeOcrConfidence(data, ocrText); // pass rawText for heuristic fallback

            // Try labelled extraction first, then heuristic fallback
            ocrName = extractField(ocrText, ['Full Name', 'Name', 'Holder', 'Cardholder'])
                || extractNameHeuristic(ocrText);

            ocrAddress = extractField(ocrText, ['Address', 'Residence', 'Permanent Address', 'Home Address'])
                || extractAddressHeuristic(ocrText);

            // Strip OCR noise from extracted fields
            if (ocrName) ocrName = ocrName.replace(/^[\[\]|]+|[\[\]|]+$/g, '').trim();
            if (ocrAddress) ocrAddress = ocrAddress.replace(/^[\[\]|]+|[\[\]|]+$/g, '').trim();

            // ── DEBUG ──────────────────────────────────────────────────────────────
            console.log('\n========== OCR DEBUG START ==========');
            console.log(`File      : ${req.file.originalname || 'upload'} (${req.file.mimetype}, ${(req.file.size / 1024).toFixed(1)} KB)`);
            console.log(`Words arr : ${tesseractWords.length} entries`);
            console.log(`Confidence: ${(ocrConfidence * 100).toFixed(1)}% (after fallback)`);
            console.log('--- RAW OCR TEXT ---');
            console.log(ocrText);
            if (tesseractWords.length > 0) {
                console.log('--- TOP 10 WORDS BY CONFIDENCE ---');
                [...tesseractWords]
                    .sort((a, b) => b.confidence - a.confidence)
                    .slice(0, 10)
                    .forEach(w => console.log(`  "${w.text}" → ${w.confidence?.toFixed(1)}%`));
            }
            console.log('--- EXTRACTED FIELDS ---');
            console.log(`  name    : ${ocrName}`);
            console.log(`  address : ${ocrAddress}`);
            console.log('========== OCR DEBUG END ============\n');
            // ── END DEBUG ──────────────────────────────────────────────────────────

        } catch (ocrErr) {
            console.error('[OCR] error (non-fatal):', ocrErr.message);
        }

        // ── 2. Fetch user + neighborhood for matching ─────────────────────────────
        const { data: userRow } = await supabase
            .from('users')
            .select('name')
            .eq('id', userId)
            .single();
        const registeredName = userRow?.name || null;

        let neighborhoodCity = null;
        let neighborhoodState = null;
        if (parsedNeighborhoodId) {
            const { data: nRow } = await supabase
                .from('neighborhoods')
                .select('city, state')
                .eq('id', parsedNeighborhoodId)
                .single();
            neighborhoodCity = nRow?.city || null;
            neighborhoodState = nRow?.state || null;
        }

        // ── 3. Compute signals ────────────────────────────────────────────────────
        const nameMatch = fuzzyNameMatch(registeredName, ocrName);
        const addrMatch = addressMatchScore(ocrAddress, neighborhoodCity, neighborhoodState);

        const { finalScore, decision, signals, autoReviewNote } = makeDecision({
            ocrConfidence,
            nameMatch,
            addrMatch,
        });

        console.log('\n========== DECISION DEBUG ==========');
        console.log(`User ID        : ${userId}`);
        console.log(`Neighborhood ID: ${parsedNeighborhoodId}`);
        console.log(`Registered name: ${registeredName}`);
        console.log(`OCR name       : ${ocrName}`);
        console.log(`OCR address    : ${ocrAddress}`);
        console.log(`Neighborhood   : ${neighborhoodCity}, ${neighborhoodState}`);
        console.log(`--- Signals ---`);
        console.log(`  OCR confidence : ${(signals.ocrConfidence * 100).toFixed(1)}%  (weight 40%)`);
        console.log(`  Name match     : ${(signals.nameMatch * 100).toFixed(1)}%  (weight 35%)`);
        console.log(`  Address match  : ${(signals.addrMatch * 100).toFixed(1)}%  (weight 25%)`);
        console.log(`  Final score    : ${(signals.finalScore * 100).toFixed(1)}%`);
        console.log(`--- Decision ---`);
        console.log(`  → ${decision.toUpperCase()}`);
        console.log(`  ${autoReviewNote}`);
        console.log('=====================================\n');

        // ── 4. Upload image to Supabase Storage ───────────────────────────────────
        const ext = req.file.mimetype.split('/')[1] || 'jpg';
        const storagePath = `${userId}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from('verification-documents')
            .upload(storagePath, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

        if (uploadError) {
            console.error('[STORAGE] upload error:', uploadError.message);
            return res.status(500).json({ error: 'Failed to upload document', code: 'STORAGE_ERROR' });
        }

        const { data: signedData } = await supabase.storage
            .from('verification-documents')
            .createSignedUrl(storagePath, 60 * 60 * 24 * 7);
        const documentUrl = signedData?.signedUrl || storagePath;

        // ── 5. Insert verification_request ───────────────────────────────────────
        const now = new Date().toISOString();
        const isAutoDecided = decision !== 'pending';

        const { data: inserted, error: dbError } = await supabase
            .from('verification_requests')
            .insert([{
                user_id: userId,
                neighborhood_id: parsedNeighborhoodId,
                document_url: documentUrl,
                storage_path: storagePath,
                ocr_text: ocrText,
                ocr_name: ocrName,
                ocr_address: ocrAddress,
                status: decision,
                review_notes: isAutoDecided ? autoReviewNote : null,
                reviewed_at: isAutoDecided ? now : null,
                submitted_at: now,
            }])
            .select()
            .single();

        if (dbError) {
            console.error('[DB] insert error:', dbError.message);
            return res.status(500).json({ error: 'Failed to save verification request', code: 'DB_ERROR' });
        }

        // ── 6. Auto-approve → add to neighborhood_members ────────────────────────
        if (decision === 'approved' && parsedNeighborhoodId) {
            await addToNeighborhood(userId, parsedNeighborhoodId);
            await checkAndSetUserVerified(userId);
        }

        // ── 7. Respond ────────────────────────────────────────────────────────────
        return res.status(201).json({
            success: true,
            id: inserted.id,
            status: decision,
            autoDecided: isAutoDecided,
            extractedName: ocrName,
            extractedAddress: ocrAddress,
            signals,
            registeredName,
            reviewNote: isAutoDecided ? autoReviewNote : null,
            // debug fields — remove in production
            _debug: {
                rawOcrText: ocrText,
                wordCount: tesseractWords.length,
                ocrConfidence: +(ocrConfidence * 100).toFixed(1),
            },
        });

    } catch (err) {
        console.error('[UPLOAD] route error:', err);
        return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
});

/**
 * GET /api/verifications/my-status
 */
router.get('/verifications/my-status', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('verification_requests')
            .select('id, status, submitted_at, reviewed_at, review_notes, ocr_name, ocr_address, neighborhood_id')
            .eq('user_id', req.user.id || req.user.userId)
            .order('submitted_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) return res.status(500).json({ error: 'Failed to fetch status', code: 'DB_ERROR' });
        if (!data) return res.json({ status: 'none' });

        return res.json({
            status: data.status,
            submittedAt: data.submitted_at,
            reviewedAt: data.reviewed_at,
            reviewNotes: data.review_notes,
            ocrName: data.ocr_name,
            ocrAddress: data.ocr_address,
            neighborhoodId: data.neighborhood_id,
        });
    } catch (err) {
        console.error('[MY-STATUS] error:', err);
        return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
});

/**
 * GET /api/verifications/pending  (ADMIN ONLY)
 */
router.get('/verifications/pending', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('verification_requests')
            .select('id, user_id, neighborhood_id, document_url, storage_path, ocr_text, ocr_name, ocr_address, status, submitted_at')
            .eq('status', 'pending')
            .order('submitted_at', { ascending: true });

        if (error) {
            console.error('[PENDING] Supabase error:', error.message);
            return res.status(500).json({ error: 'Failed to fetch pending verifications', code: 'DB_ERROR', detail: error.message });
        }

        const rows = data || [];
        const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
        const neighborhoodIds = [...new Set(rows.map((r) => r.neighborhood_id).filter(Boolean))];

        const usersMap = {};
        if (userIds.length > 0) {
            const { data: usersData } = await supabase.from('users').select('id, name, email').in('id', userIds);
            (usersData || []).forEach((u) => { usersMap[u.id] = u; });
        }

        const neighborhoodsMap = {};
        if (neighborhoodIds.length > 0) {
            const { data: nData } = await supabase.from('neighborhoods').select('id, name').in('id', neighborhoodIds);
            (nData || []).forEach((n) => { neighborhoodsMap[n.id] = n; });
        }

        const enriched = await Promise.all(
            rows.map(async (row) => {
                let freshUrl = row.document_url;
                if (row.storage_path) {
                    const { data: sd } = await supabase.storage
                        .from('verification-documents')
                        .createSignedUrl(row.storage_path, 60 * 60 * 2);
                    if (sd?.signedUrl) freshUrl = sd.signedUrl;
                }
                const user = usersMap[row.user_id] || {};
                const neighborhood = neighborhoodsMap[row.neighborhood_id] || {};
                return {
                    id: row.id,
                    userId: row.user_id,
                    userName: user.name || 'Unknown',
                    userEmail: user.email || '',
                    documentUrl: freshUrl,
                    ocrText: row.ocr_text,
                    ocrName: row.ocr_name,
                    ocrAddress: row.ocr_address,
                    submittedAt: row.submitted_at,
                    neighborhoodId: row.neighborhood_id,
                    neighborhoodName: neighborhood.name || null,
                };
            })
        );

        return res.json(enriched);
    } catch (err) {
        console.error('[PENDING] error:', err);
        return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
});

/**
 * PUT /api/verifications/:id/review  (ADMIN ONLY)
 */
router.put('/verifications/:id/review', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reviewNotes } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'status must be "approved" or "rejected"', code: 'INVALID_STATUS' });
        }

        const { data: existing, error: fetchErr } = await supabase
            .from('verification_requests')
            .select('id, user_id, neighborhood_id, status')
            .eq('id', id)
            .single();

        if (fetchErr || !existing) {
            return res.status(404).json({ error: 'Verification request not found', code: 'NOT_FOUND' });
        }

        const { data: updated, error: updateErr } = await supabase
            .from('verification_requests')
            .update({
                status,
                review_notes: reviewNotes || null,
                reviewed_at: new Date().toISOString(),
                reviewed_by: req.user.id || req.user.userId,
            })
            .eq('id', id)
            .select()
            .single();

        if (updateErr) {
            return res.status(500).json({ error: 'Failed to update verification', code: 'DB_ERROR' });
        }

        if (status === 'approved' && existing.neighborhood_id) {
            await addToNeighborhood(existing.user_id, existing.neighborhood_id);
            await checkAndSetUserVerified(existing.user_id);
        }

        return res.json({ success: true, verification: updated });
    } catch (err) {
        console.error('[REVIEW] error:', err);
        return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
});

// ─── Multer error handler ─────────────────────────────────────────────────────
router.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE')
            return res.status(413).json({ error: 'File too large. Maximum size is 5 MB.', code: 'FILE_TOO_LARGE' });
        return res.status(400).json({ error: err.message, code: 'UPLOAD_ERROR' });
    }
    if (err) return res.status(400).json({ error: err.message, code: 'UPLOAD_ERROR' });
});

export default router;
