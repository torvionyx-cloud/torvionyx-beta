// @ts-nocheck

"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
      title="Save as PDF — use your browser's 'Save as PDF' destination"
    >
      ↓ Save as PDF
    </button>
  );
}
