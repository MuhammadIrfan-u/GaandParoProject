import supabase from "../supabaseClient.js";

export const createAppeal = async (req, res) => {
  try {
    const { user_id, report_id, reason } = req.body;

    const { data, error } = await supabase
      .from("appeals")
      .insert([{
        user_id,
        report_id,
        reason,
        status: "pending",
        created_at: new Date()
      }])
      .select();

    if (error) throw error;

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};