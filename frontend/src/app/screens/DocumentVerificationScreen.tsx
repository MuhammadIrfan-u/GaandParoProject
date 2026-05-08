import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
    ArrowLeft,
    Upload,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    ImageIcon,
    Loader2,
    ShieldCheck,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type VerificationStatus = "none" | "pending" | "approved" | "rejected";

interface StatusData {
    status: VerificationStatus;
    submittedAt?: string;
    reviewedAt?: string;
    reviewNotes?: string;
    ocrName?: string;
    ocrAddress?: string;
}

interface Signals {
    ocrConfidence: number;
    nameMatch: number;
    addrMatch: number;
    finalScore: number;
}

interface Neighborhood {
    id: number;
    name: string;
}

type UploadStep = "idle" | "uploading" | "processing" | "done" | "error";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = "http://localhost:3000";

const getAuthToken = () => localStorage.getItem("auth_token");

const apiFetch = async (path: string, init?: RequestInit) => {
    const token = getAuthToken();
    return fetch(`${API_BASE}${path}`, {
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        },
        ...init,
    });
};

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ label, value }: { label: string; value: number }) {
    const pct = Math.round(value * 100);
    const color = pct >= 85 ? "bg-green-500" : pct >= 65 ? "bg-yellow-400" : "bg-red-400";
    return (
        <div className="space-y-0.5">
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{label}</span>
                <span>{pct}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

// ─── Status Banner ────────────────────────────────────────────────────────────

function StatusBanner({ statusData }: { statusData: StatusData }) {
    const { status, submittedAt, reviewedAt, reviewNotes } = statusData;

    if (status === "none") return null;

    const configs = {
        pending: {
            bg: "bg-yellow-50 border-yellow-300",
            icon: <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0" />,
            title: "Under Review",
            message: "Your document is under review. We'll notify you once an admin approves.",
            badge: "bg-yellow-100 text-yellow-800",
            badgeText: "Pending",
        },
        approved: {
            bg: "bg-green-50 border-green-400",
            icon: <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />,
            title: "Verified!",
            message: "Your residence has been verified. You now have full community access.",
            badge: "bg-green-100 text-green-800",
            badgeText: "Approved",
        },
        rejected: {
            bg: "bg-red-50 border-red-300",
            icon: <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />,
            title: "Verification Rejected",
            message: reviewNotes || "Your document could not be verified. Please re-upload a clearer image.",
            badge: "bg-red-100 text-red-800",
            badgeText: "Rejected",
        },
    };

    const cfg = configs[status];

    return (
        <div className={`rounded-2xl border-2 p-4 mb-6 ${cfg.bg}`}>
            <div className="flex items-start gap-3">
                {cfg.icon}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{cfg.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.badgeText}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{cfg.message}</p>
                    {submittedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Submitted: {new Date(submittedAt).toLocaleDateString()}
                        </p>
                    )}
                    {reviewedAt && (
                        <p className="text-xs text-muted-foreground">
                            Reviewed: {new Date(reviewedAt).toLocaleDateString()}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Upload Progress Steps ────────────────────────────────────────────────────

function UploadProgress({ step }: { step: UploadStep }) {
    const steps = [
        { key: "uploading", label: "Uploading document" },
        { key: "processing", label: "Running OCR" },
        { key: "done", label: "Submitted" },
    ] as const;

    const stepIndex = steps.findIndex((s) => s.key === step);

    return (
        <div className="flex items-center gap-2 my-4">
            {steps.map((s, i) => {
                const done = stepIndex > i || step === "done";
                const active = stepIndex === i && step !== "done";
                return (
                    <div key={s.key} className="flex items-center gap-2 flex-1">
                        <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${done
                                    ? "bg-green-500 text-white"
                                    : active
                                        ? "bg-primary text-white"
                                        : "bg-muted text-muted-foreground"
                                }`}
                        >
                            {done ? <CheckCircle className="w-4 h-4" /> : active ? <Loader2 className="w-3 h-3 animate-spin" /> : i + 1}
                        </div>
                        <span className={`text-xs ${active ? "text-primary font-medium" : done ? "text-green-600" : "text-muted-foreground"}`}>
                            {s.label}
                        </span>
                        {i < steps.length - 1 && <div className={`flex-1 h-px ${done ? "bg-green-400" : "bg-muted"}`} />}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DocumentVerificationScreen() {
    const navigate = useNavigate();

    const [statusData, setStatusData] = useState<StatusData>({ status: "none" });
    const [loadingStatus, setLoadingStatus] = useState(true);

    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string>("");

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const [uploadStep, setUploadStep] = useState<UploadStep>("idle");
    const [extractedName, setExtractedName] = useState<string | null>(null);
    const [extractedAddress, setExtractedAddress] = useState<string | null>(null);
    const [nameMatchScore, setNameMatchScore] = useState<number | null>(null);
    const [registeredName, setRegisteredName] = useState<string | null>(null);
    const [signals, setSignals] = useState<Signals | null>(null);
    const [autoDecided, setAutoDecided] = useState(false);
    const [reviewNote, setReviewNote] = useState<string | null>(null);
    const [rawOcrText, setRawOcrText] = useState<string | null>(null);
    const [showRawOcr, setShowRawOcr] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Fetch current status ──────────────────────────────────────────────────
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await apiFetch("/api/verifications/my-status");
                if (res.ok) {
                    const data = await res.json();
                    setStatusData(data);
                }
            } catch {
                // silently fail — user may not be logged in yet
            } finally {
                setLoadingStatus(false);
            }
        };
        fetchStatus();
    }, []);

    // ── Fetch neighborhoods for dropdown ─────────────────────────────────────
    useEffect(() => {
        const fetchNeighborhoods = async () => {
            try {
                const res = await fetch(`${API_BASE}/neighborhoods`);
                if (res.ok) {
                    const data = await res.json();
                    setNeighborhoods(Array.isArray(data) ? data : []);
                }
            } catch {
                // non-critical
            }
        };
        fetchNeighborhoods();
    }, []);

    // ── File selection ────────────────────────────────────────────────────────
    const handleFileSelect = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file (JPEG, PNG, etc.)");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File is too large. Maximum size is 5 MB.");
            return;
        }
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setUploadStep("idle");
        setExtractedName(null);
        setExtractedAddress(null);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    };

    // ── Upload & OCR ──────────────────────────────────────────────────────────
    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error("Please select a document image first.");
            return;
        }

        const token = getAuthToken();
        if (!token) {
            toast.error("You must be logged in to submit a verification.");
            navigate("/login");
            return;
        }

        setUploadStep("uploading");

        const formData = new FormData();
        formData.append("document", selectedFile);
        if (selectedNeighborhoodId) {
            formData.append("neighborhoodId", selectedNeighborhoodId);
        }

        try {
            setUploadStep("processing");

            const res = await fetch(`${API_BASE}/api/verifications/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Upload failed");
            }

            setUploadStep("done");
            setExtractedName(data.extractedName);
            setExtractedAddress(data.extractedAddress);
            setNameMatchScore(data.signals?.nameMatch ?? null);
            setRegisteredName(data.registeredName ?? null);
            setSignals(data.signals ?? null);
            setAutoDecided(data.autoDecided ?? false);
            setReviewNote(data.reviewNote ?? null);
            setRawOcrText(data._debug?.rawOcrText ?? null);

            // Log full debug to browser console too
            console.group('%c[OCR Debug]', 'color: #7c3aed; font-weight: bold');
            console.log('Raw OCR text:\n', data._debug?.rawOcrText);
            console.log('Word count:', data._debug?.wordCount);
            console.log('OCR confidence:', data._debug?.ocrConfidence + '%');
            console.log('Signals:', data.signals);
            console.log('Decision:', data.status, data.autoDecided ? '(auto)' : '(queued)');
            console.groupEnd();

            // Update status based on actual decision from backend
            const decidedStatus = data.status as "approved" | "pending" | "rejected";
            setStatusData({ status: decidedStatus, submittedAt: new Date().toISOString(), reviewNotes: data.reviewNote ?? undefined });

            if (data.status === "approved") {
                toast.success("✅ Automatically verified! You've been added to the neighbourhood.");
            } else if (data.status === "rejected") {
                toast.error("Document could not be verified automatically. Please re-upload a clearer image.");
            } else {
                toast.success("Document submitted — an admin will review it shortly.");
            }
        } catch (err: unknown) {
            setUploadStep("error");
            const message = err instanceof Error ? err.message : "Upload failed";
            toast.error(message);
        }
    };

    // ── Derived ───────────────────────────────────────────────────────────────
    // Allow re-upload if: never submitted, rejected, or just got auto-rejected this session
    const canUpload = statusData.status === "none" || statusData.status === "rejected";

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="bg-white border-b border-border sticky top-0 z-40">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full" aria-label="Go back">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                        <h1 className="text-xl">Verify Residence</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
                {/* Info banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">How it works</p>
                        <p>
                            Upload a photo of your government-issued ID or utility bill. Our system will extract your name and
                            address automatically. An admin will review and approve within 24–48 hours.
                        </p>
                    </div>
                </div>

                {/* Status banner */}
                {loadingStatus ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking verification status…
                    </div>
                ) : (
                    <StatusBanner statusData={statusData} />
                )}

                {/* Upload section */}
                {canUpload && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-medium">
                            {statusData.status === "rejected" ? "Re-upload Document" : "Upload Document"}
                        </h2>

                        {/* Drag-and-drop zone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${isDragging
                                    ? "border-primary bg-primary/5"
                                    : previewUrl
                                        ? "border-green-400 bg-green-50/30"
                                        : "border-border hover:border-primary/50 hover:bg-muted/30"
                                }`}
                            role="button"
                            aria-label="Upload document image"
                        >
                            {previewUrl ? (
                                <div className="space-y-3">
                                    <img
                                        src={previewUrl}
                                        alt="Document preview"
                                        className="max-h-48 mx-auto rounded-xl object-contain shadow"
                                    />
                                    <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                                    <p className="text-xs text-primary">Click to change image</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/50" />
                                    <div>
                                        <p className="font-medium">Drop your document here</p>
                                        <p className="text-sm text-muted-foreground">or click to browse</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">JPEG, PNG — max 5 MB</p>
                                </div>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleInputChange}
                            aria-label="Select document image"
                        />

                        {/* Neighborhood selector */}
                        {neighborhoods.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium mb-1" htmlFor="neighborhood-select">
                                    Applying for neighbourhood (optional)
                                </label>
                                <select
                                    id="neighborhood-select"
                                    value={selectedNeighborhoodId}
                                    onChange={(e) => setSelectedNeighborhoodId(e.target.value)}
                                    className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="">— Select a neighbourhood —</option>
                                    {neighborhoods.map((n) => (
                                        <option key={n.id} value={n.id}>
                                            {n.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Progress indicator */}
                        {uploadStep !== "idle" && <UploadProgress step={uploadStep} />}

                        {/* Upload button */}
                        <Button
                            onClick={handleUpload}
                            disabled={!selectedFile || uploadStep === "uploading" || uploadStep === "processing" || uploadStep === "done"}
                            className="w-full"
                        >
                            {uploadStep === "uploading" || uploadStep === "processing" ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {uploadStep === "uploading" ? "Uploading…" : "Processing OCR…"}
                                </>
                            ) : uploadStep === "done" ? (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Submitted
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload &amp; Verify
                                </>
                            )}
                        </Button>

                        {/* OCR result confirmation */}
                        {uploadStep === "done" && (
                            <div className="bg-muted/40 rounded-2xl p-4 space-y-4">
                                {/* Auto-decision banner */}
                                {autoDecided && (
                                    <div className={`rounded-xl p-3 flex items-start gap-2 text-sm ${statusData.status === "approved"
                                            ? "bg-green-50 border border-green-300 text-green-800"
                                            : "bg-red-50 border border-red-300 text-red-800"
                                        }`}>
                                        {statusData.status === "approved"
                                            ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                            : <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                                        <span>{reviewNote}</span>
                                    </div>
                                )}

                                {/* Extracted fields */}
                                {(extractedName || extractedAddress) && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5" /> Extracted from document
                                        </p>
                                        {extractedName && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5">Name on document</p>
                                                <p className="text-sm font-medium">{extractedName}</p>
                                                {nameMatchScore !== null && registeredName && (
                                                    <div className="mt-1 flex items-center gap-1.5">
                                                        {nameMatchScore >= 0.7 ? (
                                                            <><CheckCircle className="w-3.5 h-3.5 text-green-500" /><span className="text-xs text-green-600">Matches registered name</span></>
                                                        ) : (
                                                            <><AlertTriangle className="w-3.5 h-3.5 text-yellow-500" /><span className="text-xs text-yellow-600">Partial match with "{registeredName}"</span></>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {extractedAddress && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5">Address on document</p>
                                                <p className="text-sm font-medium">{extractedAddress}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Score breakdown */}
                                {signals && (
                                    <div className="space-y-2 pt-1 border-t border-border">
                                        <p className="text-xs font-medium text-muted-foreground">Verification score breakdown</p>
                                        <ScoreBar label="OCR quality" value={signals.ocrConfidence} />
                                        <ScoreBar label="Name match" value={signals.nameMatch} />
                                        <ScoreBar label="Address match" value={signals.addrMatch} />
                                        <div className="pt-1 border-t border-border">
                                            <ScoreBar label="Overall score" value={signals.finalScore} />
                                        </div>
                                    </div>
                                )}

                                {!extractedName && !extractedAddress && !autoDecided && (
                                    <p className="text-sm text-muted-foreground">
                                        Could not extract structured fields — an admin will review the raw document.
                                    </p>
                                )}

                                {/* Raw OCR debug panel */}
                                {rawOcrText && (
                                    <div className="pt-1 border-t border-border">
                                        <button
                                            onClick={() => setShowRawOcr((p) => !p)}
                                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                                        >
                                            {showRawOcr
                                                ? <ChevronUp className="w-3.5 h-3.5" />
                                                : <ChevronDown className="w-3.5 h-3.5" />}
                                            {showRawOcr ? "Hide" : "Show"} raw OCR text
                                            <span className="ml-auto text-muted-foreground/60">
                                                {signals ? `${(signals.ocrConfidence * 100).toFixed(0)}% confidence` : ""}
                                            </span>
                                        </button>
                                        {showRawOcr && (
                                            <pre className="mt-2 text-xs bg-muted/60 rounded-xl p-3 whitespace-pre-wrap break-words max-h-48 overflow-y-auto font-mono leading-relaxed">
                                                {rawOcrText || "(empty — no text detected)"}
                                            </pre>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {uploadStep === "error" && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700">
                                <XCircle className="w-4 h-4 flex-shrink-0" />
                                Upload failed. Please try again.
                            </div>
                        )}
                    </div>
                )}

                {/* Pending state message */}
                {statusData.status === "pending" && uploadStep !== "done" && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 text-center space-y-2">
                        <Clock className="w-10 h-10 text-yellow-500 mx-auto" />
                        <p className="font-medium">Your document is under review</p>
                        <p className="text-sm text-muted-foreground">
                            We'll notify you once an admin approves your verification. This typically takes 24–48 hours.
                        </p>
                    </div>
                )}

                {/* Approved state */}
                {statusData.status === "approved" && (
                    <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-6 text-center space-y-3">
                        <div className="bg-green-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                            <ShieldCheck className="w-9 h-9 text-white" />
                        </div>
                        <p className="text-xl font-medium">Residence Verified</p>
                        <p className="text-sm text-muted-foreground">
                            You have full access to your neighbourhood community.
                        </p>
                        <Button onClick={() => navigate("/home")} className="mt-2">
                            Go to Home
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}