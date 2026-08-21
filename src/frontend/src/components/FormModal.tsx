import { useId, type ReactNode } from "react";
import { X } from "lucide-react";

type FormModalProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export function FormModal({ title, children, onClose }: FormModalProps) {
  const titleId = useId();

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/65 p-4 backdrop-blur-md">
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="glass-panel grid max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-lg"
        role="dialog"
      >
        <div className="flex items-center justify-between gap-3 border-b border-sky-200/10 px-4 py-3">
          <h3 className="font-semibold" id={titleId}>{title}</h3>
          <button
            className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-muted hover:text-foreground"
            title="Đóng"
            type="button"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
