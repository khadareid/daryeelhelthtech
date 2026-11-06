import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { PayInvoiceSheet } from '@/components/pay-invoice-sheet';
import { Screen } from '@/components/screen';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  createPaymentRequest,
  listAppointmentsRequest,
  listPaymentsRequest,
  updatePaymentRequest,
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

export default function PaymentsScreen() {
  const { accessToken } = useAuth();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [unpaid, setUnpaid] = useState<AppointmentItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceDraft | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [pays, appts] = await Promise.all([
        listPaymentsRequest(accessToken),
        listAppointmentsRequest(accessToken),
      ]);
      setPayments(pays);
      setUnpaid(
        appts.filter(
          (a) =>
            a.paymentRequired &&
            Number(a.consultationFee || 0) > 0 &&
            !['PAID', 'REFUNDED'].includes(String(a.paymentStatus || '')),
        ),
      );
    } catch {
      setPayments([]);
      setUnpaid([]);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const openFromAppt = (a: AppointmentItem) => {
    setInvoice({
      appointmentId: a.id,
      appointmentCode: a.appointmentCode,
      doctorName: a.doctor?.fullName || 'Doctor',
      scheduledAt: a.scheduledAt,
      amount: Number(a.consultationFee || 0),
      currency: a.currency || 'USD',
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

  return (
    <Screen onRefresh={load} header={false} contentStyle={{ paddingTop: Spacing.three }}>
      <Text style={styles.title}>Payments</Text>
      <Text style={styles.sub}>
        Free when doctor fee is $0. Pay with Zaad, eDahab, Sahal — invoice shows
        before you pay.
      </Text>

      <View style={styles.infoRow}>
        <View style={[styles.infoCard, styles.freeCard]}>
          <Text style={styles.infoTitle}>Free</Text>
          <Text style={styles.infoText}>
            Doctor consultation fee empty or $0 → automatic Free / Paid.
          </Text>
        </View>
        <View style={[styles.infoCard, styles.paidCard]}>
          <Text style={styles.infoTitle}>Local money</Text>
          <Text style={styles.infoText}>
            Pay now opens invoice — Zaad, eDahab, Sahal, EVC, cash, bank, card.
          </Text>
        </View>
      </View>

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
                {new Date(a.scheduledAt).toLocaleString()}
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

      <Text style={styles.sectionTitle}>History</Text>
      {payments.length === 0 ? (
        <Text style={styles.empty}>No payments yet.</Text>
      ) : (
        payments.map((p) => {
          const amount = Number(p.amount || 0);
          const isFree = amount <= 0 || p.provider === 'FREE';
          const pending = p.status === 'PENDING' && !isFree;
          return (
            <View key={p.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.name}>
                  {p.paymentReference || p.id.slice(0, 10)}
                </Text>
                <Text style={styles.badge}>{enumLabel(p.status)}</Text>
              </View>
              <Text style={styles.meta}>
                {isFree
                  ? 'Free'
                  : feeLabel(p.amount, p.currency)}{' '}
                ·{' '}
                {isFree
                  ? 'Free'
                  : localPayLabel(p.provider, String(p.method || ''))}{' '}
                ·{' '}
                {p.appointment?.appointmentCode ||
                  p.appointment?.doctor?.fullName ||
                  'Visit'}
              </Text>
              {pending ? (
                <Pressable
                  disabled={busy}
                  onPress={() => openFromPayment(p)}
                  style={styles.payBtn}>
                  <Text style={styles.payText}>Pay now</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })
      )}

      <PayInvoiceSheet
        open={Boolean(invoice)}
        invoice={invoice}
        busy={busy}
        onClose={() => setInvoice(null)}
        onPay={async ({ method, provider, phone }) => {
          if (!accessToken || !invoice) return;
          setBusy(true);
          try {
            if (invoice.paymentId) {
              await updatePaymentRequest(
                invoice.paymentId,
                {
                  status: 'PAID',
                  method,
                  provider,
                  transactionId: phone,
                },
                accessToken,
              );
            } else {
              await createPaymentRequest(
                {
                  appointmentId: invoice.appointmentId,
                  amount: invoice.amount,
                  currency: invoice.currency,
                  method,
                  status: 'PAID',
                  provider,
                  transactionId: phone,
                },
                accessToken,
              );
            }
            setInvoice(null);
            await load();
            Alert.alert('Paid', `Paid with ${localPayLabel(provider, method)}`);
          } catch {
            Alert.alert('Payment failed');
          } finally {
            setBusy(false);
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: Fonts.bold, fontSize: 24, color: Brand.dark },
  sub: { fontFamily: Fonts.regular, fontSize: 13, color: Brand.muted },
  infoRow: { flexDirection: 'row', gap: 8 },
  infoCard: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 4,
  },
  freeCard: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  paidCard: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  infoTitle: { fontFamily: Fonts.semibold, fontSize: 13, color: Brand.dark },
  infoText: { fontFamily: Fonts.regular, fontSize: 11, color: Brand.muted, lineHeight: 15 },
  section: { gap: Spacing.two },
  sectionTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: Brand.dark,
    marginTop: 4,
  },
  empty: { fontFamily: Fonts.regular, fontSize: 13, color: Brand.muted },
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
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Brand.primary,
    backgroundColor: Brand.light,
    overflow: 'hidden',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  payBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Brand.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 4,
  },
  payText: { fontFamily: Fonts.semibold, fontSize: 13, color: Brand.white },
});
