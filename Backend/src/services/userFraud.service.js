import KeywordDetector from '../classes/KeywordDetector.js';
import LinkDetector from '../classes/LinkDetector.js';
import FlagAssigner from '../classes/FlagAssigner.js';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

const keywordDetector = new KeywordDetector();
const linkDetector = new LinkDetector();
const flagAssigner = new FlagAssigner();

/**
 * Check a user entity for fraud indicators
 * Scans: name, bio, address for keywords; email, bio, address for links
 */
export const check = async (body) => {
  const { id, name, email, bio, address } = body;
  const results = [];

  // Step 1 — Keyword Detector: scan name, bio, address
  const textFields = [name, bio, address].filter(f => f);
  const keywordCategories = ['spam', 'phishing', 'fraud'];
  let keywordResult = { flagged: false, matchedKeywords: [], confidence: 0, severity: 'none', checks: [] };

  for (const category of keywordCategories) {
    const scanResult = keywordDetector.scanMultiple(textFields, category);
    if (scanResult.flagged) {
      keywordResult = {
        flagged: true,
        reason: `Suspicious ${category} keywords detected in user profile`,
        matchedKeywords: [...keywordResult.matchedKeywords, ...scanResult.matchedKeywords],
        confidence: Math.max(keywordResult.confidence, scanResult.confidence),
        severity: scanResult.severity,
        checks: [...keywordResult.checks, ...scanResult.checks]
      };
    } else {
      keywordResult.checks = [...keywordResult.checks, ...scanResult.checks];
    }
  }
  results.push(keywordResult);

  // Step 2 — Link Detector: check email domain + extract URLs from bio, address
  const emailResult = linkDetector.checkDisposableEmail(email);
  const linkFields = [bio, address].filter(f => f).join(' ');
  const urls = linkDetector.extractURLs(linkFields);
  const urlResult = await linkDetector.evaluateAllURLs(urls);

  const linkResult = {
    flagged: emailResult.flagged || urlResult.flagged,
    reason: emailResult.flagged ? emailResult.reason : urlResult.reason,
    confidence: emailResult.flagged ? 0.85 : urlResult.confidence,
    severity: emailResult.flagged ? 'medium' : urlResult.severity,
    checks: [...emailResult.checks, ...urlResult.checks]
  };
  results.push(linkResult);

  // Step 3 — Flag Assigner
  const finalResult = flagAssigner.assign(results);

  // Step 4 — Update database if ID provided
  if (id && finalResult.isFlagged) {
    try {
      await supabaseAdmin
        .from('users')
        .update({
          is_flagged: true,
          flag_reason: (finalResult.flagReason || '').substring(0, 50),
          moderation_status: (finalResult.moderationStatus || '').substring(0, 20)
        })
        .eq('id', id);
    } catch (dbError) {
      console.error(`Failed to update fraud status for user ${id}:`, dbError.message);
    }
  }

  return finalResult;
};

export default { check };
