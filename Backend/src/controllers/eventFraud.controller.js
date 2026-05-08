import * as eventFraudService from '../services/eventFraud.service.js';

export const check = async (req, res) => {
  try {
    const result = await eventFraudService.check(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default { check };
