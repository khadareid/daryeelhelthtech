import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { PayInvoiceSheet } from '@/components/pay-invoice-sheet';
import {
  PaymentReceiptSheet,
  printPaymentReceipt,
} from '@/components/payment-receipt-sheet';
import { Screen } from '@/components/screen';
import { CardListSkeleton } from '@/components/skeleton';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  listAppointmentsRequest,
  listPaymentsRequest,
  payBookingInvoiceRequest,
  type AppointmentItem,
  type PaymentItem,
} from '@/lib/api';
import { enumLabel } from '@/lib/enums';
import { localPayLabel, type InvoiceDraft } from '@/lib/payments';

function feeLabel(amount: number | string | null | undefined, currency?: string) {
  const n = Number(amount || 0);
  if (n <= 0) return 'Free';
  return `${currency || 'USD'} ${n.toFixed(2)}`;
}

function statusTone(status: string, isFree: boolean) {
  const s = String(status || '').toUpperCase();
  if (isFree || s === 'PAID') return 'paid';
  if (s === 'PENDING' || s === 'PROCESSING') return 'pending';
  if (s === 'FAILED') return 'failed';
  return 'neutral';
}

function paymentRows(payments: PaymentItem[]) {
  return payments.map((p) => {
    const amount = Number(p.amount || 0);
    const isFree = amount <= 0 || p.provider === 'FREE';
    return {
      reference: p.paymentReference || p.id.slice(0, 10),
      doctor:
        p.appointment?.doctor?.fullName ||
        p.appointment?.appointmentCode ||
        'Visit',
      code: p.appointment?.appointmentCode || '—',
      amount: isFree ? 'Free ($0)' : feeLabel(p.amount, p.currency),
      method: isFree
        ? 'Free'
        : localPayLabel(p.provider, String(p.method || '')),
      status: isFree ? 'Free · Paid' : enumLabel(p.status),
      when: p.createdAt ? new Date(p.createdAt).toLocaleString() : '—',
      isFree,
      pending:
        ['PENDING', 'PROCESSING', 'FAILED'].includes(String(p.status)) &&
        !isFree,
      raw: p,
    };
  });
}

function buildCsv(payments: PaymentItem[]) {
  const header = [
    'Reference',
    'Doctor',
    'Visit code',
    'Amount',
    'Method',
    'Status',
    'Date',
  ];
  const rows = paymentRows(payments).map((r) =>
    [r.reference, r.doctor, r.code, r.amount, r.method, r.status, r.when]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(','),
  );
  return [header.join(','), ...rows].join('\n');
}

