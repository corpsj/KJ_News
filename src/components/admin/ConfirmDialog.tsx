"use client";

import { useEffect } from "react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "확인",
  cancelLabel = "취소",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <button
        type="button"
        className="fixed inset-0 bg-black/40 backdrop-blur-sm w-full cursor-default"
        aria-label="닫기"
        tabIndex={-1}
        onClick={onCancel}
      />
      <div
        className="relative z-[71] w-full max-w-sm mx-4 bg-white rounded-xl border border-gray-200 p-6 animate-fade-in"
        role="alertdialog"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <h2 id="confirm-dialog-title" className="text-[15px] font-semibold text-gray-900 mb-2">{title}</h2>
        <p id="confirm-dialog-message" className="text-[13px] text-gray-500 leading-relaxed mb-6">{message}</p>
        <div className="flex items-center justify-end gap-2">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className="admin-btn admin-btn-primary" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
