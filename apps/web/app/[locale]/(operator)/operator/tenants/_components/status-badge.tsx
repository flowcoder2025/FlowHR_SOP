import type { DisplayStatus, InvoiceStatus } from '@/lib/operator/tenant-list/list';

// 원천: .flowset/wireframes/_design-system/components.css `.badge` (OP-02 상태/결제 배지).
// 순수 표시 컴포넌트 — 라벨은 호출측(i18n)이 주입.

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'muted';

const TONE_CLASS: Record<BadgeTone, string> = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-primary',
  muted: 'bg-surface-2 text-text-muted',
};

const DISPLAY_STATUS_TONE: Record<DisplayStatus, BadgeTone> = {
  active: 'success',
  scheduled: 'info',
  pending_invite: 'warning',
  inactive: 'muted',
  overdue: 'warning',
  expiring_soon: 'warning',
  expired: 'danger',
  archived: 'muted',
};

const PAYMENT_TONE: Record<InvoiceStatus, BadgeTone> = {
  paid: 'success',
  issued: 'info',
  draft: 'muted',
  overdue: 'warning',
  failed: 'danger',
  refunded: 'muted',
};

function Badge({ tone, label }: { tone: BadgeTone; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-medium ${TONE_CLASS[tone]}`}
    >
      {label}
    </span>
  );
}

export function StatusBadge({ status, label }: { status: DisplayStatus; label: string }) {
  return <Badge tone={DISPLAY_STATUS_TONE[status]} label={label} />;
}

export function PaymentBadge({
  status,
  label,
}: {
  status: InvoiceStatus | null;
  label: string;
}) {
  if (status == null) return <span className="text-text-subtle">—</span>;
  return <Badge tone={PAYMENT_TONE[status]} label={label} />;
}
