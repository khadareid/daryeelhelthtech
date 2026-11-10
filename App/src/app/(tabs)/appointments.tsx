import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { PayInvoiceSheet } from '@/components/pay-invoice-sheet';
import { Screen } from '@/components/screen';
import { CardListSkeleton } from '@/components/skeleton';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  cancelHealthcareAppointment,
  getMyDoctorRequest,
  isHealthcareAppointment,
  listAppointmentsRequest,
  listHealthcareAppointments,
  listHealthcareOpdTickets,
  listPaymentsRequest,
  payBookingInvoiceRequest,
  updateAppointmentRequest,
  type AppointmentItem,
  type DoctorMe,
  type HealthcareOpdTicket,
  type PaymentItem,
} from '@/lib/api';
import { enumLabel } from '@/lib/enums';
import { localPayLabel, type InvoiceDraft } from '@/lib/payments';

const TABS = ['Upcoming', 'Past', 'All'] as const;

const DOCTOR_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'REJECTED',
  'NO_SHOW',
] as const;

type ApptRow = {
  id: string;
  title: string;
  when: string;
  status: string;
  detail?: string;
  isPast: boolean;
  rawStatus: string;
  feeLabel: string;
  needsPay: boolean;
  isHealthcare: boolean;
  opdLabel?: string;
  raw: AppointmentItem;
};

function feeOf(a: AppointmentItem) {
  const amount = Number(a.consultationFee || 0);
  if (!a.paymentRequired || amount <= 0) return 'Free';
  return `${a.currency || 'USD'} ${amount.toFixed(2)}`;
}

function mergeAppointments(
  healthcare: AppointmentItem[],
  local: AppointmentItem[],
) {
  const seen = new Set(healthcare.map((a) => a.id));
  return [...healthcare, ...local.filter((a) => !seen.has(a.id))];
}

