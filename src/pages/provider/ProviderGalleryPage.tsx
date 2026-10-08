import { useState, type FormEvent } from "react";
import { Images, Plus, Trash2 } from "lucide-react";
import { api, ApiError, uploadImage } from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { ImagePicker } from "../../components/domain/Provider";
import { Button } from "../../components/ui/Button";
import { Banner, CardSkeleton, EmptyState, ErrorState, PageHeader } from "../../components/ui/Display";
import { TextField } from "../../components/ui/Field";
import { Modal, useConfirm, useToast } from "../../components/ui/Overlay";
import { useResource } from "../../lib/useResource";

export function ProviderGalleryPage() {
  const { session } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const gallery = useResource(() => api.providerGallery(session!.sub), [session?.sub]);
  const [adding, setAdding] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const close = () => { setAdding(false); setFile(null); setCaption(""); setError(undefined); };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) { setError("Choose a photo to upload"); return; }
    setBusy(true); setError(undefined);
    try {
      const photo_key = await uploadImage(file, "GALLERY");
      await api.createGalleryItem({ photo_key, caption: caption.trim() });
      toast.success("Photo added to your gallery");
      close(); await gallery.reload();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "We couldn't add that photo. Try again.");
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!(await confirm({ title: "Remove this photo?", confirmLabel: "Remove photo", tone: "danger", message: "It will disappear from your public profile." }))) return;
    try { await api.deleteGalleryItem(id); toast.success("Photo removed"); }
    catch (caught) { toast.error(caught instanceof ApiError ? caught.message : "We couldn't remove that photo."); }
    await gallery.reload();
  };

  return (
    <>
      <PageHeader title="Work gallery" subtitle="Show customers examples of your completed work."
        actions={<Button icon={<Plus size={16} />} onClick={() => setAdding(true)}>Add photo</Button>} />
      {gallery.loading && !gallery.data ? <CardSkeleton rows={1} />
        : gallery.error ? <ErrorState error={gallery.error} onRetry={gallery.reload} title="We couldn't load your gallery" />
          : gallery.data!.length === 0 ? (
            <div className="card"><EmptyState icon={<Images size={24} />} title="Your gallery is empty"
              action={<Button onClick={() => setAdding(true)}>Add your first photo</Button>}>
              Photos of finished jobs help customers trust you. Add a caption to explain the work.
            </EmptyState></div>
          ) : (
            <div className="gallery-grid">
              {gallery.data!.map((item) => (
                <figure key={item.gallery_item_id} className="gallery-item" style={{ margin: 0 }}>
                  {item.photo_url && <img src={item.photo_url} alt={item.caption || "Completed work"} loading="lazy" />}
                  <Button className="remove" size="sm" variant="light" icon={<Trash2 size={14} />} aria-label="Remove photo" onClick={() => remove(item.gallery_item_id)} />
                  {item.caption && <figcaption>{item.caption}</figcaption>}
                </figure>
              ))}
            </div>
          )}
      <Modal open={adding} title="Add a photo" onClose={close}>
        <form onSubmit={submit} noValidate>
          <div className="modal-body form stack">
            {error && <Banner tone="danger">{error}</Banner>}
            <ImagePicker label="Photo" optional={false} file={file} onChange={setFile} />
            <TextField label="Caption" optional maxLength={200} value={caption} onChange={(e) => setCaption(e.target.value)} />
          </div>
          <div className="modal-foot"><Button variant="ghost" onClick={close}>Cancel</Button><Button type="submit" loading={busy}>Upload photo</Button></div>
        </form>
      </Modal>
    </>
  );
}
