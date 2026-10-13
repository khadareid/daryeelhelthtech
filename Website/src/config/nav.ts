export type NavItem = {
  title: string;
  href: string;
  roles?: string[];
};

export const publicNav: NavItem[] = [
  { title: 'Home', href: '/' },
  { title: 'Doctors', href: '/doctors' },
  { title: 'Hospitals', href: '/hospitals' },
  { title: 'Clinics', href: '/clinics' },
  { title: 'Pharmacy', href: '/pharmacy' },
  { title: 'Lab', href: '/lab' },
  { title: 'Pricing', href: '/pricing' },
  { title: 'About', href: '/about' },
  { title: 'Contact', href: '/contact' },
];

export const patientNav: NavItem[] = [
  { title: 'Dashboard', href: '/patient/dashboard' },
  { title: 'Appointments', href: '/patient/appointments' },
  { title: 'Records', href: '/patient/records' },
  { title: 'Prescriptions', href: '/patient/prescriptions' },
  { title: 'Lab results', href: '/patient/lab-results' },
  { title: 'Pregnancy', href: '/patient/pregnancy' },
  { title: 'Wallet', href: '/patient/wallet' },
  { title: 'Consent', href: '/patient/consents' },
  { title: 'Messages', href: '/patient/messages' },
  { title: 'Profile', href: '/patient/profile' },
];

export const providerNav: NavItem[] = [
  { title: 'Dashboard', href: '/provider/dashboard' },
  { title: 'Appointments', href: '/provider/appointments' },
  { title: 'Patients', href: '/provider/patients' },
  { title: 'Encounters', href: '/provider/encounters' },
  { title: 'Prescriptions', href: '/provider/prescriptions' },
  { title: 'Lab orders', href: '/provider/lab-orders' },
  { title: 'Schedule', href: '/provider/schedule' },
  { title: 'Public profile', href: '/provider/public-profile' },
  { title: 'Profile', href: '/provider/profile' },
];

export const tenantNav: NavItem[] = [
  { title: 'Dashboard', href: '/tenant/dashboard' },
  { title: 'Branches', href: '/tenant/branches' },
  { title: 'Staff', href: '/tenant/staff' },
  { title: 'Patients', href: '/tenant/patients' },
  { title: 'Appointments', href: '/tenant/appointments' },
  { title: 'Reports', href: '/tenant/reports' },
  { title: 'Billing', href: '/tenant/billing' },
  { title: 'Settings', href: '/tenant/settings' },
];

export const adminNav: NavItem[] = [
  { title: 'Dashboard', href: '/admin/dashboard' },
  { title: 'Users', href: '/admin/users' },
  { title: 'Plans', href: '/admin/plans' },
  { title: 'Subscriptions', href: '/admin/subscriptions' },
  { title: 'Homepage CMS', href: '/admin/cms' },
  { title: 'Audits', href: '/admin/audits' },
  { title: 'Settings', href: '/admin/settings' },
];
