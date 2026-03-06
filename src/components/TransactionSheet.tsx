import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { BottomSheet } from './BottomSheet';
import { ImagePicker } from './ImagePicker';
import { saveImage } from '../imageStore';
import type { Transaction } from '../types';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface TransactionSheetProps {
  open: boolean;
  initialType?: 'in' | 'out';
  transaction?: Transaction | null;
  currencySymbol: string;
  onClose: () => void;
  onSave: (
    title: string,
    description: string,
    amount: number,
    type: 'in' | 'out',
    date: string,
    tags: string[],
    imageId?: string,
    removedImageId?: string,
  ) => void;
}

export function TransactionSheet({
  open, initialType = 'in', transaction, currencySymbol, onClose, onSave,
}: TransactionSheetProps) {
  const isEdit = !!transaction;

  const [type,        setType]        = useState<'in' | 'out'>(initialType);
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [amount,      setAmount]      = useState('');
  const [date,        setDate]        = useState(todayISO());
  const [tags,        setTags]        = useState<string[]>([]);
  const [tagInput,    setTagInput]    = useState('');

  // Image state
  const [pickedFile,      setPickedFile]      = useState<File | null>(null);
  const [previewUrl,      setPreviewUrl]      = useState<string | null>(null);
  const [existingImageId, setExistingImageId] = useState<string | undefined>(undefined);
  const removedImageIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    if (transaction) {
      setType(transaction.type);
      setTitle(transaction.title);
      setDescription(transaction.description);
      setAmount(String(transaction.amount));
      setDate(transaction.date ?? todayISO());
      setTags(transaction.tags ?? []);
      setExistingImageId(transaction.imageId);
    } else {
      setType(initialType);
      setTitle('');
      setDescription('');
      setAmount('');
      setDate(todayISO());
      setTags([]);
      setExistingImageId(undefined);
    }
    setTagInput('');
    setPickedFile(null);
    setPreviewUrl(null);
    removedImageIdRef.current = undefined;
  }, [open, transaction, initialType]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  function handlePick(file: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPickedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleRemove() {
    if (existingImageId && !pickedFile) removedImageIdRef.current = existingImageId;
    setExistingImageId(undefined);
    setPickedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag));
  }

  const accentColor = type === 'in' ? 'var(--green)' : 'var(--red)';
  const canSubmit   = title.trim() && amount && parseFloat(amount) > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!title.trim() || isNaN(parsed) || parsed <= 0) return;

    // Commit any pending tag input
    const finalTags = tagInput.trim()
      ? [...new Set([...tags, tagInput.trim().toLowerCase()])]
      : tags;

    let newImageId: string | undefined;
    if (pickedFile) {
      newImageId = uuidv4();
      await saveImage(newImageId, pickedFile);
    }

    onSave(
      title.trim(), description.trim(), parsed, type, date, finalTags,
      newImageId ?? existingImageId,
      removedImageIdRef.current,
    );
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <span className="sheet-title" style={{ borderBottomColor: accentColor, marginBottom: 0 }}>
          {isEdit ? 'Edit Transaction' : type === 'in' ? 'Cash In' : 'Cash Out'}
        </span>
        <div style={{ display: 'flex', borderRadius: 999, background: 'var(--input-bg)', padding: 3, gap: 2 }}>
          <ToggleBtn active={type === 'in'}  color="var(--green)" onClick={() => setType('in')}>In</ToggleBtn>
          <ToggleBtn active={type === 'out'} color="var(--red)"   onClick={() => setType('out')}>Out</ToggleBtn>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Title */}
        <div>
          <label className="field-label">Title</label>
          <input className="field-input" type="text" value={title}
            onChange={e => setTitle(e.target.value)} autoFocus />
        </div>

        {/* Amount */}
        <div>
          <label className="field-label">Amount</label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              fontSize: '0.9375rem', color: 'var(--muted)', pointerEvents: 'none',
            }}>{currencySymbol}</span>
            <input
              className="field-input"
              type="number" inputMode="decimal" min="0.01" step="0.01"
              value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0" style={{ paddingLeft: currencySymbol.length > 2 ? 48 : 40 }}
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="field-label">Date</label>
          <input
            className="field-input"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            max={todayISO()}
          />
        </div>

        {/* Description */}
        <div>
          <label className="field-label">
            Description{' '}
            <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '0.85rem' }}>(optional)</span>
          </label>
          <input className="field-input" type="text" value={description}
            onChange={e => setDescription(e.target.value)} />
        </div>

        {/* Tags */}
        <div>
          <label className="field-label">
            Tags{' '}
            <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '0.85rem' }}>(optional)</span>
          </label>
          {/* Existing tags */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: '0.75rem', fontWeight: 600,
                    background: 'var(--input-bg)', color: 'var(--text)',
                    borderRadius: 999, padding: '3px 10px',
                  }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer',
                      padding: 0, display: 'flex', color: 'var(--muted)' }}
                  >
                    <X size={11} strokeWidth={2.5} />
                  </button>
                </span>
              ))}
            </div>
          )}
          {/* Tag input */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="field-input"
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="Type and press Enter"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={addTag}
              style={{
                padding: '0 14px', borderRadius: 'var(--radius-input)',
                border: 'none', background: 'var(--input-bg)',
                color: 'var(--text)', fontWeight: 700, fontSize: '0.875rem',
                cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit',
              }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Image */}
        <ImagePicker
          existingImageId={existingImageId}
          previewUrl={previewUrl}
          onPick={handlePick}
          onRemove={handleRemove}
        />

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              flex: 1, padding: 15, borderRadius: 999, border: 'none',
              background: accentColor, color: '#fff',
              fontSize: '1rem', fontWeight: 700, fontFamily: 'inherit',
              cursor: 'pointer',
              opacity: canSubmit ? 1 : 0.45,
              transition: 'opacity 0.15s, transform 0.12s',
            }}
          >
            {isEdit ? 'Save' : 'Add'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}

function ToggleBtn({ active, color, onClick, children }: {
  active: boolean; color: string; onClick: () => void; children: string;
}) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '5px 14px', borderRadius: 999, border: 'none',
      fontSize: '0.8125rem', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
      background: active ? color : 'transparent',
      color: active ? '#fff' : 'var(--muted)',
      transition: 'background 0.15s, color 0.15s',
    }}>
      {children}
    </button>
  );
}
