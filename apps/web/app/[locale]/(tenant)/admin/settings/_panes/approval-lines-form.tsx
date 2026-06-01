'use client';

import { Button, Card, CardTitle, Input, Label } from '@flowhr/ui';
import { useTranslations } from 'next-intl';
import { useActionState, useRef, useState } from 'react';
import type { PendingChangeSummary } from '@/lib/tenant-settings/queries';
import { SAVE_INIT, saveApprovalLinesAction } from '../actions';
import { PendingChangeList } from '../_components/pending-change-list';
import { PermissionState } from '../_components/permission-state';
import { SettingsActionBar } from '../_components/settings-action-bar';

const APPROVAL_TYPES = ['leave', 'attendance_mod', 'certificate', 'change_request', 'document'] as const;
const STEP_ROLES = ['tenant_super', 'tenant_hr_admin', 'tenant_manager', 'employee'] as const;
const DEPT_SCOPES = ['own_team', 'parent', 'all', 'specific'] as const;
const CONDITION_FIELDS = ['leave_days', 'department_id', 'employment_type', 'position', 'job_title'] as const;
const NUMERIC_OPS = ['==', '!=', '>=', '<=', '>', '<', 'in', 'not_in'] as const;
const STRING_OPS = ['==', '!=', 'in', 'not_in'] as const;
const EMPLOYMENT_TYPES = ['regular', 'contract', 'part_time', 'freelancer'] as const;
// op 기호 → i18n 키(점 표기 회피).
const OP_KEY: Record<string, string> = {
  '==': 'eq',
  '!=': 'ne',
  '>=': 'gte',
  '<=': 'lte',
  '>': 'gt',
  '<': 'lt',
  in: 'in',
  not_in: 'not_in',
};

type IdName = { id: string; name: string };

interface StepState {
  approver_role: string;
  dept_scope: string;
  specific_employee_id: string;
}
interface ConditionState {
  field: string;
  op: string;
  /** UI 는 value 를 문자열로 보관(배열 op 는 콤마 구분) — 서버 form-data 가 타입 정규화. */
  value: string;
  line: StepState[];
}
interface LineState {
  id?: string;
  name: string;
  request_type: string;
  is_active: boolean;
  conditions: ConditionState[];
  default_line: StepState[];
}

interface ApprovalLineData {
  id: string;
  name: string;
  request_type: string;
  conditions: unknown;
  default_line: unknown;
  is_active: boolean;
}
interface ApprovalPaneData {
  lines: ApprovalLineData[];
  employees: IdName[];
  departments: IdName[];
}

function newStep(): StepState {
  return { approver_role: 'tenant_manager', dept_scope: 'own_team', specific_employee_id: '' };
}

/** DB jsonb step → UI step(방어적). */
function toStepState(raw: unknown): StepState {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    approver_role: typeof o.approver_role === 'string' ? o.approver_role : 'tenant_manager',
    dept_scope: typeof o.dept_scope === 'string' ? o.dept_scope : 'own_team',
    specific_employee_id: typeof o.specific_employee_id === 'string' ? o.specific_employee_id : '',
  };
}
function toSteps(raw: unknown): StepState[] {
  return Array.isArray(raw) ? raw.map(toStepState) : [];
}
/** DB jsonb condition.value → UI 문자열(배열은 콤마 결합). */
function valueToString(raw: unknown): string {
  if (Array.isArray(raw)) return raw.map((x) => String(x)).join(', ');
  if (raw == null) return '';
  return String(raw);
}
function toConditionState(raw: unknown): ConditionState {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    field: typeof o.field === 'string' ? o.field : 'leave_days',
    op: typeof o.op === 'string' ? o.op : '>=',
    value: valueToString(o.value),
    line: toSteps(o.line),
  };
}
function toLineState(l: ApprovalLineData): LineState {
  return {
    id: l.id,
    name: l.name,
    request_type: l.request_type,
    is_active: l.is_active,
    conditions: Array.isArray(l.conditions) ? l.conditions.map(toConditionState) : [],
    default_line: toSteps(l.default_line),
  };
}

const selectCls =
  'h-9 w-full rounded-md border border-border bg-bg px-2 text-sm text-text disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-70';

/**
 * 4. 결재라인 탭 (WI-034 조건 분기) — name/유형/활성 + 조건 트리(조건별 결재선) + 기본 결재선 편집.
 * conditions/default_line 을 직접 편집한다(WI-033 의 read-only 보존 정책 폐기).
 */
