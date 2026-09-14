"use client";

export default function PrintButton() {
    return (
        <button
            type="button"
            onClick={() => window.print()}
            className="print:hidden px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
        >
            הדפסה / שמירה כ-PDF
        </button>
    );
}