export default function AppointmentsScreen() {
  const { accessToken, isAuthenticated, refreshProfile, user } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Upcoming');
  const [mode, setMode] = useState<'patient' | 'doctor'>('patient');
  const [doctor, setDoctor] = useState<DoctorMe | null>(null);
  const [remote, setRemote] = useState<AppointmentItem[]>([]);
  const [opdTickets, setOpdTickets] = useState<HealthcareOpdTicket[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<InvoiceDraft | null>(null);
  const [paying, setPaying] = useState(false);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(
    String(user?.role || '').toUpperCase(),
  );

  const loadRemote = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setRemote([]);
      setDoctor(null);
      setOpdTickets([]);
      setLoading(false);
      return;
    }
    try {
      const me = await getMyDoctorRequest(accessToken);
      setDoctor(me);
      const asDoctor = Boolean(me?.id) && mode === 'doctor';

      if (asDoctor) {
        const [rows, pays] = await Promise.all([
          listAppointmentsRequest(accessToken, { as: 'doctor' }),
          listPaymentsRequest(accessToken).catch(() => [] as PaymentItem[]),
        ]);
        setRemote(rows);
        setPayments(pays);
        setOpdTickets([]);
      } else {
        // Prefer Healthtech /healthcare/appointments for patient hospital bookings
        const [healthcare, local, pays, tickets] = await Promise.all([
          listHealthcareAppointments(accessToken).catch(
            () => [] as AppointmentItem[],
          ),
          listAppointmentsRequest(accessToken).catch(
            () => [] as AppointmentItem[],
          ),
          listPaymentsRequest(accessToken).catch(() => [] as PaymentItem[]),
          listHealthcareOpdTickets(accessToken).catch(
            () => [] as HealthcareOpdTicket[],
          ),
        ]);
        setRemote(mergeAppointments(healthcare, local));
        setPayments(pays);
        setOpdTickets(tickets);
      }
    } catch {
      setRemote([]);
      setPayments([]);
      setOpdTickets([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, mode]);

  useEffect(() => {
    loadRemote();
  }, [loadRemote]);

  useEffect(() => {
    if (doctor?.id) setMode('doctor');
  }, [doctor?.id]);

  const opdByAppointment = useMemo(() => {
    const map = new Map<string, string>();
    for (const ticket of opdTickets) {
      const key = ticket.appointmentId || ticket.externalAppointmentId;
      if (key && ticket.ticketNumber) map.set(key, ticket.ticketNumber);
    }
    return map;
  }, [opdTickets]);

  const appointments = useMemo(() => {
    const now = Date.now();
    const terminal = new Set(['COMPLETED', 'CANCELLED', 'NO_SHOW', 'REJECTED']);

    const rows: ApptRow[] = remote.map((item) => {
      const time = new Date(item.scheduledAt).getTime();
      const past = time < now || terminal.has(item.status);
      const healthcare = isHealthcareAppointment(item);
      const title =
        mode === 'doctor'
          ? item.user?.fullName || item.appointmentCode || 'Patient'
          : item.doctor?.fullName ||
            item.doctorName ||
            item.appointmentCode ||
            'Visit';
      const needsPay =
        mode === 'patient' &&
        !healthcare &&
        Boolean(item.paymentRequired) &&
        Number(item.consultationFee || 0) > 0 &&
        !['PAID', 'REFUNDED'].includes(String(item.paymentStatus || ''));
      const opd =
        item.externalTicketNumber ||
        opdByAppointment.get(item.id) ||
        (item.externalAppointmentId
          ? opdByAppointment.get(item.externalAppointmentId)
          : undefined);
      return {
        id: item.id,
        title,
        when: new Date(item.scheduledAt).toLocaleString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
        status: enumLabel(item.status),
        rawStatus: item.status,
        detail:
          item.reason ||
          item.doctor?.specialty ||
          item.specialty ||
          item.facilityName ||
          item.doctor?.clinicName ||
          item.department ||
          undefined,
        isPast: past,
        feeLabel: feeOf(item),
        needsPay,
        isHealthcare: healthcare,
        opdLabel: opd || undefined,
        raw: item,
      };
    });

    if (tab === 'Upcoming') return rows.filter((item) => !item.isPast);
    if (tab === 'Past') return rows.filter((item) => item.isPast);
    return rows;
  }, [remote, tab, mode, opdByAppointment]);

  const setStatus = async (id: string, status: string) => {
    if (!accessToken) return;
    const row = remote.find((item) => item.id === id);
    setBusyId(id);
    try {
      if (
        status === 'CANCELLED' &&
        row &&
        isHealthcareAppointment(row) &&
        mode === 'patient'
      ) {
        await cancelHealthcareAppointment(id, accessToken);
      } else {
        await updateAppointmentRequest(id, { status }, accessToken);
      }
      await loadRemote();
    } catch {
      Alert.alert('Update failed', 'Could not update this visit.');
    } finally {
      setBusyId(null);
    }
  };

  const openPayInvoice = (item: ApptRow) => {
    const a = item.raw;
    const pendingPay = payments.find(
      (p) =>
        p.appointmentId === a.id &&
        ['PENDING', 'FAILED', 'PROCESSING'].includes(String(p.status || '')),
    );
    setInvoice({
      appointmentId: a.id,
      paymentId: pendingPay?.id,
      appointmentCode: a.appointmentCode,
      doctorName: a.doctor?.fullName || a.doctorName || 'Doctor',
      patientName: a.user?.fullName || undefined,
      scheduledAt: a.scheduledAt,
      amount: Number(a.consultationFee || pendingPay?.amount || 0),
      currency: a.currency || pendingPay?.currency || 'USD',
      reason: a.reason,
    });
  };

  return (
    <Screen
      onRefresh={async () => {
        await Promise.all([refreshProfile(), loadRemote()]);
      }}
      headerTitle="Visits">
      <View>
        <Text style={styles.title}>Visits</Text>
        <Text style={styles.subtitle}>
          Hospital bookings use Healthtech confirmation and OPD. Local doctors
          may need payment after booking.
        </Text>
      </View>

      {mode === 'patient' ? (
        <Pressable
          onPress={() => router.push('/healthcare' as Href)}
          style={styles.hospitalCta}>
          <Text style={styles.hospitalCtaText}>Book a hospital visit</Text>
        </Pressable>
      ) : null}

      {doctor ? (
        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setMode('doctor')}
            style={[styles.modeChip, mode === 'doctor' && styles.modeChipOn]}>
            <Text
              style={[
                styles.modeText,
                mode === 'doctor' && styles.modeTextOn,
              ]}>
              Doctor inbox
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('patient')}
            style={[styles.modeChip, mode === 'patient' && styles.modeChipOn]}>
            <Text
              style={[
                styles.modeText,
                mode === 'patient' && styles.modeTextOn,
              ]}>
              My bookings
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.tabs}>
        {TABS.map((item) => {
          const active = item === tab;
          return (
            <Pressable
              key={item}
              onPress={() => setTab(item)}
              style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.list}>
        {loading && remote.length === 0 ? <CardListSkeleton rows={4} /> : null}
        {appointments.map((item) => {
          const pending = ['PENDING', 'RESCHEDULE_REQUESTED', 'ACCEPTED'].includes(
            item.rawStatus,
          );
          const canManage =
            (mode === 'doctor' || isAdmin) && !item.isHealthcare;
          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.doctor}>{item.title}</Text>
                <Text style={styles.status}>{item.status}</Text>
              </View>
              <Text style={styles.when}>{item.when}</Text>
              {item.isHealthcare ? (
                <Text style={styles.hospitalBadge}>Hospital booking</Text>
              ) : null}
              <View style={styles.payRow}>
                <Text style={styles.fee}>{item.feeLabel}</Text>
                {item.isHealthcare ? (
                  <Text style={[styles.payBadge, styles.payBadgePaid]}>
                    Hospital confirms
                  </Text>
                ) : (
                  <Text
                    style={[
                      styles.payBadge,
                      String(item.raw.paymentStatus).toUpperCase() === 'PAID' ||
                      item.feeLabel === 'Free'
                        ? styles.payBadgePaid
                        : styles.payBadgePending,
                    ]}>
                    {item.feeLabel === 'Free'
                      ? 'Free · Paid'
                      : enumLabel(String(item.raw.paymentStatus || 'PENDING'))}
                  </Text>
                )}
              </View>
              {item.opdLabel ? (
                <Text style={styles.opd}>OPD · {item.opdLabel}</Text>
              ) : item.isHealthcare ? (
                <Text style={styles.opdPending}>
                  OPD ticket after hospital confirms
                </Text>
              ) : null}
              {item.detail ? (
                <Text style={styles.reason}>{item.detail}</Text>
              ) : null}

              {canManage ? (
                <View style={styles.statusRow}>
                  {DOCTOR_STATUSES.map((s) => (
                    <Pressable
                      key={s}
                      disabled={busyId === item.id || item.rawStatus === s}
                      onPress={() => setStatus(item.id, s)}
                      style={[
                        styles.statusChip,
                        item.rawStatus === s && styles.statusChipOn,
                      ]}>
                      <Text
                        style={[
                          styles.statusChipText,
                          item.rawStatus === s && styles.statusChipTextOn,
                        ]}>
                        {s.replace(/_/g, ' ')}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <View style={styles.actions}>
                {mode === 'doctor' && pending && !item.isHealthcare ? (
                  <Pressable
                    disabled={busyId === item.id}
                    onPress={() => setStatus(item.id, 'CONFIRMED')}
                    style={[styles.actionBtn, styles.confirmBtn]}>
                    <Text style={styles.confirmText}>Confirm</Text>
                  </Pressable>
                ) : null}
                {item.needsPay ? (
                  <Pressable
                    disabled={busyId === item.id || paying}
                    onPress={() => openPayInvoice(item)}
                    style={[styles.actionBtn, styles.confirmBtn]}>
                    <Text style={styles.confirmText}>Pay {item.feeLabel}</Text>
                  </Pressable>
                ) : null}
                {mode === 'patient' &&
                !['CANCELLED', 'COMPLETED', 'REJECTED'].includes(
                  item.rawStatus,
                ) ? (
                  <Pressable
                    disabled={busyId === item.id}
                    onPress={() => setStatus(item.id, 'CANCELLED')}
                    style={[styles.actionBtn, styles.declineBtn]}>
                    <Text style={styles.declineText}>Cancel</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        })}

        {!loading && appointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No visits in this tab</Text>
            <Text style={styles.emptyText}>
              Book a hospital from Hospitals, or a clinician from Doctors.
            </Text>
            <Pressable
              onPress={() => router.push('/healthcare' as Href)}
              style={[styles.actionBtn, styles.confirmBtn, { marginTop: 8 }]}>
              <Text style={styles.confirmText}>Browse hospitals</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <PayInvoiceSheet
        open={Boolean(invoice)}
        invoice={invoice}
        busy={paying}
        onClose={() => setInvoice(null)}
        onPay={async ({ method, provider, phone }) => {
          if (!accessToken || !invoice?.appointmentId) return;
          setPaying(true);
          try {
            const paid = await payBookingInvoiceRequest(
              {
                appointmentId: invoice.appointmentId,
                paymentId: invoice.paymentId,
                amount: invoice.amount,
                currency: invoice.currency,
                method,
                provider,
                transactionId: phone,
              },
              accessToken,
            );
            setInvoice(null);
            await loadRemote();
            Alert.alert(
              'Payment complete',
              `Paid with ${localPayLabel(provider, method)}.\nStatus: ${enumLabel(String(paid.status || 'PAID'))}\nYour booking is marked Paid.`,
              [{ text: 'My visits' }],
            );
          } catch (error) {
            Alert.alert(
              'Payment failed',
              error instanceof Error
                ? error.message
                : 'Could not complete payment.',
            );
          } finally {
            setPaying(false);
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  payBadge: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  payBadgePaid: {
    color: Brand.success,
    backgroundColor: '#ECFDF5',
  },
  payBadgePending: {
    color: '#B45309',
    backgroundColor: '#FFFBEB',
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    color: Brand.dark,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Brand.muted,
    marginTop: 4,
  },
  hospitalCta: {
    alignSelf: 'flex-start',
    backgroundColor: Brand.light,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  hospitalCtaText: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Brand.primary,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeChip: {
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modeChipOn: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  modeText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Brand.muted,
  },
  modeTextOn: {
    color: Brand.white,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Brand.white,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  tabActive: {
    backgroundColor: Brand.primary,
  },
  tabText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Brand.muted,
  },
  tabTextActive: {
    color: Brand.white,
  },
  list: {
    gap: Spacing.three,
  },
  card: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.four,
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  doctor: {
    flex: 1,
    fontFamily: Fonts.semibold,
    fontSize: 16,
    color: Brand.dark,
  },
  status: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Brand.primary,
    backgroundColor: Brand.light,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  when: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Brand.muted,
  },
  hospitalBadge: {
    alignSelf: 'flex-start',
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Brand.dark,
    backgroundColor: Brand.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fee: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Brand.dark,
  },
  opd: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Brand.primary,
  },
  opdPending: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Brand.muted,
  },
  reason: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Brand.dark,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  statusChip: {
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Brand.bg,
  },
  statusChipOn: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  statusChipText: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: Brand.muted,
  },
  statusChipTextOn: {
    color: Brand.white,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  actionBtn: {
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  confirmBtn: {
    backgroundColor: Brand.primary,
  },
  confirmText: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Brand.white,
  },
  declineBtn: {
    backgroundColor: Brand.light,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  declineText: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Brand.dark,
  },
  emptyCard: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.four,
    gap: 6,
  },
  emptyTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    color: Brand.dark,
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Brand.muted,
    lineHeight: 18,
  },
});
