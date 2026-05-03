// ─── Shared validation utilities ─────────────────────────────────────────────

// Password: min 8 chars, at least 1 letter and 1 number
export const validatePassword = (password: string): string | null => {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[a-zA-Z]/.test(password)) return "Password must contain at least one letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  return null;
};

// Password strength: 0-3
export const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak",   color: "bg-red-500" };
  if (score === 2) return { score, label: "Fair",   color: "bg-orange-400" };
  if (score === 3) return { score, label: "Good",   color: "bg-yellow-400" };
  return             { score, label: "Strong", color: "bg-green-500" };
};

// Phone: must start with +, followed by 7-14 digits (E.164 basic check)
export const validatePhone = (phone: string): string | null => {
  if (!phone) return null; // phone is optional
  const cleaned = phone.replace(/[\s\-().]/g, "");
  if (!/^\+[1-9]\d{6,14}$/.test(cleaned)) {
    return "Enter a valid phone number with country code (e.g. +92 300 1234567)";
  }
  return null;
};
