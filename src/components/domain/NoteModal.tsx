import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "../ui/Button";
import { Banner } from "../ui/Display";
import { TextAreaField } from "../ui/Field";
import { Modal } from "../ui/Overlay";

/** Admin decision dialog: collects the required note/reason the backend demands. */
export function NoteModal({ open, title, intro, label, confirmLabel, tone = "primary", initialNote = "", onClose, onSubmit }: {
  open: boolean; title: string; intro?: ReactNode; label: string; confirmLabel: string; tone?: "primary" | "danger";
  initialNote?: string; onClose: () => void; onSubmit: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState(initialNote);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [seeded, setSeeded] = useState(false);
  if (open && !seeded) { setSeeded(true); setNote(initialNote); setError(undefined); }
  if (!open && seeded) setSeeded(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!note.trim()) { setError("Add a note before continuing"); return; }
    setBusy(true); setError(undefined);
    try { await onSubmit(note.trim()); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "That didn't work. Try again."); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="modal-body form stack">
          {intro}
          {error && !note.trim() ? null : error && <Banner tone="danger">{error}</Banner>}
          <TextAreaField label={label} value={note} error={error && !note.trim() ? error : undefined} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="modal-foot">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant={tone === "danger" ? "danger" : "primary"} loading={busy}>{confirmLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}
