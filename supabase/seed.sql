-- FlowHR seed (개발/스테이징/CI ephemeral 전용)
-- SSOT: ST-078 약관/동의 — 활성 약관 1쌍(terms/privacy × ko/en)으로 비로그인 조회 + 동의 흐름 검증.
--
-- 주의: 아래 약관 본문은 흐름 검증용 placeholder 다. 실제 법적 효력 본문은 운영사(operator_super)가
--       POST /operator/legal/documents (publishLegalDocuments) 로 게시하여 교체한다.
--       법적 효력은 한글(ko), 영문(en)은 참고 번역 (i18n batch-005, rls.md §6-1).
-- 멱등: unique (type, version, language) 충돌 시 do nothing — 반복 실행/리셋 안전.

insert into legal_documents (type, version, language, effective_date, title, content_md, summary_md, is_active, published_at)
values
  ('terms', '1.0.0', 'ko', '2026-05-01', '이용약관',
   '## 제1조 (목적)
본 약관은 주식회사 플로우(이하 "회사")가 운영하는 FlowHR 서비스(이하 "서비스")를 이용함에 있어 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.

## 제2조 (정의)
"이용자"란 본 약관에 동의하고 서비스를 이용하는 회원을 말합니다. "운영사"란 FlowHR 플랫폼을 운영하는 주체를, "테넌트"란 서비스를 사용하는 고객사 단위를 의미합니다.

## 제3조 (약관의 효력 및 변경)
약관은 시행일로부터 효력을 발생합니다. 약관 변경 시 시행일 7일 전(불리한 변경은 30일 전)에 공지하며, 이용자가 거부 의사 표명 없이 서비스를 계속 이용하는 경우 변경된 약관에 동의한 것으로 간주합니다.

## 제4조 (서비스 제공)
회사는 근태·휴가·결재·문서 관리 기능을 제공하며, 운영상·기술상 필요에 따라 서비스 내용을 변경할 수 있습니다.

## 제5조 (회원가입 및 자격)
이용자는 운영사 또는 테넌트 관리자의 초대를 통해 계정을 활성화하며, 활성화 시 본 약관에 동의하여야 합니다.

## 제6조 (개인정보 보호)
회사는 이용자의 개인정보를 「개인정보 보호법」 및 관련 법령에 따라 보호합니다. 자세한 사항은 개인정보처리방침을 참조해 주세요.

## 제7조 (이용자의 의무)
이용자는 계정 정보를 안전하게 관리하고, 타인의 권리를 침해하거나 법령에 위반되는 행위를 하여서는 안 됩니다.

## 제8조 (서비스 중단 및 해지)
회사는 정기 점검·장애·천재지변 등 불가피한 사유가 있는 경우 서비스 제공을 일시 중단할 수 있습니다.

## 제9조 (책임 제한)
회사는 천재지변, 이용자의 귀책사유로 인한 손해에 대하여 책임을 지지 않습니다.

## 제10조 (준거법 및 관할)
본 약관은 대한민국 법령에 따라 해석되며, 분쟁에 관한 관할은 회사 본점 소재지 관할 법원으로 합니다.',
   '서비스 이용에 관한 회사와 이용자의 권리·의무를 규정합니다.', true, now()),

  ('terms', '1.0.0', 'en', '2026-05-01', 'Terms of Service',
   '## Article 1 (Purpose)
These Terms govern the rights, obligations, and responsibilities between FLOW Inc. (the "Company") and users in connection with the use of the FlowHR service (the "Service").

## Article 2 (Definitions)
"User" means a member who agrees to these Terms and uses the Service. "Operator" means the entity operating the FlowHR platform, and "Tenant" means a customer organization using the Service.

## Article 3 (Effect and Amendment)
These Terms take effect from the effective date. The Company shall give notice 7 days in advance (30 days for unfavorable changes). Continued use without objection is deemed consent to the amended Terms.

## Article 4 (Provision of Service)
The Company provides attendance, leave, approval, and document management features and may change the Service for operational or technical reasons.

## Article 5 (Registration and Eligibility)
Users activate their accounts via invitation from the Operator or a Tenant administrator and must agree to these Terms upon activation.

## Article 6 (Protection of Personal Information)
The Company protects personal information in accordance with the Personal Information Protection Act and related laws. See the Privacy Policy for details.

## Article 7 (User Obligations)
Users must securely manage their account credentials and must not infringe the rights of others or violate applicable laws.

## Article 8 (Suspension and Termination)
The Company may temporarily suspend the Service for scheduled maintenance, failures, or force majeure.

## Article 9 (Limitation of Liability)
The Company is not liable for damages caused by force majeure or reasons attributable to the user.

## Article 10 (Governing Law and Jurisdiction)
These Terms are interpreted under the laws of the Republic of Korea. This is a reference translation; the Korean version prevails legally.',
   'A reference translation of the Korean Terms of Service. The Korean version prevails legally.', true, now()),

  ('privacy', '1.0.0', 'ko', '2026-05-01', '개인정보처리방침',
   '## 1. 수집하는 개인정보 항목
회사는 회원 가입·서비스 이용 과정에서 이메일, 성명, 사번, 부서, 근태·휴가 기록 등을 수집합니다.

## 2. 개인정보의 수집 및 이용 목적
수집한 개인정보는 본인 확인, 근태·휴가·결재 관리, 고객 지원, 법령상 의무 이행을 위해 이용됩니다.

## 3. 개인정보의 보유 및 이용 기간
관련 법령에 따른 보존 의무가 있는 경우를 제외하고, 회원 탈퇴 시 지체 없이 파기합니다.

## 4. 개인정보의 제3자 제공
회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.

## 5. 개인정보 처리의 위탁
회사는 안정적 서비스 제공을 위해 클라우드 인프라 사업자 등에 처리를 위탁할 수 있으며, 위탁 시 관련 사항을 공개합니다.

## 6. 정보주체의 권리
이용자는 자신의 개인정보에 대한 열람·정정·삭제·처리정지를 요구할 수 있습니다.

## 7. 개인정보 보호책임자
개인정보 보호책임자에게 문의하여 권리를 행사할 수 있습니다.',
   '개인정보의 수집·이용·보관·파기에 관한 사항을 안내합니다.', true, now()),

  ('privacy', '1.0.0', 'en', '2026-05-01', 'Privacy Policy',
   '## 1. Personal Information Collected
The Company collects email, name, employee number, department, and attendance/leave records during registration and use of the Service.

## 2. Purpose of Collection and Use
Collected information is used for identity verification, attendance/leave/approval management, customer support, and compliance with legal obligations.

## 3. Retention and Use Period
Except where retention is required by law, personal information is destroyed without delay upon withdrawal of membership.

## 4. Provision to Third Parties
The Company does not provide personal information to third parties without the user''s consent.

## 5. Entrustment of Processing
The Company may entrust processing to cloud infrastructure providers and discloses related matters when doing so.

## 6. Rights of the Data Subject
Users may request access to, correction of, deletion of, or suspension of processing of their personal information.

## 7. Privacy Officer
Users may exercise their rights by contacting the Privacy Officer. This is a reference translation; the Korean version prevails legally.',
   'A reference translation of the Korean Privacy Policy. The Korean version prevails legally.', true, now())
on conflict (type, version, language) do nothing;
