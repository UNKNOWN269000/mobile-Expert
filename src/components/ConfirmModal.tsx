import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;

  const isDanger = variant === 'danger';
  const confirmBtnClass = isDanger
    ? 'bg-rose-500 hover:bg-rose-600 dark:bg-rose-500 dark:hover:bg-rose-400'
    : 'bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400';

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
      >
        <div className="px-6 pt-6 pb-2 text-center">
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
              isDanger
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{message}</p>
        </div>

        <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50 sm:gap-3 sm:px-6 sm:py-4">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold text-white transition ${confirmBtnClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
