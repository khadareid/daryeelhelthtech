import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';

type Props = {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
};

/** Dropdown for Country / Region / City. Set searchable for long lists (world countries). */
export function LocationSelect({
  label,
  value,
  options,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  searchable = false,
  disabled,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const data = useMemo(() => {
    if (!searchable) return options;
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query, searchable]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.trigger, disabled && styles.disabled]}>
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{label}</Text>
            {searchable ? (
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor={Brand.muted}
                style={styles.search}
                autoFocus
                autoCorrect={false}
                autoCapitalize="none"
              />
            ) : null}
            <FlatList
              data={data}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.empty}>No options available</Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, item === value && styles.optionOn]}
                  onPress={() => {
                    onChange(item);
                    close();
                  }}>
                  <Text
                    style={[
                      styles.optionText,
                      item === value && styles.optionTextOn,
                    ]}>
                    {item}
                  </Text>
                </Pressable>
              )}
            />
            <Pressable style={styles.cancel} onPress={close}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Brand.dark,
  },
  trigger: {
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.white,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disabled: {
    opacity: 0.55,
  },
  value: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Brand.dark,
    flex: 1,
  },
  placeholder: {
    color: Brand.muted,
  },
  chevron: {
    color: Brand.muted,
    fontSize: 14,
    marginLeft: 8,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: Brand.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  sheetTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Brand.dark,
    marginBottom: 4,
  },
  search: {
    minHeight: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: Spacing.three,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Brand.dark,
    backgroundColor: Brand.light,
  },
  empty: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Brand.muted,
    paddingVertical: 16,
    textAlign: 'center',
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
  },
  optionOn: {
    backgroundColor: Brand.light,
  },
  optionText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Brand.dark,
  },
  optionTextOn: {
    fontFamily: Fonts.semibold,
    color: Brand.primary,
  },
  cancel: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Brand.muted,
  },
});
