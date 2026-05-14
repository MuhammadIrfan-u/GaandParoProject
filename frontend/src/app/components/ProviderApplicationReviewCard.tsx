import { Mail, Calendar, Shield, Briefcase, FileText } from "lucide-react";
import { Button } from "./ui/button";

/** Raw row from admin dashboard API (Supabase shape + joined users) or legacy mock shape */
export type ProviderApplicationRow = {
  id: string | number;
  fullName?: string;
  userId?: string;
  user_id?: number;
  category?: string;
  experience?: string;
  description?: string;
  status?: string;
  submittedDate?: string;
  created_at?: string;
  rejection_reason?: string;
  neighborhood_id?: number;
  users?: {
    id?: number;
    name?: string;
    email?: string | null;
    verified?: boolean;
    avatar?: string | null;
  } | null;
};

function formatDate(value: string | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function normalizeRow(app: ProviderApplicationRow) {
  const u = app.users;
  const displayName =
    app.fullName ||
    u?.name ||
    (app.user_id != null ? `User #${app.user_id}` : app.userId ? `User #${app.userId}` : "Unknown applicant");
  const email = u?.email?.trim() || "—";
  const submitted = app.submittedDate || app.created_at;
  return { displayName, email, submitted, u };
}

type Props = {
  app: ProviderApplicationRow;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
};

export function ProviderApplicationReviewCard({ app, onApprove, onReject }: Props) {
  const { displayName, email, submitted, u } = normalizeRow(app);
  const idStr = String(app.id);
  const status = (app.status || "pending").toLowerCase();
  const isPending = status === "pending";

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden max-w-3xl w-full mx-auto">
      <div className="p-5 sm:p-6 border-b bg-muted/30 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold tracking-tight truncate">{displayName}</h3>
            {u?.verified ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                <Shield className="w-3 h-3" /> Verified
              </span>
            ) : null}
          </div>
          <p className="text-sm font-medium text-primary">{app.category || "—"}</p>
        </div>
        <span
          className={`shrink-0 uppercase text-xs font-bold py-1.5 px-3 rounded-full ${
            status === "approved"
              ? "bg-green-100 text-green-800"
              : status === "rejected"
                ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-900"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div className="flex gap-3 min-w-0">
            <Mail className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email</dt>
              <dd className="font-medium break-all">{email}</dd>
            </div>
          </div>
          <div className="flex gap-3 min-w-0">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Submitted</dt>
              <dd>{formatDate(submitted)}</dd>
            </div>
          </div>
        </dl>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Briefcase className="w-4 h-4" />
            Experience
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap rounded-xl bg-muted/40 border px-4 py-3">
            {app.experience?.trim() || "—"}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <FileText className="w-4 h-4" />
            Description
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap rounded-xl bg-muted/40 border px-4 py-3 min-h-[4rem]">
            {app.description?.trim() || "—"}
          </p>
        </div>

        {status === "rejected" && app.rejection_reason ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            <span className="font-semibold">Rejection reason: </span>
            {app.rejection_reason}
          </div>
        ) : null}

        {isPending ? (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => onApprove(idStr)}>
              Approve
            </Button>
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => onReject(idStr)}>
              Reject
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
