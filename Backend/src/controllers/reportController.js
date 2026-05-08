import supabase from "../supabaseClient.js";

// 🔥 Helper: Flag content in original table
const flagContent = async (type, id, reason) => {
  let table = null;

  switch (type) {
    case "post": table = "posts"; break;
    case "comment": table = "comments"; break;
    case "message": table = "messages"; break;
    case "event": table = "events"; break;
    case "marketplace": table = "marketplace_items"; break;
    case "service": table = "services"; break;
    case "user": table = "users"; break;
    default: return;
  }

  await supabase
    .from(table)
    .update({
      is_flagged: true,
      flag_reason: reason,
      moderation_status: "pending"
    })
    .eq("id", id);
};

// ✅ Create Report
export const createReport = async (req, res) => {
  try {
    const {
      reporter_id,
      reported_item_id,
      reported_item_type,
      reason,
      description
    } = req.body;

    const { data, error } = await supabase
      .from("reports")
      .insert([{
        reporter_id,
        reported_item_id,
        reported_item_type,
        reason,
        description,
        status: "pending",
        timestamp: new Date()
      }])
      .select();

    if (error) throw error;

    // 🔥 Flag the actual content
    await flagContent(reported_item_type, reported_item_id, reason);

    res.status(201).json({
      message: "Report submitted successfully",
      data
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};