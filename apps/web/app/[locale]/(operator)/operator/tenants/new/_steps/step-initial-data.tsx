'use client';

import { Button, Card, CardSubtitle, CardTitle } from '@flowhr/ui';
import {
  type ApprovalStepRole,
  type DeptScope,
  approvalRequestTypeEnum,
  approvalStepRoleEnum,
} from '@flowhr/schemas';
import type { StepProps } from '../wizard-client';
import { CheckboxField, SelectField, TextField } from '../_components/field';
import { ONBOARDING_DEPT_SCOPES } from '@/lib/operator/tenant-registration/wizard';

const REQUEST_TYPES = approvalRequestTypeEnum.options;
const STEP_ROLES = approvalStepRoleEnum.options;

/**
 * 6단계 — 초기 데이터(전부 선택). 부서/근무정책/휴가종류/결재라인/문서양식 seed.
 * 결재 조건 분기 DSL 편집은 TA-13(WI-034) 소유 — 여기서는 default_line(approver_role+dept_scope)만,
 * conditions 는 빈 배열 고정(buildRegistrationPayload). specific_employee_id 는 등록 시점 직원 부재로 제외.
 */
export function StepInitialData(props: StepProps) {
  const { t } = props;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-text">{t('initial.title')}</h2>
        <p className="text-xs text-text-muted">{t('initial.subtitle')}</p>
      </div>
      <DepartmentsSection {...props} />
      <WorkPolicySection {...props} />
      <LeaveTypesSection {...props} />
      <ApprovalLinesSection {...props} />
      <DocTemplatesSection {...props} />
    </div>
  );
}

// ── 부서 ─────────────────────────────────────────────────────────────────────
function DepartmentsSection({ t, form, update }: StepProps) {
  const rows = form.departments;

  const add = () =>
    update((f) => ({
      ...f,
      departments: [
        ...f.departments,
        { ui_id: globalThis.crypto.randomUUID(), name: '', code: '', parent_ui_id: null },
      ],
    }));

  const patch = (uiId: string, p: { name?: string; code?: string; parent_ui_id?: string | null }) =>
    update((f) => ({
      ...f,
      departments: f.departments.map((d) => (d.ui_id === uiId ? { ...d, ...p } : d)),
    }));

  const remove = (uiId: string) =>
    update((f) => ({
      ...f,
      departments: f.departments
        .filter((d) => d.ui_id !== uiId)
        // 삭제된 행을 상위로 참조하던 하위 행의 parent 를 해제(참조 무결성).
        .map((d) => (d.parent_ui_id === uiId ? { ...d, parent_ui_id: null } : d)),
    }));

  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title={t('initial.dept.title')} subtitle={t('initial.dept.subtitle')} onAdd={add} addLabel={t('initial.add_row')} />
      {rows.length === 0 ? (
        <Empty t={t} />
      ) : (
        rows.map((d, i) => {
          const parentOptions = [
            { value: '', label: t('initial.dept.no_parent') },
            ...rows
              .slice(0, i)
              .filter((p) => p.code.trim().length > 0)
              .map((p) => ({ value: p.ui_id, label: p.code.trim() })),
          ];
          return (
            <div key={d.ui_id} className="grid grid-cols-1 gap-3 rounded-md border border-border p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
              <TextField id={`dept-name-${i}`} label={t('initial.dept.name')} value={d.name} onChange={(v) => patch(d.ui_id, { name: v })} required />
              <TextField id={`dept-code-${i}`} label={t('initial.dept.code')} value={d.code} onChange={(v) => patch(d.ui_id, { code: v })} />
              <SelectField
                id={`dept-parent-${i}`}
                label={t('initial.dept.parent')}
                value={d.parent_ui_id ?? ''}
                onChange={(v) => patch(d.ui_id, { parent_ui_id: v === '' ? null : v })}
                options={parentOptions}
              />
              <RemoveButton t={t} onClick={() => remove(d.ui_id)} />
            </div>
          );
        })
      )}
    </Card>
  );
}

