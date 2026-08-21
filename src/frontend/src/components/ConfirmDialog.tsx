import { AlertTriangle, X } from "lucide-react";

type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
};

export function ConfirmDialog({
  cancelLabel = "Hủy",
  confirmLabel = "Xác nhận",
  description,
  loading = false,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-md">
      <div className="glass-panel w-full max-w-lg overflow-hidden rounded-lg text-foreground shadow-2xl shadow-black/45">
        <div className="flex items-start justify-between gap-4 border-b border-sky-200/10 px-5 py-4">
          <div className="flex min-w-0 gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-md border border-red-400/35 bg-red-400/10 text-red-200">
              <AlertTriangle className="size-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          <button
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
            disabled={loading}
            title="Đóng"
            type="button"
            onClick={onCancel}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-3 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            className="inline-flex h-10 items-center justify-center rounded-md border border-sky-200/20 bg-white/[0.03] px-4 text-sm font-medium text-foreground transition hover:bg-white/10 disabled:opacity-60"
            disabled={loading}
            type="button"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className="inline-flex h-10 items-center justify-center rounded-md border border-red-400/40 bg-red-500/15 px-4 text-sm font-semibold text-red-100 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            type="button"
            onClick={onConfirm}
          >
            {loading ? "Đang xử lý" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
