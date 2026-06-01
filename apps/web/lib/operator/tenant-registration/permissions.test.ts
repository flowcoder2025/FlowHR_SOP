import { describe, expect, it } from 'vitest';
import { OPERATOR_ROLES, canRegisterTenant, isOperator } from './permissions';

describe('operator tenant-registration permissions', () => {
  it('operator 역할만 isOperator true', () => {
    expect(isOperator('operator_super')).toBe(true);
    expect(isOperator('operator_staff')).toBe(true);
    expect(isOperator('tenant_super')).toBe(false);
    expect(isOperator('tenant_hr_admin')).toBe(false);
    expect(isOperator('employee')).toBe(false);
    expect(isOperator(null)).toBe(false);
    expect(isOperator(undefined)).toBe(false);
  });

  it('등록은 operator_super/operator_staff 공통 허용', () => {
    expect(canRegisterTenant('operator_super')).toBe(true);
    expect(canRegisterTenant('operator_staff')).toBe(true);
    expect(canRegisterTenant('tenant_super')).toBe(false);
    expect(canRegisterTenant('')).toBe(false);
  });

  it('OPERATOR_ROLES 집합은 2개 운영자 역할', () => {
    expect([...OPERATOR_ROLES].sort()).toEqual(['operator_staff', 'operator_super']);
  });
});
