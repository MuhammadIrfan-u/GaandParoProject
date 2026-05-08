import * as postFraudService from '../services/postFraud.service.js';

export const check = async (req, res) => {
  try {
    const result = await postFraudService.check(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default { check };
