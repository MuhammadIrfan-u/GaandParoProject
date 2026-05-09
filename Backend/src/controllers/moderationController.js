import supabase from "../supabaseClient.js";

// ✅ Get moderation queue
export const getQueue = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("status", "pending")
      .order("timestamp", { ascending: false });

    if (error) throw error;

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Take moderation action
export const takeAction = async (req, res) => {
  try {
    const { report_id, action } = req.body;

    // 1. Get report
    const { data: report, error: fetchError } = await supabase
      .from("reports")
      .select("*")
      .eq("id", report_id)
      .single();

    if (fetchError) throw fetchError;

    const { reported_item_id, reported_item_type } = report;

    // 2. Map to table
    let table = null;
    switch (reported_item_type) {
      case "post": table = "posts"; break;
      case "comment": table = "comments"; break;
      case "message": table = "messages"; break;
      case "event": table = "events"; break;
      case "marketplace": table = "marketplace_items"; break;
      case "service": table = "services"; break;
      case "user": table = "users"; break;
    }

    // 3. Apply moderation to original content
    if (table) {
      let updateData = {};

      if (action === "remove") {
        updateData.moderation_status = "removed";
      } else if (action === "hide") {
        updateData.moderation_status = "hidden";
      } else if (action === "approve") {
        updateData.moderation_status = "approved";
        updateData.is_flagged = false;
      }

      await supabase
        .from(table)
        .update(updateData)
        .eq("id", reported_item_id);
    }

    // 4. Mark report resolved
    await supabase
      .from("reports")
      .update({ status: "resolved" })
      .eq("id", report_id);

    res.json({ message: "Moderation action applied successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};