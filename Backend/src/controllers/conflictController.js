import supabase from "../supabaseClient.js";

export const createCase = async (req, res) => {
  try {
    const { report_id, user_1, user_2, description } = req.body;

    const { data, error } = await supabase
      .from("conflict_cases")
      .insert([{
        report_id,
        user_1,
        user_2,
        description,
        status: "open",
        created_at: new Date()
      }])
      .select();

    if (error) throw error;

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};