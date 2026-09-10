// Thin wrapper around the Clipboard API so the write+error-handling logic
// isn't duplicated at every call site that offers a "copy for WhatsApp" button.
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}
