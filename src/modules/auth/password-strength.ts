// Pure, dependency-free password policy + strength scoring.
// Safe to import from both server actions and client components (no i18n, no IO).

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_STRONG_LENGTH = 12;

export type PasswordStrength = "weak" | "medium" | "strong";

export type PasswordPolicyCode = "min" | "lettersNumbers" | "common" | "weak";

export type PasswordChecks = {
  length: boolean;
  lower: boolean;
  upper: boolean;
  number: boolean;
  symbol: boolean;
};

// A small list of the most common / trivially-guessable passwords (FR + EN). Lowercased.
const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "passw0rd",
  "motdepasse",
  "azerty",
  "azertyuiop",
  "qwerty",
  "qwertyuiop",
  "123456",
  "1234567",
  "12345678",
  "123456789",
  "1234567890",
  "12345678910",
  "00000000",
  "11111111",
  "abc12345",
  "abcd1234",
  "iloveyou",
  "admin123",
  "welcome1",
  "soleil123",
  "solospeaker"
]);

const hasLower = (value: string) => /[a-z]/.test(value);
const hasUpper = (value: string) => /[A-Z]/.test(value);
const hasNumber = (value: string) => /\d/.test(value);
const hasSymbol = (value: string) => /[^a-zA-Z0-9]/.test(value);
const hasLetter = (value: string) => /[a-zA-Z]/.test(value);

function isRepeatedOrSequential(value: string) {
  const lower = value.toLowerCase();
  if (/^(.)\1+$/.test(lower)) return true; // all the same character
  if (/^(?:0123456789|abcdefghijklmnopqrstuvwxyz).*$/.test(lower)) return true;
  return false;
}

function emailLocalPart(email: string | undefined) {
  if (!email) return "";
  return email.split("@")[0]?.toLowerCase().trim() ?? "";
}

export function isWeakOrCommon(password: string, email?: string) {
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) return true;
  if (isRepeatedOrSequential(password)) return true;
  const local = emailLocalPart(email);
  if (local.length >= 3 && lower.includes(local)) return true;
  return false;
}

export function getPasswordChecks(password: string): PasswordChecks {
  return {
    length: password.length >= PASSWORD_MIN_LENGTH,
    lower: hasLower(password),
    upper: hasUpper(password),
    number: hasNumber(password),
    symbol: hasSymbol(password)
  };
}

// Returns a score of 0..4 and a coarse strength label used by the live meter.
export function scorePassword(password: string, email?: string): { score: number; strength: PasswordStrength } {
  if (!password) return { score: 0, strength: "weak" };
  if (isWeakOrCommon(password, email)) return { score: 1, strength: "weak" };

  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score += 1;
  if (password.length >= PASSWORD_STRONG_LENGTH) score += 1;
  if (hasLower(password) && hasUpper(password)) score += 1;
  if (hasNumber(password)) score += 1;
  if (hasSymbol(password)) score += 1;

  const clamped = Math.min(score, 4);
  const strength: PasswordStrength = clamped <= 2 ? "weak" : clamped === 3 ? "medium" : "strong";
  return { score: clamped, strength };
}

// Hard gate used by both the server action and the client submit guard.
// Returns the first failing rule, or null when the password is acceptable.
export function getPasswordPolicyError(password: string, email?: string): PasswordPolicyCode | null {
  if (password.length < PASSWORD_MIN_LENGTH) return "min";
  if (!hasLetter(password) || !hasNumber(password)) return "lettersNumbers";
  if (isWeakOrCommon(password, email)) return "common";
  if (scorePassword(password, email).strength === "weak") return "weak";
  return null;
}
