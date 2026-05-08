import * as marketplaceItemFraudService from '../services/marketplaceItemFraud.service.js';

export const check = async (req, res) => {
  try {
    const result = await marketplaceItemFraudService.check(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default { check };