export default function PaymentsScreen() {
  const { accessToken } = useAuth();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceDraft | null>(null);
  const [receipt, setReceipt] = useState<PaymentItem | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    try {
      const [pays, appts] = await Promise.all([
        listPaymentsRequest(accessToken),
        listAppointmentsRequest(accessToken),
      ]);
      setPayments(pays);
      setAppointments(appts);
    } catch {
      setPayments([]);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const unpaid = useMemo(
    () =>
      appointments.filter(
        (a) =>
          a.paymentRequired &&
          Number(a.consultationFee || 0) > 0 &&
          !['PAID', 'REFUNDED'].includes(String(a.paymentStatus || '')),
      ),
    [appointments],
  );

  const rows = useMemo(() => paymentRows(payments), [payments]);

  const pendingByAppointment = useMemo(() => {
    const map = new Map<string, PaymentItem>();
    for (const p of payments) {
      if (
        p.appointmentId &&
        ['PENDING', 'FAILED', 'PROCESSING'].includes(String(p.status || ''))
      ) {
        map.set(p.appointmentId, p);
      }
    }
    return map;
  }, [payments]);

  const openFromAppt = (a: AppointmentItem) => {
    const pending = pendingByAppointment.get(a.id);
    setInvoice({
      appointmentId: a.id,
      paymentId: pending?.id,
      appointmentCode: a.appointmentCode,
      doctorName: a.doctor?.fullName || 'Doctor',
      scheduledAt: a.scheduledAt,
      amount: Number(a.consultationFee || pending?.amount || 0),
      currency: a.currency || pending?.currency || 'USD',
      reason: a.reason,
    });
  };

  const openFromPayment = (p: PaymentItem) => {
    setInvoice({
      appointmentId: p.appointmentId || p.appointment?.id || '',
      paymentId: p.id,
      appointmentCode: p.appointment?.appointmentCode,
      doctorName: p.appointment?.doctor?.fullName || 'Doctor',
      scheduledAt: p.appointment?.scheduledAt,
      amount: Number(p.amount || 0),
      currency: p.currency || 'USD',
      reason: p.appointment?.reason,
    });
  };

  const onExport = async () => {
    if (payments.length === 0) {
      Alert.alert('Nothing to export', 'No payment history yet.');
      return;
    }
    try {
      await Share.share({
        title: 'Daryeel payments.csv',
        message: buildCsv(payments),
      });
    } catch {
      Alert.alert('Export failed', 'Could not share the CSV file.');
    }
  };

  const onPay = async ({
    method,
    provider,
    phone,
  }: {
    method: string;
    provider: string;
    phone?: string;
  }) => {
    if (!accessToken || !invoice?.appointmentId) {
      Alert.alert('Payment failed', 'Missing booking invoice.');
      return;
    }
    setBusy(true);
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
      await load();
      Alert.alert(
        'Payment complete',
        `Paid with ${localPayLabel(provider, method)}.\nStatus: ${enumLabel(String(paid.status || 'PAID'))}\nYour booking is marked Paid.`,
        [
          {
            text: 'My visits',
            onPress: () => router.push('/(tabs)/appointments' as Href),
          },
          { text: 'View & Print', onPress: () => setReceipt(paid) },
          { text: 'OK' },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Payment failed',
        error instanceof Error ? error.message : 'Could not complete payment.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen onRefresh={load} header={false}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Payments</Text>
        <Pressable
          onPress={onExport}
          style={styles.actionBtn}
          accessibilityLabel="Export payments">
          <Ionicons name="download-outline" size={18} color={Brand.primary} />
          <Text style={styles.actionText}>Export</Text>
        </Pressable>
      </View>

      {loading ? <CardListSkeleton rows={3} /> : null}

      {!loading ? (
        <>
          {unpaid.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Awaiting payment</Text>
              {unpaid.map((a) => (
                <View key={a.id} style={styles.card}>
                  <Text style={styles.name}>
                    {a.doctor?.fullName || a.appointmentCode || 'Visit'}
                  </Text>
                  <Text style={styles.meta}>
                    {feeLabel(a.consultationFee, a.currency || undefined)} ·{' '}
                    {a.appointmentCode || 'Booking'} ·{' '}
                    {new Date(a.scheduledAt).toLocaleString()}
                  </Text>
                  <Text style={[styles.badge, styles.badgePending]}>
                    {enumLabel(String(a.paymentStatus || 'PENDING'))}
                  </Text>
                  <Pressable
                    disabled={busy}
                    onPress={() => openFromAppt(a)}
                    style={styles.payBtn}>
                    <Text style={styles.payText}>View invoice · Pay</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>
            Payment list · {payments.length}
          </Text>

          {rows.length === 0 ? (
            <View style={[styles.card, styles.emptyCard]}>
              <Text style={styles.name}>No payments yet</Text>
              <Text style={styles.meta}>
                Book a visit to see free or paid invoices here.
              </Text>
            </View>
          ) : (
            rows.map((r) => {
              const tone = statusTone(String(r.raw.status), r.isFree);
              return (
                <View key={r.raw.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.name}>{r.doctor}</Text>
                    <Text
                      style={[
                        styles.badge,
                        tone === 'paid' && styles.badgePaid,
                        tone === 'pending' && styles.badgePending,
                        tone === 'failed' && styles.badgeFailed,
                      ]}>
                      {r.status}
                    </Text>
                  </View>
                  <Text style={styles.meta}>
                    {r.amount} · {r.method}
                  </Text>
                  <Text style={styles.meta}>
                    Ref {r.reference} · Visit {r.code}
                  </Text>
                  <Text style={styles.meta}>{r.when}</Text>

                  <View style={styles.rowActions}>
                    <Pressable
                      onPress={() => setReceipt(r.raw)}
                      style={styles.ghostBtn}>
                      <Ionicons
                        name="eye-outline"
                        size={16}
                        color={Brand.primary}
                      />
                      <Text style={styles.ghostText}>View</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        void printPaymentReceipt(r.raw);
                      }}
                      style={styles.ghostBtn}>
                      <Ionicons
                        name="print-outline"
                        size={16}
                        color={Brand.primary}
                      />
                      <Text style={styles.ghostText}>Print</Text>
                    </Pressable>
                    {r.pending ? (
                      <Pressable
                        disabled={busy}
                        onPress={() => openFromPayment(r.raw)}
                        style={styles.payBtn}>
                        <Text style={styles.payText}>Pay now</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </>
      ) : null}

      <PayInvoiceSheet
        open={Boolean(invoice)}
        invoice={invoice}
        busy={busy}
        onClose={() => setInvoice(null)}
        onPay={onPay}
      />

      <PaymentReceiptSheet
        open={Boolean(receipt)}
        payment={receipt}
        onClose={() => setReceipt(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  title: { fontFamily: Fonts.bold, fontSize: 24, color: Brand.dark, flex: 1 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Brand.light,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  actionText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Brand.primary,
  },
  section: { gap: Spacing.two },
  sectionTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: Brand.dark,
    marginTop: 4,
  },
  emptyCard: { backgroundColor: Brand.light },
  card: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
    gap: 6,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontFamily: Fonts.semibold, fontSize: 15, color: Brand.dark },
  meta: { fontFamily: Fonts.regular, fontSize: 12, color: Brand.muted },
  badge: {
    alignSelf: 'flex-start',
    fontFamily: Fonts.semibold,
    fontSize: 11,
    overflow: 'hidden',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: Brand.primary,
    backgroundColor: Brand.light,
  },
  badgePaid: { color: Brand.success, backgroundColor: '#ECFDF5' },
  badgePending: { color: '#B45309', backgroundColor: '#FFFBEB' },
  badgeFailed: { color: Brand.danger, backgroundColor: '#FEF2F2' },
  rowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.light,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  ghostText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Brand.primary,
  },
  payBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Brand.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  payText: { fontFamily: Fonts.semibold, fontSize: 13, color: Brand.white },
});
