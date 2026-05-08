import KeywordDetector from '../classes/KeywordDetector.js';
import LinkDetector from '../classes/LinkDetector.js';
import PriceAnomalyDetector from '../classes/PriceAnomalyDetector.js';
import FlagAssigner from '../classes/FlagAssigner.js';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

const keywordDetector = new KeywordDetector();
const linkDetector = new LinkDetector();
const priceDetector = new PriceAnomalyDetector();
const flagAssigner = new FlagAssigner();

/**
 * Check a service entity for fraud indicators
 * Scans: title, description for get-rich-quick / scam keywords and links; price + category for anomaly
 */
export const check = async (body) => {
  const { id, title, description, price, category } = body;
  const results = [];

  // Step 1 — Keyword Detector: scan title and description
  const textFields = [title, description].filter(f => f);
  const keywordCategories = ['fraud', 'spam', 'phishing'];
  let keywordResult = { flagged: false, matchedKeywords: [], confidence: 0, severity: 'none', checks: [] };

  for (const cat of keywordCategories) {
    const scanResult = keywordDetector.scanMultiple(textFields, cat);
    if (scanResult.flagged) {
      keywordResult = {
        flagged: true,
        reason: `Get-rich-quick scam pattern detected in service listing`,
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

  // Step 2 — Link Detector: extract URLs from description
  const urls = linkDetector.extractURLs(description || '');
  const urlResult = await linkDetector.evaluateAllURLs(urls);
  results.push(urlResult);

  // Step 3 — Price Anomaly Detector
  const priceResult = priceDetector.checkPrice(price, category || 'general');
  results.push(priceResult);

  // Step 4 — Flag Assigner
  const finalResult = flagAssigner.assign(results);

  // Step 5 — Update database if ID provided
  if (id && finalResult.isFlagged) {
    try {
      await supabaseAdmin
        .from('services')
        .update({
          is_flagged: true,
          flag_reason: finalResult.flagReason,
          moderation_status: finalResult.moderationStatus
        })
        .eq('id', id);
    } catch (dbError) {
      console.error(`Failed to update fraud status for service ${id}:`, dbError.message);
    }
  }

  return finalResult;
};

export default { check };
