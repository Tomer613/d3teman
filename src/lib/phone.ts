// Converts a local Israeli phone number (e.g. "050-1234567") into the
// international format wa.me links require (e.g. "9725012345677").
export function toWhatsAppNumber(phone: string): string {
    const digitsOnly = phone.replace(/\D/g, "");
    return digitsOnly.startsWith("0") ? `972${digitsOnly.slice(1)}` : digitsOnly;
}
