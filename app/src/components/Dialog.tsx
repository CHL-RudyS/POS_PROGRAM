import { useEffect, type ReactNode } from "react";

export function Dialog({ title, onClose, actions, children }: {
  title: string; onClose: () => void; actions: ReactNode; children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title}>
        <div className="dialog-title">{title}</div>
        <div className="dialog-body stack-3">{children}</div>
        <div className="dialog-actions">{actions}</div>
      </div>
    </div>
  );
}
