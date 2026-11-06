import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import type { EnumOption } from '@/lib/enums';

export function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function EnumChips({
  options,
  value,
  onChange,
}: {
  options: EnumOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.chip, on && styles.chipOn]}>
            <Text style={[styles.chipText, on && styles.chipTextOn]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function TableHead({ columns }: { columns: string[] }) {
  return (
    <View style={styles.tableHead}>
      {columns.map((c, i) => (
        <Text
          key={c}
          style={[styles.th, { flex: i === 0 ? 1.2 : 1 }]}
          numberOfLines={1}>
          {c}
        </Text>
      ))}
    </View>
  );
}

export function TableRow({ cells }: { cells: string[] }) {
  return (
    <View style={styles.row}>
      {cells.map((c, i) => (
        <Text
          key={`${c}-${i}`}
          style={[styles.td, { flex: i === 0 ? 1.2 : 1 }]}
          numberOfLines={1}>
          {c}
        </Text>
      ))}
    </View>
  );
}

export const formStyles = StyleSheet.create({
  title: { fontFamily: Fonts.bold, fontSize: 24, color: Brand.dark },
  sub: { fontFamily: Fonts.regular, fontSize: 13, color: Brand.muted },
  form: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
    gap: 8,
  },
  section: { fontFamily: Fonts.semibold, fontSize: 15, color: Brand.dark },
  input: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Brand.dark,
    backgroundColor: Brand.bg,
  },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: Brand.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 6,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontFamily: Fonts.semibold, fontSize: 13, color: Brand.white },
  empty: { fontFamily: Fonts.regular, fontSize: 13, color: Brand.muted },
});

const styles = StyleSheet.create({
  label: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Brand.dark,
    marginTop: 4,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Brand.bg,
  },
  chipOn: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  chipText: { fontFamily: Fonts.medium, fontSize: 11, color: Brand.muted },
  chipTextOn: { color: Brand.white },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: Brand.light,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  th: { fontFamily: Fonts.semibold, fontSize: 11, color: Brand.muted },
  row: {
    flexDirection: 'row',
    backgroundColor: Brand.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  td: { fontFamily: Fonts.regular, fontSize: 13, color: Brand.dark },
});