export function ApprovalLinesForm({
  editable,
  data,
  pending,
}: {
  editable: boolean;
  data: unknown;
  pending: PendingChangeSummary[];
}) {
  const t = useTranslations('screens.ta-13.approval');
  const [state, formAction, submitting] = useActionState(saveApprovalLinesAction, SAVE_INIT);

  const pane = (data && typeof data === 'object' ? data : {}) as Partial<ApprovalPaneData>;
  const employees = Array.isArray(pane.employees) ? pane.employees : [];
  const departments = Array.isArray(pane.departments) ? pane.departments : [];

  const [lines, setLines] = useState<LineState[]>(() =>
    (Array.isArray(pane.lines) ? pane.lines : []).map(toLineState),
  );

  // 마운트 시점 기존 라인 스냅샷 — 화면에서 제거된 기존(id) 라인을 제출 시 is_active=false 로 비활성화한다.
  // (mig 40 apply 엔진은 제출 lines[] 만 순회·upsert 하므로, 단순 배열 제거는 DB 에 반영되지 않는다.
  //  하드 삭제 경로는 스키마에 없어 "삭제 = 비활성화"가 계약 — tenant-settings.ts 주석.)
  const initialRef = useRef<{ id: string; name: string; request_type: string }[] | null>(null);
  if (initialRef.current === null) {
    initialRef.current = (Array.isArray(pane.lines) ? pane.lines : [])
      .filter((l) => Boolean(l?.id))
      .map((l) => ({ id: l.id, name: l.name, request_type: l.request_type }));
  }

  const updateLine = (i: number, patch: Partial<LineState>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const removeLine = (i: number) => setLines((ls) => ls.filter((_, idx) => idx !== i));
  const addLine = () =>
    setLines((ls) => [
      ...ls,
      { name: '', request_type: 'leave', is_active: true, conditions: [], default_line: [newStep()] },
    ]);

  // 제출 payload (value 는 문자열 그대로 — 서버 form-data 가 정규화).
  const currentIds = new Set(lines.map((l) => l.id).filter(Boolean));
  // 화면에서 제거된 기존 라인 → 비활성화 항목으로 제출(실제 DB 반영). conditions/default_line 은 비움.
  const removedDeactivations = (initialRef.current ?? [])
    .filter((l) => !currentIds.has(l.id))
    .map((l) => ({
      id: l.id,
      name: l.name,
      request_type: l.request_type,
      is_active: false,
      conditions: [] as ConditionState[],
      default_line: [] as StepState[],
    }));
  const submitLines = [
    ...lines.map((l) => ({
      id: l.id,
      name: l.name,
      request_type: l.request_type,
      is_active: l.is_active,
      conditions: l.conditions,
      default_line: l.default_line,
    })),
    ...removedDeactivations,
  ];

  return (
    <Card className="flex flex-col">
      <CardTitle>{t('section')}</CardTitle>
      <form action={formAction} className="mt-2 flex flex-col gap-4">
        <input type="hidden" name="lines_json" value={JSON.stringify(submitLines)} />
        <p className="text-[12px] text-text-muted">{t('intro')}</p>

        {lines.length === 0 ? (
          <p className="py-4 text-[13px] text-text-muted">{t('empty')}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {lines.map((line, i) => (
              <LineEditor
                key={i}
                line={line}
                editable={editable}
                employees={employees}
                departments={departments}
                onChange={(patch) => updateLine(i, patch)}
                onRemove={() => removeLine(i)}
              />
            ))}
          </div>
        )}

        {editable && (
          <Button type="button" variant="secondary" size="sm" className="self-start" onClick={addLine}>
            + {t('add')}
          </Button>
        )}

        {editable ? (
          <SettingsActionBar pending={submitting} state={state} />
        ) : (
          <div className="mt-2">
            <PermissionState kind="read_only" />
          </div>
        )}
      </form>
      <PendingChangeList items={pending} />
    </Card>
  );
}

function LineEditor({
  line,
  editable,
  employees,
  departments,
  onChange,
  onRemove,
}: {
  line: LineState;
  editable: boolean;
  employees: IdName[];
  departments: IdName[];
  onChange: (patch: Partial<LineState>) => void;
  onRemove: () => void;
}) {
  const t = useTranslations('screens.ta-13.approval');

  const addCondition = () =>
    onChange({
      conditions: [...line.conditions, { field: 'leave_days', op: '>=', value: '', line: [newStep()] }],
    });
  const updateCondition = (ci: number, patch: Partial<ConditionState>) =>
    onChange({ conditions: line.conditions.map((c, idx) => (idx === ci ? { ...c, ...patch } : c)) });
  const removeCondition = (ci: number) =>
    onChange({ conditions: line.conditions.filter((_, idx) => idx !== ci) });

  return (
    <div className={`flex flex-col gap-3 rounded-md border border-border p-4 ${line.is_active ? '' : 'opacity-60'}`}>
      <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
        <div>
          <Label>{t('name')}</Label>
          <Input
            value={line.name}
            onChange={(e) => onChange({ name: e.currentTarget.value })}
            disabled={!editable}
            placeholder={t('name_placeholder')}
          />
        </div>
        <div>
          <Label>{t('request_type')}</Label>
          <select
            value={line.request_type}
            onChange={(e) => onChange({ request_type: e.currentTarget.value })}
            disabled={!editable}
            className={selectCls}
          >
            {APPROVAL_TYPES.map((rt) => (
              <option key={rt} value={rt}>
                {t(`type.${rt}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 조건 분기 */}
      <div className="flex flex-col gap-2 rounded-md bg-surface-2 p-3">
        <span className="text-[12px] font-semibold text-text">{t('conditions_label')}</span>
        {line.conditions.length === 0 ? (
          <p className="text-[12px] text-text-muted">{t('no_conditions')}</p>
        ) : (
          line.conditions.map((cond, ci) => (
            <ConditionEditor
              key={ci}
              index={ci}
              cond={cond}
              editable={editable}
              employees={employees}
              departments={departments}
              onChange={(patch) => updateCondition(ci, patch)}
              onRemove={() => removeCondition(ci)}
            />
          ))
        )}
        {editable && (
          <Button type="button" variant="ghost" size="sm" className="self-start" onClick={addCondition}>
            + {t('add_condition')}
          </Button>
        )}
      </div>

      {/* 기본 결재선 */}
      <div className="flex flex-col gap-2">
        <span className="text-[12px] font-semibold text-text">{t('default_line')}</span>
        <StepListEditor
          steps={line.default_line}
          editable={editable}
          employees={employees}
          onChange={(steps) => onChange({ default_line: steps })}
        />
        {line.is_active && line.default_line.length === 0 && (
          <p className="text-[12px] text-danger">{t('no_default_hint')}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex cursor-pointer items-center gap-1.5 text-[13px] text-text">
          <input
            type="checkbox"
            checked={line.is_active}
            onChange={(e) => onChange({ is_active: e.currentTarget.checked })}
            disabled={!editable}
          />
          {t('is_active')}
        </label>
        {editable && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            {t('remove_line')}
          </Button>
        )}
      </div>
    </div>
  );
}

function ConditionEditor({
  index,
  cond,
  editable,
  employees,
  departments,
  onChange,
  onRemove,
}: {
  index: number;
  cond: ConditionState;
  editable: boolean;
  employees: IdName[];
  departments: IdName[];
  onChange: (patch: Partial<ConditionState>) => void;
  onRemove: () => void;
}) {
  const t = useTranslations('screens.ta-13.approval');
  const ops = cond.field === 'leave_days' ? NUMERIC_OPS : STRING_OPS;
  const isArrayOp = cond.op === 'in' || cond.op === 'not_in';

  // field 변경 시 연산자가 호환되지 않으면 첫 호환 연산자로 보정 + value 초기화.
  const onFieldChange = (field: string) => {
    const validOps = field === 'leave_days' ? NUMERIC_OPS : STRING_OPS;
    const op = (validOps as readonly string[]).includes(cond.op) ? cond.op : validOps[0];
    onChange({ field, op, value: '' });
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-bg p-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-text-muted">{t('condition_n', { n: index + 1 })}</span>
        {editable && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            {t('remove')}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 max-md:grid-cols-1">
        <div>
          <Label className="text-[11px]">{t('field_label')}</Label>
          <select
            value={cond.field}
            onChange={(e) => onFieldChange(e.currentTarget.value)}
            disabled={!editable}
            className={selectCls}
          >
            {CONDITION_FIELDS.map((f) => (
              <option key={f} value={f}>
                {t(`field.${f}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-[11px]">{t('op_label')}</Label>
          <select
            value={cond.op}
            onChange={(e) => onChange({ op: e.currentTarget.value, value: '' })}
            disabled={!editable}
            className={selectCls}
          >
            {ops.map((op) => (
              <option key={op} value={op}>
                {t(`op.${OP_KEY[op]}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-[11px]">{t('value_label')}</Label>
          <ValueInput
            field={cond.field}
            isArrayOp={isArrayOp}
            value={cond.value}
            editable={editable}
            departments={departments}
            onChange={(value) => onChange({ value })}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[11px] text-text-muted">{t('matched_line')}</span>
        <StepListEditor
          steps={cond.line}
          editable={editable}
          employees={employees}
          onChange={(steps) => onChange({ line: steps })}
        />
      </div>
    </div>
  );
}

function ValueInput({
  field,
  isArrayOp,
  value,
  editable,
  departments,
  onChange,
}: {
  field: string;
  isArrayOp: boolean;
  value: string;
  editable: boolean;
  departments: IdName[];
  onChange: (value: string) => void;
}) {
  const t = useTranslations('screens.ta-13.approval');

  // department_id 단일 비교 → 부서 select (admin 이 UUID 를 외울 수 없으므로).
  if (field === 'department_id' && !isArrayOp) {
    return (
      <select value={value} onChange={(e) => onChange(e.currentTarget.value)} disabled={!editable} className={selectCls}>
        <option value="">{t('select_department')}</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
    );
  }
  // employment_type 단일 비교 → 고용형태 select.
  if (field === 'employment_type' && !isArrayOp) {
    return (
      <select value={value} onChange={(e) => onChange(e.currentTarget.value)} disabled={!editable} className={selectCls}>
        <option value="">{t('select_value')}</option>
        {EMPLOYMENT_TYPES.map((et) => (
          <option key={et} value={et}>
            {t(`employment_type.${et}`)}
          </option>
        ))}
      </select>
    );
  }

  const placeholder = isArrayOp
    ? field === 'leave_days'
      ? t('value_ph.number_list')
      : t('value_ph.text_list')
    : field === 'leave_days'
      ? t('value_ph.number')
      : t('value_ph.text');

  return (
    <Input
      type={field === 'leave_days' && !isArrayOp ? 'number' : 'text'}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      disabled={!editable}
      placeholder={placeholder}
    />
  );
}

function StepListEditor({
  steps,
  editable,
  employees,
  onChange,
}: {
  steps: StepState[];
  editable: boolean;
  employees: IdName[];
  onChange: (steps: StepState[]) => void;
}) {
  const t = useTranslations('screens.ta-13.approval');

  const update = (i: number, patch: Partial<StepState>) =>
    onChange(steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const remove = (i: number) => onChange(steps.filter((_, idx) => idx !== i));
  const add = () => onChange([...steps, newStep()]);

  return (
    <div className="flex flex-col gap-2">
      {steps.length === 0 ? (
        <p className="text-[12px] text-text-muted">{t('no_steps')}</p>
      ) : (
        steps.map((step, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2 rounded-md border border-border bg-bg p-2">
            <span className="self-center text-[11px] text-text-muted">{t('step_n', { n: i + 1 })}</span>
            <div className="min-w-[120px] flex-1">
              <Label className="text-[11px]">{t('approver_role')}</Label>
              <select
                value={step.approver_role}
                onChange={(e) => update(i, { approver_role: e.currentTarget.value })}
                disabled={!editable}
                className={selectCls}
              >
                {STEP_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(`role.${r}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[120px] flex-1">
              <Label className="text-[11px]">{t('dept_scope_label')}</Label>
              <select
                value={step.dept_scope}
                onChange={(e) => update(i, { dept_scope: e.currentTarget.value })}
                disabled={!editable}
                className={selectCls}
              >
                {DEPT_SCOPES.map((d) => (
                  <option key={d} value={d}>
                    {t(`dept_scope.${d}`)}
                  </option>
                ))}
              </select>
            </div>
            {step.dept_scope === 'specific' && (
              <div className="min-w-[140px] flex-1">
                <Label className="text-[11px]">{t('employee_label')}</Label>
                <select
                  value={step.specific_employee_id}
                  onChange={(e) => update(i, { specific_employee_id: e.currentTarget.value })}
                  disabled={!editable}
                  className={selectCls}
                >
                  <option value="">{t('select_employee')}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {editable && (
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}>
                {t('remove')}
              </Button>
            )}
          </div>
        ))
      )}
      {editable && (
        <Button type="button" variant="ghost" size="sm" className="self-start" onClick={add}>
          + {t('add_step')}
        </Button>
      )}
    </div>
  );
}
