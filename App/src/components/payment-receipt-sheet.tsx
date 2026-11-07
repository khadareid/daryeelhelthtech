import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import type { PaymentItem } from '@/lib/api';
import { enumLabel } from '@/lib/enums';
import { localPayLabel } from '@/lib/payments';

type Props = {
  open: boolean;
  payment: PaymentItem | null;
  onClose: () => void;
};

function receiptFields(payment: PaymentItem) {
  const amount = Number(payment.amount || 0);
  const isFree = amount <= 0 || payment.provider === 'FREE';
  return {
    reference: payment.paymentReference || payment.id.slice(0, 10),
    doctor: payment.appointment?.doctor?.fullName || 'Doctor',
    code: payment.appointment?.appointmentCode || '—',
    visitWhen: payment.appointment?.scheduledAt
      ? new Date(payment.appointment.scheduledAt).toLocaleString()
      : '—',
    reason: payment.appointment?.reason || '—',
    amount: isFree
      ? 'Free ($0)'
      : `${payment.currency || 'USD'} ${amount.toFixed(2)}`,
    method: isFree
      ? 'Free'
      : localPayLabel(payment.provider, String(payment.method || '')),
    status: isFree ? 'Free · Paid' : enumLabel(payment.status),
    paidAt: payment.createdAt
      ? new Date(payment.createdAt).toLocaleString()
      : '—',
    isFree,
  };
}

function buildReceiptHtml(payment: PaymentItem) {
  const r = receiptFields(payment);
  return `<!doctype html><html><head><meta charset="utf-8"/><title>Receipt ${r.reference}</title>
<style>
  body{font-family:system-ui,sans-serif;padding:28px;color:#0f172a;max-width:420px;margin:0 auto}
  .brand{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#146AFB;font-weight:700}
  h1{font-size:22px;margin:6px 0 4px}
  .sub{color:#64748b;font-size:13px;margin-bottom:20px}
  .box{border:1px solid #dbeafe;border-radius:16px;padding:16px;background:#f8fafc}
  .row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:13px}
  .row:last-child{border-bottom:0}
  .label{color:#64748b}
  .value{font-weight:600;text-align:right}
  .amount{font-size:28px;font-weight:700;margin:16px 0 4px}
  .status{display:inline-block;padding:4px 10px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:12px;font-weight:700}
</style></head><body>
  <div class="brand">Daryeel Health</div>
  <h1>Payment receipt</h1>
  <p class="sub">View &amp; print · single payment</p>
  <div class="amount">${r.amount}</div>
  <span class="status">${r.status}</span>
  <div class="box" style="margin-top:16px">
    <div class="row"><span class="label">Reference</span><span class="value">${r.reference}</span></div>
    <div class="row"><span class="label">Doctor</span><span class="value">${r.doctor}</span></div>
    <div class="row"><span class="label">Visit code</span><span class="value">${r.code}</span></div>
    <div class="row"><span class="label">Visit time</span><span class="value">${r.visitWhen}</span></div>
    <div class="row"><span class="label">Reason</span><span class="value">${r.reason}</span></div>
    <div class="row"><span class="label">Method</span><span class="value">${r.method}</span></div>
    <div class="row"><span class="label">Paid at</span><span class="value">${r.paidAt}</span></div>
  </div>
  <script>window.onload=function(){window.print()}</script>
</body></html>`;
}

function buildReceiptText(payment: PaymentItem) {
  const r = receiptFields(payment);
  return [
    'Daryeel Health — Payment receipt',
    '',
    `Amount: ${r.amount}`,
    `Status: ${r.status}`,
    `Reference: ${r.reference}`,
    `Doctor: ${r.doctor}`,
    `Visit: ${r.code}`,
    `Visit time: ${r.visitWhen}`,
    `Reason: ${r.reason}`,
    `Method: ${r.method}`,
    `Paid at: ${r.paidAt}`,
  ].join('\n');
}

export async function printPaymentReceipt(payment: PaymentItem) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (win) {
      win.document.write(buildReceiptHtml(payment));
      win.document.close();
      win.focus();
      return;
    }
  }
  await Share.share({
    title: 'Daryeel payment receipt',
    message: buildReceiptText(payment),
  });
}

export function PaymentReceiptSheet({ open, payment, onClose }: Props) {
  if (!open || !payment) return null;

  const r = receiptFields(payment);

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}>
            <Text style={styles.eyebrow}>Daryeel Health</Text>
            <Text style={styles.title}>Payment receipt</Text>
            <Text style={styles.sub}>View one payment · then Print</Text>

            <Text style={styles.amount}>{r.amount}</Text>
            <Text
              style={[
                styles.status,
                r.isFree || String(payment.status).toUpperCase() === 'PAID'
                  ? styles.statusPaid
                  : styles.statusPending,
              ]}>
              {r.status}
            </Text>

            <View style={styles.box}>
              <Row label="Reference" value={r.reference} />
              <Row label="Doctor" value={r.doctor} />
              <Row label="Visit code" value={r.code} />
              <Row label="Visit time" value={r.visitWhen} />
              <Row label="Reason" value={r.reason} />
              <Row label="Method" value={r.method} />
              <Row label="Paid at" value={r.paidAt} />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.secondaryBtn}>
              <Text style={styles.secondaryText}>Close</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                void printPaymentReceipt(payment);
              }}
              style={styles.primaryBtn}>
              <Ionicons name="print-outline" size={18} color="#fff" />
              <Text style={styles.primaryText}>Print</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: Brand.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow: 'hidden',
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  eyebrow: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Brand.primary,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: Brand.dark,
  },
  sub: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Brand.muted,
    marginBottom: 4,
  },
  amount: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    color: Brand.dark,
    marginTop: 4,
  },
  status: {
    alignSelf: 'flex-start',
    fontFamily: Fonts.semibold,
    fontSize: 12,
    borderRadius: Radius.full,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPaid: { color: Brand.success, backgroundColor: '#ECFDF5' },
  statusPending: { color: '#B45309', backgroundColor: '#FFFBEB' },
  box: {
    marginTop: Spacing.two,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.lg,
    backgroundColor: Brand.light,
    paddingHorizontal: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  rowLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Brand.muted },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Brand.dark,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: Spacing.four,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.white,
  },
  secondaryText: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Brand.dark,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.full,
    backgroundColor: Brand.primary,
  },
  primaryText: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Brand.white,
  },
});
