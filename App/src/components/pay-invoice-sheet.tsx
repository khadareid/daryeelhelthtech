import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import {
  LOCAL_PAY_METHODS,
  type InvoiceDraft,
  type LocalPayMethod,
} from '@/lib/payments';

type Props = {
  open: boolean;
  invoice: InvoiceDraft | null;
  busy?: boolean;
  onClose: () => void;
  onPay: (payload: {
    method: LocalPayMethod['method'];
    provider: string;
    phone?: string;
  }) => Promise<void>;
};

export function PayInvoiceSheet({
  open,
  invoice,
  busy,
  onClose,
  onPay,
}: Props) {
  const [methodId, setMethodId] = useState('zaad');
  const [phone, setPhone] = useState('');

  if (!open || !invoice) return null;

  const selected =
    LOCAL_PAY_METHODS.find((m) => m.id === methodId) || LOCAL_PAY_METHODS[0];
  const needsPhone =
    selected.method === 'MOBILE_MONEY' || selected.method === 'WALLET';

  const submit = async () => {
    if (needsPhone && phone.trim().length < 7) {
      return;
    }
    await onPay({
      method: selected.method,
      provider: selected.provider,
      phone: phone.trim() || undefined,
    });
  };

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text style={styles.eyebrow}>Invoice</Text>
            <Text style={styles.title}>Pay visit fee</Text>
            <Text style={styles.sub}>
              Choose local money (Zaad, eDahab…) or cash / bank / card.
            </Text>

            <View style={styles.invoiceBox}>
              <View style={styles.invoiceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Visit</Text>
                  <Text style={styles.doctor}>
                    {invoice.doctorName || 'Doctor'}
                  </Text>
                  <Text style={styles.meta}>
                    {invoice.appointmentCode ||
                      invoice.appointmentId.slice(0, 10)}
                    {invoice.scheduledAt
                      ? ` · ${new Date(invoice.scheduledAt).toLocaleString()}`
                      : ''}
                  </Text>
                  {invoice.reason ? (
                    <Text style={styles.meta}>{invoice.reason}</Text>
                  ) : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.label}>Amount due</Text>
                  <Text style={styles.amount}>
                    {invoice.currency} {invoice.amount.toFixed(2)}
                  </Text>
                  <Text style={styles.unpaid}>Unpaid</Text>
                </View>
              </View>
            </View>

            <Text style={styles.section}>Payment method</Text>
            <View style={styles.methods}>
              {LOCAL_PAY_METHODS.map((m) => {
                const on = methodId === m.id;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => setMethodId(m.id)}
                    style={[styles.method, on && styles.methodOn]}>
                    <Text style={[styles.methodText, on && styles.methodTextOn]}>
                      {m.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.hint}>{selected.hint}</Text>

            {needsPhone ? (
              <View style={styles.phoneWrap}>
                <Text style={styles.section}>{selected.label} number *</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g. 63xxxxxxx"
                  placeholderTextColor={Brand.muted}
                  keyboardType="phone-pad"
                  style={styles.input}
                />
                {phone.trim().length > 0 && phone.trim().length < 7 ? (
                  <Text style={styles.error}>Enter a valid mobile number</Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.actions}>
              <Pressable
                disabled={busy}
                onPress={onClose}
                style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={busy || (needsPhone && phone.trim().length < 7)}
                onPress={submit}
                style={[
                  styles.payBtn,
                  (busy || (needsPhone && phone.trim().length < 7)) &&
                    styles.payBtnDisabled,
                ]}>
                <Text style={styles.payText}>
                  {busy
                    ? 'Processing…'
                    : `Pay ${invoice.currency} ${invoice.amount.toFixed(2)} · ${selected.label}`}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: Brand.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.two,
    paddingBottom: Spacing.six,
  },
  eyebrow: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
  invoiceBox: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Brand.border,
    backgroundColor: Brand.light,
    padding: Spacing.three,
  },
  invoiceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: Brand.muted,
  },
  doctor: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: Brand.dark,
    marginTop: 2,
  },
  meta: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Brand.muted,
    marginTop: 2,
  },
  amount: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: Brand.dark,
    marginTop: 2,
  },
  unpaid: {
    marginTop: 4,
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Brand.primary,
    backgroundColor: Brand.white,
    overflow: 'hidden',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  section: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Brand.dark,
    marginTop: 6,
  },
  methods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  method: {
    minWidth: '22%',
    flexGrow: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.light,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  methodOn: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  methodText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Brand.dark,
  },
  methodTextOn: {
    color: Brand.white,
  },
  hint: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Brand.muted,
  },
  phoneWrap: { gap: 6 },
  input: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Brand.dark,
    backgroundColor: Brand.white,
  },
  error: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: '#DC2626',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelText: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Brand.dark,
  },
  payBtn: {
    borderRadius: Radius.full,
    backgroundColor: Brand.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  payBtnDisabled: { opacity: 0.5 },
  payText: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Brand.white,
  },
});
