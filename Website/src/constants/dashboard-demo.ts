export { HEALTH_NEWS as DEMO_NEWS } from './health-news'

export const DEMO_APPOINTMENTS = [
  {
    id: 'a1',
    doctorName: 'Dr. Ayaan Warsame',
    specialty: 'Cardiologist',
    hospital: 'Daryeel Central Hospital',
    when: 'Tue, 7 Oct · 10:30 AM',
    status: 'Confirmed',
  },
  {
    id: 'a2',
    doctorName: 'Dr. Hodo Ali',
    specialty: 'Pediatrician',
    hospital: 'Gabiley Family Clinic',
    when: 'Fri, 10 Oct · 09:00 AM',
    status: 'Pending',
  },
]

export const DEMO_PHARMACIES = [
  {
    id: 'p1',
    name: 'Hodan Community Pharmacy',
    city: 'Hargeisa',
    distanceKm: 1.2,
    openNow: true,
    delivery: true,
  },
  {
    id: 'p2',
    name: 'Borama Care Pharmacy',
    city: 'Borama',
    distanceKm: 0.8,
    openNow: true,
    delivery: false,
  },
  {
    id: 'p3',
    name: 'Gabiley Family Dispensary',
    city: 'Gabiley',
    distanceKm: 2.4,
    openNow: false,
    delivery: true,
  },
]

export const DEMO_PRESCRIPTIONS = [
  {
    id: 'rx1',
    medicine: 'Amlodipine 5mg',
    dosage: '1 tablet daily',
    instructions: 'Take in the morning with water',
    doctor: 'Dr. Ayaan Warsame',
    status: 'Active',
  },
  {
    id: 'rx2',
    medicine: 'Vitamin D3 1000 IU',
    dosage: '1 capsule daily',
    instructions: 'After breakfast',
    doctor: 'Dr. Mohamed Hassan',
    status: 'Active',
  },
]

export const DEMO_LAB_ORDERS = [
  {
    id: 'lab1',
    testName: 'Complete Blood Count (CBC)',
    lab: 'Borama Diagnostics Hub',
    status: 'Ready',
    orderedAt: '2026-10-01',
  },
  {
    id: 'lab2',
    testName: 'Fasting Blood Glucose',
    lab: 'Daryeel Central Hospital',
    status: 'Processing',
    orderedAt: '2026-10-04',
  },
]

export const HEALTH_SERVICES = [
  {
    id: 's1',
    title: 'Doctors',
    desc: 'Book trusted clinicians near you',
    to: '/dashboard?section=doctors',
  },
  {
    id: 's2',
    title: 'Hospitals & Clinics',
    desc: 'Find care facilities across cities',
    to: '/hospitals',
  },
  {
    id: 's3',
    title: 'Health Daily',
    desc: 'Track steps, water, sleep & vitals',
    to: '/dashboard?section=health',
  },
  {
    id: 's4',
    title: 'Appointments',
    desc: 'Upcoming and past visits',
    to: '/dashboard?section=appointments',
  },
]
