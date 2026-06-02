import { describe, expect, it } from 'vitest';
import {
  OPERATOR_ROLES,
  canArchiveTenant,
  canChangeTenantStatus,
  canDeleteTenant,
  canEditTenantBasic,
  canExportTenantList,
  canViewTenantList,
  isOperatorRole,
  isOperatorSuperRole,
} from './permissions';

describe('operator tenant-list permissions', () => {
  it('isOperatorRole 은 super/staff 만 true', () => {
    expect(isOperatorRole('operator_super')).toBe(true);
    expect(isOperatorRole('operator_staff')).toBe(true);
    expect(isOperatorRole('tenant_super')).toBe(false);
    expect(isOperatorRole(null)).toBe(false);
    expect(isOperatorRole(undefined)).toBe(false);
  });

  it('isOperatorSuperRole 은 operator_super 만 true', () => {
    expect(isOperatorSuperRole('operator_super')).toBe(true);
    expect(isOperatorSuperRole('operator_staff')).toBe(false);
    expect(isOperatorSuperRole('tenant_super')).toBe(false);
    expect(isOperatorSuperRole(null)).toBe(false);
  });

  it('조회/내보내기/기본정보수정은 super·staff 공통', () => {
    for (const can of [canViewTenantList, canExportTenantList, canEditTenantBasic]) {
      expect(can('operator_super')).toBe(true);
      expect(can('operator_staff')).toBe(true);
      expect(can('tenant_super')).toBe(false);
      expect(can('employee')).toBe(false);
    }
  });

  it('상태변경/보관/삭제는 operator_super 전용', () => {
    for (const can of [canChangeTenantStatus, canArchiveTenant, canDeleteTenant]) {
      expect(can('operator_super')).toBe(true);
      expect(can('operator_staff')).toBe(false);
      expect(can('tenant_super')).toBe(false);
      expect(can(null)).toBe(false);
    }
  });

  it('OPERATOR_ROLES 집합은 2개 운영자 역할', () => {
    expect([...OPERATOR_ROLES].sort()).toEqual(['operator_staff', 'operator_super']);
  });
});
