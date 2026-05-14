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
      description,
      neighborhood_id
    } = req.body;

    // 🔥 Find the reported user (owner of the item)
    let reported_user_id = null;
    if (reported_item_type === 'user') {
      reported_user_id = reported_item_id;
    } else {
      let table = null;
      let field = 'author_id'; // default for posts, comments, messages

      switch (reported_item_type) {
        case 'post': table = 'posts'; break;
        case 'comment': table = 'comments'; break;
        case 'message': table = 'messages'; field = 'sender_id'; break;
        case 'event': table = 'events'; field = 'organizer_id'; break;
        case 'marketplace': table = 'marketplace_items'; field = 'seller_id'; break;
        case 'service': table = 'services'; field = 'provider_id'; break;
      }

      if (table) {
        const { data } = await supabase.from(table).select(field).eq('id', reported_item_id).maybeSingle();
        if (data) reported_user_id = data[field];
      }
    }

    const { data, error } = await supabase
      .from("reports")
      .insert([{
        reporter_id,
        reported_item_id,
        reported_item_type,
        reason,
        description,
        neighborhood_id,
        reported_user_id,
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