import { ReactNode, useEffect, useRef } from "react";
export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog ref={ref} className="modal" onCancel={onClose} aria-label={title}>
      <div className="row">
        <h2>{title}</h2>
        <button aria-label="Close dialog" onClick={onClose}>
          ✕
        </button>
      </div>
      {children}
    </dialog>
  );
}