// ── 근무정책 ──────────────────────────────────────────────────────────────────
function WorkPolicySection({ t, form, update }: StepProps) {
  const wp = form.work_policy;
  const set = (p: Partial<typeof wp>) =>
    update((f) => ({ ...f, work_policy: { ...f.work_policy, ...p } }));

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>{t('initial.work.title')}</CardTitle>
          <CardSubtitle>{t('initial.work.subtitle')}</CardSubtitle>
        </div>
        <CheckboxField id="work-enabled" label={t('initial.work.enable')} checked={wp.enabled} onChange={(c) => set({ enabled: c })} />
      </div>
      {wp.enabled && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TextField id="work-name" label={t('initial.work.name')} value={wp.name} onChange={(v) => set({ name: v })} />
          <TextField id="work-in" label={t('initial.work.clock_in')} type="time" value={wp.standard_clock_in} onChange={(v) => set({ standard_clock_in: v })} />
          <TextField id="work-out" label={t('initial.work.clock_out')} type="time" value={wp.standard_clock_out} onChange={(v) => set({ standard_clock_out: v })} />
          <TextField id="work-late" label={t('initial.work.late_threshold')} type="time" value={wp.late_threshold} onChange={(v) => set({ late_threshold: v })} />
          <TextField id="work-break" label={t('initial.work.break_minutes')} type="number" min={0} inputMode="numeric" value={wp.break_minutes_default} onChange={(v) => set({ break_minutes_default: v })} />
          <TextField id="work-weekly" label={t('initial.work.weekly_max')} type="number" min={0} inputMode="numeric" value={wp.weekly_max_hours} onChange={(v) => set({ weekly_max_hours: v })} />
        </div>
      )}
    </Card>
  );
}

// ── 휴가종류 ──────────────────────────────────────────────────────────────────
function LeaveTypesSection({ t, form, update }: StepProps) {
  const rows = form.leave_types;
  const add = () =>
    update((f) => ({
      ...f,
      leave_types: [
        ...f.leave_types,
        {
          ui_id: globalThis.crypto.randomUUID(),
          key: '',
          label_ko: '',
          default_days: '0',
          is_paid: true,
          carryover_allowed: false,
          evidence_required: false,
        },
      ],
    }));
  const patch = (uiId: string, p: Partial<(typeof rows)[number]>) =>
    update((f) => ({
      ...f,
      leave_types: f.leave_types.map((x) => (x.ui_id === uiId ? { ...x, ...p } : x)),
    }));
  const remove = (uiId: string) =>
    update((f) => ({ ...f, leave_types: f.leave_types.filter((x) => x.ui_id !== uiId) }));

  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title={t('initial.leave.title')} subtitle={t('initial.leave.subtitle')} onAdd={add} addLabel={t('initial.add_row')} />
      {rows.length === 0 ? (
        <Empty t={t} />
      ) : (
        rows.map((lt, i) => (
          <div key={lt.ui_id} className="flex flex-col gap-3 rounded-md border border-border p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_120px_auto] sm:items-end">
              <TextField id={`leave-key-${i}`} label={t('initial.leave.key')} value={lt.key} onChange={(v) => patch(lt.ui_id, { key: v })} required />
              <TextField id={`leave-label-${i}`} label={t('initial.leave.label')} value={lt.label_ko} onChange={(v) => patch(lt.ui_id, { label_ko: v })} />
              <TextField id={`leave-days-${i}`} label={t('initial.leave.default_days')} type="number" min={0} inputMode="numeric" value={lt.default_days} onChange={(v) => patch(lt.ui_id, { default_days: v })} />
              <RemoveButton t={t} onClick={() => remove(lt.ui_id)} />
            </div>
            <div className="flex flex-wrap gap-4">
              <CheckboxField id={`leave-paid-${i}`} label={t('initial.leave.is_paid')} checked={lt.is_paid} onChange={(c) => patch(lt.ui_id, { is_paid: c })} />
              <CheckboxField id={`leave-carry-${i}`} label={t('initial.leave.carryover')} checked={lt.carryover_allowed} onChange={(c) => patch(lt.ui_id, { carryover_allowed: c })} />
              <CheckboxField id={`leave-evidence-${i}`} label={t('initial.leave.evidence')} checked={lt.evidence_required} onChange={(c) => patch(lt.ui_id, { evidence_required: c })} />
            </div>
          </div>
        ))
      )}
    </Card>
  );
}

