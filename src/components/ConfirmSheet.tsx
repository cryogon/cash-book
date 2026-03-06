import { BottomSheet } from './BottomSheet';

interface ConfirmSheetProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSheet({
  open, title, message, confirmLabel = 'Delete', onConfirm, onCancel,
}: ConfirmSheetProps) {
  return (
    <BottomSheet open={open} onClose={onCancel}>
      <div style={{ paddingBottom: 8 }}>
        <span className="sheet-title" style={{ borderBottomColor: 'var(--red)' }}>{title}</span>
        <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', marginBottom: 24, lineHeight: 1.55 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: 15, borderRadius: 999, border: 'none',
              background: 'var(--red)', color: '#fff',
              fontSize: '1rem', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
