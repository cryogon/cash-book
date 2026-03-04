import type { ReactNode } from 'react';

interface ActionMenuProps {
  children: ReactNode;
  /** Position offset from top-right of the nearest relative container */
  top?: number;
  right?: number;
}

export function ActionMenu({ children, top = 6, right = 6 }: ActionMenuProps) {
  return (
    <div
      style={{
        position: 'absolute', top, right, zIndex: 10,
        background: '#fff', borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0,0,0,0.14)',
        overflow: 'hidden', minWidth: 130,
        animation: 'scaleIn 0.12s ease-out',
      }}
    >
      {children}
    </div>
  );
}

export function ActionMenuDivider() {
  return <div style={{ height: 1, background: 'var(--divider)' }} />;
}

interface ActionItemProps {
  icon: ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}

export function ActionItem({ icon, label, danger, onClick }: ActionItemProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        width: '100%', padding: '11px 14px', background: 'none',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        fontSize: '0.875rem', fontWeight: 600, fontFamily: 'inherit',
        color: danger ? 'var(--red)' : 'var(--text)',
      }}
    >
      {icon}
      {label}
    </button>
  );
}
