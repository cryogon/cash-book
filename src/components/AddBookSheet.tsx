import { useState } from 'react';
import { BottomSheet } from './BottomSheet';

interface AddBookSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (title: string, description: string) => void;
}

export function AddBookSheet({ open, onClose, onAdd }: AddBookSheetProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), description.trim());
    setTitle('');
    setDescription('');
    onClose();
  }

  function handleClose() {
    setTitle('');
    setDescription('');
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={handleClose}>
      <span className="sheet-title">Add Book</span>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="field-label">Title</label>
          <input
            className="field-input"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder=""
            autoFocus
          />
        </div>

        <div>
          <label className="field-label">Description</label>
          <textarea
            className="field-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder=""
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
          Add
        </button>
      </form>
    </BottomSheet>
  );
}
