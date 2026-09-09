// Shared allowlists for Yahrzeit fields, used by both the server action
// (validation) and the client form (dropdown options) so they can't drift.

export const HEBREW_MONTHS = [
    "תשרי", "מרחשוון", "כסלו", "טבת", "שבט", "אדר", "אדר א'", "אדר ב'",
    "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול",
] as const;

export const YAHRZEIT_RELATIONS = [
    { value: "father", label: "אב" },
    { value: "mother", label: "אם" },
    { value: "brother", label: "אח" },
    { value: "sister", label: "אחות" },
    { value: "spouse", label: "בן/בת זוג" },
    { value: "child", label: "בן/בת" },
    { value: "other", label: "אחר" },
] as const;
