import { describe, expect, it } from 'vitest';
import { SETTING_TABS, type SettingTab, canEdit, canRead, permissionFor } from './permissions';

/**
 * TA-13 권한 매트릭스 회귀 테스트 (WI-032 듀얼검증 evaluator — lib 권한 자동 검증 부재 대응).
 * 와이어프레임 TA-13 §1/§6 역할 설계 + RLS 정합 + 최소권한.
 */

describe('canEdit — PATCH 구현 P0 4탭 × super/hr_admin', () => {
  const P0 = ['company', 'work_policy', 'leave_policy', 'approval_lines'] as const;
  const NON_P0: SettingTab[] = ['roles', 'notifications', 'document_templates', 'security', 'audit_logs'];

  it('super/hr_admin 은 P0 4탭 편집 가능', () => {
    for (const tab of P0) {
      expect(canEdit('tenant_super', tab)).toBe(true);
      expect(canEdit('tenant_hr_admin', tab)).toBe(true);
    }
  });
  it('미구현 탭은 누구도 편집 불가(implemented=false)', () => {
    for (const tab of NON_P0) {
      expect(canEdit('tenant_super', tab)).toBe(false);
      expect(canEdit('tenant_hr_admin', tab)).toBe(false);
    }
  });
  it('manager/employee 는 편집 불가', () => {
    for (const tab of P0) {
      expect(canEdit('tenant_manager', tab)).toBe(false);
      expect(canEdit('employee', tab)).toBe(false);
    }
  });
});

describe('canRead — 역할별 조회 권한 (최소권한)', () => {
  it('super 는 전탭 조회', () => {
    for (const tab of SETTING_TABS) expect(canRead('tenant_super', tab)).toBe(true);
  });
  it('hr_admin 은 security/roles 제외 조회(audit 포함)', () => {
    for (const tab of SETTING_TABS) {
      const expected = tab !== 'security' && tab !== 'roles';
      expect(canRead('tenant_hr_admin', tab)).toBe(expected);
    }
    expect(canRead('tenant_hr_admin', 'security')).toBe(false);
    expect(canRead('tenant_hr_admin', 'roles')).toBe(false);
    expect(canRead('tenant_hr_admin', 'audit_logs')).toBe(true);
  });
  it('manager 는 security/roles/audit_logs 제외 조회', () => {
    expect(canRead('tenant_manager', 'company')).toBe(true);
    expect(canRead('tenant_manager', 'security')).toBe(false);
    expect(canRead('tenant_manager', 'roles')).toBe(false);
    expect(canRead('tenant_manager', 'audit_logs')).toBe(false);
  });
  it('알 수 없는/직원 역할은 조회 불가', () => {
    for (const tab of SETTING_TABS) {
      expect(canRead('employee', tab)).toBe(false);
      expect(canRead('operator_super', tab)).toBe(false);
    }
  });
});

describe('permissionFor — edit > read > none', () => {
  it('super: P0 탭 edit, 미구현 비P0 read', () => {
    expect(permissionFor('tenant_super', 'company')).toBe('edit');
    expect(permissionFor('tenant_super', 'security')).toBe('read'); // 미구현 PATCH → read
    expect(permissionFor('tenant_super', 'audit_logs')).toBe('read');
  });
  it('hr_admin: P0 탭 edit, security/roles none', () => {
    expect(permissionFor('tenant_hr_admin', 'work_policy')).toBe('edit');
    expect(permissionFor('tenant_hr_admin', 'security')).toBe('none');
    expect(permissionFor('tenant_hr_admin', 'roles')).toBe('none');
    expect(permissionFor('tenant_hr_admin', 'notifications')).toBe('read'); // 조회 가능, 편집 미구현
  });
  it('manager: P0 탭도 read(편집 불가)', () => {
    expect(permissionFor('tenant_manager', 'company')).toBe('read');
    expect(permissionFor('tenant_manager', 'security')).toBe('none');
  });
});
