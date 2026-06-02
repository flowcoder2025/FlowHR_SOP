'use client';

import {
  type DataTableColumn,
  type SortState,
  Button,
  DataTable,
  FilterChip,
  RowLink,
  rowHighlight,
} from '@flowhr/ui';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { exportTenants } from '@/lib/operator/tenant-list/actions';
import {
  type DisplayStatus,
  type ListParams,
  type TenantStatus,
  TENANT_STATUSES,
  allowedStatusTargets,
} from '@/lib/operator/tenant-list/list';
import { canChangeTenantStatus, canExportTenantList } from '@/lib/operator/tenant-list/permissions';
import type { PlanFilterOption, TenantListData, TenantListRow } from '@/lib/operator/tenant-list/queries';
import { PaymentBadge, StatusBadge } from './status-badge';
import { StatusChangeDialog } from './status-change-dialog';

const ROW_TONE: Partial<Record<DisplayStatus, string>> = {
  expired: rowHighlight.danger,
  overdue: rowHighlight.warning,
};

export function TenantsClient({
  locale,
  role,
  data,
  params,
  planOptions,
}: {
  locale: string;
  role: string | null;
  data: TenantListData;
  params: ListParams;
  planOptions: PlanFilterOption[];
}) {
  const t = useTranslations('screens.op-02');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(params.q);
  const [exporting, setExporting] = useState(false);
  const [exportNote, setExportNote] = useState<string | null>(null);
  const [dialogTenant, setDialogTenant] =
    useState<{ id: string; name: string; dbStatus: TenantStatus } | null>(null);

  const pushParams = useCallback(
    (updates: Record<string, string | null>, resetPage = true) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (resetPage) sp.delete('page');
      for (const [k, v] of Object.entries(updates)) {
        if (v == null || v === '') sp.delete(k);
        else sp.set(k, v);
      }
      const qs = sp.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [router, pathname, searchParams],
  );

  // 검색 입력 debounce(300ms) → URL ?q= 동기화(현재 URL 값과 다를 때만).
  useEffect(() => {
    const timer = setTimeout(() => {
      const current = searchParams.get('q') ?? '';
      if (search !== current) pushParams({ q: search || null });
    }, 300);
    return () => clearTimeout(timer);
    // search 변경 시에만 평가(pushParams/searchParams 는 내부에서 최신값 참조).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const toggleStatus = (s: TenantStatus) => {
    const set = new Set(params.status);
    if (set.has(s)) set.delete(s);
    else set.add(s);
    pushParams({ status: [...set].join(',') || null });
  };

  const togglePlan = (id: string) => {
    const set = new Set(params.planId);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    pushParams({ plan: [...set].join(',') || null });
  };

  const clearFilters = () => {
    setSearch('');
    startTransition(() => router.replace(pathname, { scroll: false }));
  };

  const sortState: SortState = { key: params.sortField, direction: params.sortDirection };
  const onSortChange = (next: SortState) => pushParams({ sort: next.key, dir: next.direction });

  const canChange = canChangeTenantStatus(role);
  const canExport = canExportTenantList(role);

  const handleExport = async () => {
    setExporting(true);
    setExportNote(null);
    try {
      const raw = Object.fromEntries(searchParams.entries());
      const res = await exportTenants(locale, raw);
      if (!res.ok) {
        setExportNote(t(`export.error.${res.error}`));
        return;
      }
      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      if (res.truncated) setExportNote(t('export.truncated', { limit: res.count }));
    } finally {
      setExporting(false);
    }
  };

  const fmtKrw = (v: number | null) =>
    v == null ? '—' : `₩${new Intl.NumberFormat(locale).format(v)}`;

  const adminLabel = (admin: TenantListRow['admin']) =>
    admin.kind === 'pending' ? admin.email : t(`admin.${admin.kind}`);

  const columns: DataTableColumn<TenantListRow>[] = [
    {
      key: 'name',
      header: t('col.company'),
      sortable: true,
      width: '17%',
      render: (r) => (
        <RowLink href={`/${locale}/operator/tenants/${r.id}`}>{r.name}</RowLink>
      ),
    },
    {
      key: 'domain',
      header: t('col.domain'),
      width: '12%',
      render: (r) => <span className="text-text-muted">{r.slug}</span>,
    },
    {
      key: 'status',
      header: t('col.status'),
      sortable: true,
      width: '9%',
      render: (r) => <StatusBadge status={r.displayStatus} label={t(`status.${r.displayStatus}`)} />,
    },
    {
      key: 'plan_id',
      header: t('col.plan'),
      sortable: true,
      width: '9%',
      render: (r) => r.planName ?? '—',
    },
    {
      key: 'active_user_count',
      header: t('col.usersOfTotal'),
      sortable: true,
      align: 'right',
      width: '8%',
      render: (r) => `${r.activeUserCount}/${r.userLimit ?? '∞'}`,
    },
    {
      key: 'monthly_fee',
      header: t('col.monthlyFee'),
      align: 'right',
      width: '10%',
      render: (r) => fmtKrw(r.monthlyFeeKrw),
    },
    {
      key: 'payment',
      header: t('col.payment'),
      width: '8%',
      render: (r) => <PaymentBadge status={r.paymentStatus} label={r.paymentStatus ? t(`payment.${r.paymentStatus}`) : ''} />,
    },
    {
      key: 'admin',
      header: t('col.admin'),
      width: '13%',
      render: (r) => <span className="text-text-muted">{adminLabel(r.admin)}</span>,
    },
    {
      key: 'updated_at',
      header: t('col.lastActive'),
      sortable: true,
      width: '9%',
      render: (r) => r.updatedAt.slice(0, 10),
    },
  ];

  if (canChange) {
    columns.push({
      key: 'actions',
      header: '',
      align: 'right',
      width: '5%',
      render: (r) => (
        <Button
          type="button"
          variant="ghost"
          className="h-7 px-2 text-xs"
          disabled={allowedStatusTargets(r.dbStatus).length === 0}
          onClick={() => setDialogTenant({ id: r.id, name: r.name, dbStatus: r.dbStatus })}
        >
          {t('action.changeStatus')}
        </Button>
      ),
    });
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const hasFilters = params.q !== '' || params.status.length > 0 || params.planId.length > 0;
  const rangeStart = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const rangeEnd = Math.min(data.page * data.pageSize, data.total);

  return (
    <div className="flex flex-col gap-4">
      {/* 액션 바 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search.placeholder')}
          aria-label={t('search.placeholder')}
          className="h-9 w-72 max-w-full rounded-md border border-border bg-bg px-3 text-sm text-text"
        />
        <div className="flex items-center gap-2">
          {canExport && (
            <Button type="button" variant="ghost" disabled={exporting} onClick={() => void handleExport()}>
              {exporting ? t('export.exporting') : t('action.export')}
            </Button>
          )}
          <Button type="button" variant="primary" onClick={() => router.push(`/${locale}/operator/tenants/new`)}>
            {t('action.create')}
          </Button>
        </div>
      </div>

      {exportNote && <p className="text-xs text-text-muted">{exportNote}</p>}

      {/* 필터 칩 */}
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-bg px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-text-muted">{t('filter.status')}</span>
          {TENANT_STATUSES.map((s) => (
            <FilterChip key={s} active={params.status.includes(s)} onClick={() => toggleStatus(s)}>
              {t(`status.${s}`)}
            </FilterChip>
          ))}
        </div>
        {planOptions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-text-muted">{t('filter.plan')}</span>
            {planOptions.map((p) => (
              <FilterChip key={p.id} active={params.planId.includes(p.id)} onClick={() => togglePlan(p.id)}>
                {p.name}
              </FilterChip>
            ))}
          </div>
        )}
      </div>

      {/* 요약 */}
      <div className="flex items-center justify-between text-sm text-text-muted">
        <span>
          {hasFilters
            ? t('summary.filtered', { shown: data.rows.length, total: data.total })
            : t('summary.total', { total: data.total })}
        </span>
        {hasFilters && (
          <button type="button" onClick={clearFilters} className="cursor-pointer text-xs text-accent">
            {t('filter.clear')}
          </button>
        )}
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto rounded-lg border border-border bg-bg">
        <DataTable
          columns={columns}
          data={data.rows}
          rowKey={(r) => r.id}
          sort={sortState}
          onSortChange={onSortChange}
          rowClassName={(r) => ROW_TONE[r.displayStatus]}
          empty={
            <div className="py-10 text-center">
              <p className="text-sm text-text-muted">{t('empty.title')}</p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-2 cursor-pointer text-sm font-medium text-accent"
                >
                  {t('filter.clear')}
                </button>
              )}
            </div>
          }
        />
      </div>

      {/* 페이지네이션 */}
      {data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span>{t('pagination.range', { start: rangeStart, end: rangeEnd, total: data.total })}</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-3 text-xs"
              disabled={data.page <= 1}
              onClick={() => pushParams({ page: String(data.page - 1) }, false)}
            >
              {t('pagination.prev')}
            </Button>
            <span className="text-xs">{t('pagination.page', { page: data.page, total: totalPages })}</span>
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-3 text-xs"
              disabled={data.page >= totalPages}
              onClick={() => pushParams({ page: String(data.page + 1) }, false)}
            >
              {t('pagination.next')}
            </Button>
          </div>
        </div>
      )}

      {dialogTenant && (
        <StatusChangeDialog tenant={dialogTenant} onClose={() => setDialogTenant(null)} />
      )}
    </div>
  );
}
