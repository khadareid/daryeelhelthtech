export const ROLES = [
  'SUPER_ADMIN',
  'TENANT_ADMIN',
  'BRANCH_ADMIN',
  'DOCTOR',
  'NURSE',
  'MIDWIFE',
  'LAB_TECH',
  'PHARMACIST',
  'RECEPTIONIST',
  'PATIENT',
    'USER'
] as const;

export type Role = (typeof ROLES)[number];
export const USER: Role[] = ['USER'];
export const PATIENT_ROLES: Role[] = ['PATIENT'];
export const PROVIDER_ROLES: Role[] = ['DOCTOR', 'NURSE', 'MIDWIFE'];
export const TENANT_ROLES: Role[] = ['TENANT_ADMIN', 'BRANCH_ADMIN', 'RECEPTIONIST', 'LAB_TECH', 'PHARMACIST'];
export const ADMIN_ROLES: Role[] = ['SUPER_ADMIN'];