// ── 결재라인 ──────────────────────────────────────────────────────────────────
function ApprovalLinesSection({ t, form, update }: StepProps) {
  const rows = form.approval_lines;
  const add = () =>
    update((f) => ({
      ...f,
      approval_lines: [
        ...f.approval_lines,
        {
          ui_id: globalThis.crypto.randomUUID(),
          name: '',
          request_type: 'leave',
          steps: [{ approver_role: 'tenant_hr_admin', dept_scope: 'all' }],
          is_active: true,
        },
      ],
    }));
  const patchLine = (uiId: string, p: Partial<(typeof rows)[number]>) =>
    update((f) => ({
      ...f,
      approval_lines: f.approval_lines.map((x) => (x.ui_id === uiId ? { ...x, ...p } : x)),
    }));
  const removeLine = (uiId: string) =>
    update((f) => ({ ...f, approval_lines: f.approval_lines.filter((x) => x.ui_id !== uiId) }));

  const addStep = (uiId: string) =>
    update((f) => ({
      ...f,
      approval_lines: f.approval_lines.map((x) =>
        x.ui_id === uiId
          ? { ...x, steps: [...x.steps, { approver_role: 'tenant_manager', dept_scope: 'own_team' }] }
          : x,
      ),
    }));
  const patchStep = (uiId: string, idx: number, p: { approver_role?: ApprovalStepRole; dept_scope?: DeptScope }) =>
    update((f) => ({
      ...f,
      approval_lines: f.approval_lines.map((x) =>
        x.ui_id === uiId
          ? { ...x, steps: x.steps.map((s, i) => (i === idx ? { ...s, ...p } : s)) }
          : x,
      ),
    }));
  const removeStep = (uiId: string, idx: number) =>
    update((f) => ({
      ...f,
      approval_lines: f.approval_lines.map((x) =>
        x.ui_id === uiId ? { ...x, steps: x.steps.filter((_, i) => i !== idx) } : x,
      ),
    }));

  const roleOptions = STEP_ROLES.map((r) => ({ value: r, label: t(`initial.approval.role.${r}`) }));
  const scopeOptions = ONBOARDING_DEPT_SCOPES.map((s) => ({ value: s, label: t(`initial.approval.scope.${s}`) }));
  const typeOptions = REQUEST_TYPES.map((rt) => ({ value: rt, label: t(`initial.approval.request_type.${rt}`) }));

  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title={t('initial.approval.title')} subtitle={t('initial.approval.subtitle')} onAdd={add} addLabel={t('initial.add_row')} />
      {rows.length === 0 ? (
        <Empty t={t} />
      ) : (
        rows.map((line, i) => (
          <div key={line.ui_id} className="flex flex-col gap-3 rounded-md border border-border p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <TextField id={`appr-name-${i}`} label={t('initial.approval.name')} value={line.name} onChange={(v) => patchLine(line.ui_id, { name: v })} required />
              <SelectField
                id={`appr-type-${i}`}
                label={t('initial.approval.request_type_label')}
                value={line.request_type}
                onChange={(v) => patchLine(line.ui_id, { request_type: v as (typeof rows)[number]['request_type'] })}
                options={typeOptions}
              />
              <RemoveButton t={t} onClick={() => removeLine(line.ui_id)} />
            </div>

            <div className="flex flex-col gap-2 rounded-md bg-surface-2 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-text-muted">{t('initial.approval.steps')}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => addStep(line.ui_id)}>
                  {t('initial.approval.add_step')}
                </Button>
              </div>
              {line.steps.length === 0 ? (
                <p className="text-[12px] text-danger">{t('initial.approval.no_step')}</p>
              ) : (
                line.steps.map((s, si) => (
                  <div key={si} className="grid grid-cols-1 gap-2 sm:grid-cols-[28px_1fr_1fr_auto] sm:items-center">
                    <span className="text-[12px] font-semibold text-text-muted">{si + 1}</span>
                    <SelectField id={`appr-${i}-role-${si}`} value={s.approver_role} onChange={(v) => patchStep(line.ui_id, si, { approver_role: v as ApprovalStepRole })} options={roleOptions} />
                    <SelectField id={`appr-${i}-scope-${si}`} value={s.dept_scope} onChange={(v) => patchStep(line.ui_id, si, { dept_scope: v as DeptScope })} options={scopeOptions} />
                    <RemoveButton t={t} onClick={() => removeStep(line.ui_id, si)} />
                  </div>
                ))
              )}
            </div>

            <CheckboxField id={`appr-active-${i}`} label={t('initial.approval.is_active')} checked={line.is_active} onChange={(c) => patchLine(line.ui_id, { is_active: c })} />
          </div>
        ))
      )}
    </Card>
  );
}

