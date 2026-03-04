import { useRef, useEffect, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { loadImage } from '../imageStore';

interface ImagePickerProps {
  /** imageId already saved in IndexedDB (edit mode) */
  existingImageId?: string;
  /** Called with the selected File when user picks a new image */
  onPick: (file: File) => void;
  /** Called when user removes the image */
  onRemove: () => void;
  /** Local object-URL preview for a freshly picked (not-yet-saved) file */
  previewUrl: string | null;
}

export function ImagePicker({ existingImageId, onPick, onRemove, previewUrl }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [existingUrl, setExistingUrl] = useState<string | null>(null);

  // Load existing image from IndexedDB when in edit mode
  useEffect(() => {
    let objectUrl: string | null = null;
    if (existingImageId && !previewUrl) {
      loadImage(existingImageId).then(url => {
        objectUrl = url;
        setExistingUrl(url);
      });
    } else {
      setExistingUrl(null);
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [existingImageId, previewUrl]);

  const displayUrl = previewUrl ?? existingUrl;
  const hasImage   = !!displayUrl;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onPick(file);
    // Reset the input so the same file can be re-selected after removal
    e.target.value = '';
  }

  return (
    <div>
      <label className="field-label">
        Image{' '}
        <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '0.85rem' }}>(optional)</span>
      </label>

      {hasImage ? (
        /* ── Preview ── */
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={displayUrl!}
            alt="Transaction attachment"
            style={{
              width: '100%', maxHeight: 180, objectFit: 'cover',
              borderRadius: 12, display: 'block',
            }}
          />
          {/* Remove button */}
          <button
            type="button"
            onClick={onRemove}
            style={{
              position: 'absolute', top: 8, right: 8,
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(0,0,0,0.55)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff',
            }}
            aria-label="Remove image"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        /* ── Pick button ── */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            width: '100%', padding: '14px', borderRadius: 12,
            border: '2px dashed var(--divider)',
            background: 'var(--input-bg)', cursor: 'pointer',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 6,
            color: 'var(--muted)',
          }}
        >
          <ImagePlus size={22} strokeWidth={1.75} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Tap to attach an image</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}
