export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  type: 'appointment' | 'lab' | 'prescription' | 'system';
};

export const DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Appointment confirmed',
    body: 'Dr. Ayaan Warsame · Tue 7 Oct at 10:30 AM',
    time: '2h ago',
    unread: true,
    type: 'appointment',
  },
  {
    id: 'n2',
    title: 'Lab result ready',
    body: 'Complete Blood Count is available to review',
    time: 'Yesterday',
    unread: true,
    type: 'lab',
  },
  {
    id: 'n3',
    title: 'Prescription refill',
    body: 'Amlodipine 5mg can be refilled at Daryeel Pharmacy',
    time: '2 days ago',
    unread: true,
    type: 'prescription',
  },
  {
    id: 'n4',
    title: 'Health tip',
    body: 'Drink water regularly during the afternoon heat',
    time: '3 days ago',
    unread: false,
    type: 'system',
  },
];

export const UNREAD_NOTIFICATION_COUNT = DEMO_NOTIFICATIONS.filter(
  (item) => item.unread,
).length;
