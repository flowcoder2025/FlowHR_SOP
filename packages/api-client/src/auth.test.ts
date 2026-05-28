import { describe, expect, it } from 'vitest';
import { canAccessPath, roleToRedirectPath } from './auth';

describe('roleToRedirectPath', () => {
  it('operator_* → /operator', () => {
    expect(roleToRedirectPath('operator_super')).toBe('/operator');
    expect(roleToRedirectPath('operator_staff')).toBe('/operator');
  });
  it('tenant_* → /admin', () => {
    expect(roleToRedirectPath('tenant_super')).toBe('/admin');
    expect(roleToRedirectPath('tenant_hr_admin')).toBe('/admin');
    expect(roleToRedirectPath('tenant_manager')).toBe('/admin');
  });
  it('employee → /me', () => {
    expect(roleToRedirectPath('employee')).toBe('/me');
  });
  it('알 수 없거나 미설정 역할 → /me 폴백', () => {
    expect(roleToRedirectPath(null)).toBe('/me');
    expect(roleToRedirectPath(undefined)).toBe('/me');
    expect(roleToRedirectPath('something_else')).toBe('/me');
  });
});

describe('canAccessPath', () => {
  it('/operator 는 operator_* 만 허용', () => {
    expect(canAccessPath('operator_super', '/operator')).toBe(true);
    expect(canAccessPath('operator_staff', '/operator/tenants')).toBe(true);
    expect(canAccessPath('employee', '/operator')).toBe(false);
    expect(canAccessPath('tenant_super', '/operator')).toBe(false);
  });
  it('/admin 은 tenant_* 만 허용', () => {
    expect(canAccessPath('tenant_super', '/admin')).toBe(true);
    expect(canAccessPath('tenant_manager', '/admin/employees')).toBe(true);
    expect(canAccessPath('employee', '/admin')).toBe(false);
    expect(canAccessPath('operator_super', '/admin')).toBe(false);
  });
  it('/me 는 모든 인증 사용자 허용', () => {
    expect(canAccessPath('employee', '/me')).toBe(true);
    expect(canAccessPath('operator_super', '/me')).toBe(true);
    expect(canAccessPath(null, '/me')).toBe(true);
  });
});