// ── 문서양식 ──────────────────────────────────────────────────────────────────
function DocTemplatesSection({ t, form, update }: StepProps) {
  const rows = form.document_templates;
  const add = () =>
    update((f) => ({
      ...f,
      document_templates: [
        ...f.document_templates,
        { ui_id: globalThis.crypto.randomUUID(), key: '', label_ko: '' },
      ],
    }));
  const patch = (uiId: string, p: { key?: string; label_ko?: string }) =>
    update((f) => ({
      ...f,
      document_templates: f.document_templates.map((x) => (x.ui_id === uiId ? { ...x, ...p } : x)),
    }));
  const remove = (uiId: string) =>
    update((f) => ({
      ...f,
      document_templates: f.document_templates.filter((x) => x.ui_id !== uiId),
    }));

  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title={t('initial.doc.title')} subtitle={t('initial.doc.subtitle')} onAdd={add} addLabel={t('initial.add_row')} />
      {rows.length === 0 ? (
        <Empty t={t} />
      ) : (
        rows.map((dt, i) => (
          <div key={dt.ui_id} className="grid grid-cols-1 gap-3 rounded-md border border-border p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <TextField id={`doc-key-${i}`} label={t('initial.doc.key')} value={dt.key} onChange={(v) => patch(dt.ui_id, { key: v })} required />
            <TextField id={`doc-label-${i}`} label={t('initial.doc.label')} value={dt.label_ko} onChange={(v) => patch(dt.ui_id, { label_ko: v })} />
            <RemoveButton t={t} onClick={() => remove(dt.ui_id)} />
          </div>
        ))
      )}
    </Card>
  );
}

// ── 공용 소품 ─────────────────────────────────────────────────────────────────
function SectionHeader({
  title,
  subtitle,
  onAdd,
  addLabel,
}: {
  title: string;
  subtitle: string;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <CardTitle>{title}</CardTitle>
        <CardSubtitle>{subtitle}</CardSubtitle>
      </div>
      <Button type="button" variant="secondary" size="sm" onClick={onAdd}>
        {addLabel}
      </Button>
    </div>
  );
}

function RemoveButton({ t, onClick }: { t: StepProps['t']; onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="sm" onClick={onClick} aria-label={t('initial.remove_row')}>
      {t('initial.remove_row')}
    </Button>
  );
}

function Empty({ t }: { t: StepProps['t'] }) {
  return <p className="text-[12px] text-text-muted">{t('initial.empty')}</p>;
}
