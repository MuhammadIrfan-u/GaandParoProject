import KeywordDetector from '../classes/KeywordDetector.js';
import LinkDetector from '../classes/LinkDetector.js';
import FlagAssigner from '../classes/FlagAssigner.js';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

const keywordDetector = new KeywordDetector();
const linkDetector = new LinkDetector();
const flagAssigner = new FlagAssigner();

/**
 * Check a comment entity for fraud indicators
 * Scans: content for spam, phishing, hate_speech keywords and links
 */
export const check = async (body) => {
  const { id, content } = body;
  const results = [];

  // Step 1 — Keyword Detector: scan content
  const keywordCategories = ['spam', 'phishing', 'hate_speech'];
  let keywordResult = { flagged: false, matchedKeywords: [], confidence: 0, severity: 'none', checks: [] };

  for (const category of keywordCategories) {
    const scanResult = keywordDetector.scan(content || '', category);
    if (scanResult.flagged) {
      keywordResult = {
        flagged: true,
        reason: `Suspicious ${category} content detected in comment`,
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

  // Step 2 — Link Detector: extract URLs from content
  const urls = linkDetector.extractURLs(content || '');
  const urlResult = await linkDetector.evaluateAllURLs(urls);
  results.push(urlResult);

  // Step 3 — Flag Assigner
  const finalResult = flagAssigner.assign(results);

  // Step 4 — Update database if ID provided
  if (id && finalResult.isFlagged) {
    try {
      await supabaseAdmin
        .from('comments')
        .update({
          is_flagged: true,
          flag_reason: (finalResult.flagReason || '').substring(0, 50),
          moderation_status: (finalResult.moderationStatus || '').substring(0, 20)
        })
        .eq('id', id);
    } catch (dbError) {
      console.error(`Failed to update fraud status for comment ${id}:`, dbError.message);
    }
  }

  return finalResult;
};

export default { check };
