import { useState, useEffect } from 'react';
import { BottomSheet } from './BottomSheet';
import type { Book } from '../types';

interface BookSheetProps {
  open: boolean;
  /** Pass a book to edit it; omit (or pass null) to add a new one */
  book?: Book | null;
  onClose: () => void;
  onSave: (title: string, description: string) => void;
}

export function BookSheet({ open, book, onClose, onSave }: BookSheetProps) {
  const isEdit = !!book;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Sync fields whenever the sheet opens or the target book changes
  useEffect(() => {
    if (open) {
      setTitle(book?.title ?? '');
      setDescription(book?.description ?? '');
    }
  }, [open, book]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title.trim(), description.trim());
    onClose();
  }

  function handleClose() {
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={handleClose}>
      <span className="sheet-title">{isEdit ? 'Edit Book' : 'Add Book'}</span>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="field-label">Title</label>
          <input
            className="field-input"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="field-label">Description</label>
          <textarea
            className="field-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            style={{ resize: 'none' }}
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={!title.trim()}
          style={{ marginTop: 4 }}
        >
          {isEdit ? 'Save' : 'Add'}
        </button>
      </form>
    </BottomSheet>
  );
}
