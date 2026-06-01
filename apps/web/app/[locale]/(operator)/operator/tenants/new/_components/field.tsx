'use client';

import { Input, Label, cn } from '@flowhr/ui';
import type { ReactNode } from 'react';

/**
 * OP-04 마법사 공용 라벨드 입력(controlled). 숫자/날짜/이메일 등 type 지정.
 * value/onChange 로 reducer form 슬라이스에 직접 바인딩한다(useActionState 미사용 — 마법사 누적 상태).
 */
export function TextField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  disabled,
  min,
  inputMode,
  hint,
  status,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  inputMode?: 'numeric' | 'tel' | 'email' | 'text';
  hint?: ReactNode;
  status?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id}>
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        min={min}
        inputMode={inputMode}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      {status}
      {hint && <p className="text-[12px] text-text-muted">{hint}</p>}
    </div>
  );
}

/** 라벨드 native select(controlled). 디자인 토큰 정합 — Input 과 동일 높이/테두리. */
export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  disabled,
  className,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <select
        id={id}
        name={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text',
          'focus:border-accent focus:outline-2 focus:[outline-offset:-1px] focus:outline-accent',
          'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-70',
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** 인라인 체크박스 + 라벨. */
export function CheckboxField({
  id,
  label,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-[13px] text-text">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
