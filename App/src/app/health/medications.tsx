import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  FieldLabel,
  TableHead,
  TableRow,
  formStyles,
} from '@/components/form-ui';
import { Screen } from '@/components/screen';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  createMedicationRequest,
  listMedicationsRequest,
  type MedicationItem,
} from '@/lib/api';

export default function MedicationsScreen() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<MedicationItem[]>([]);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setItems(await listMedicationsRequest(accessToken));
    } catch {
      setItems([]);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function onAdd() {
    if (!accessToken || !name.trim()) return;
    setSaving(true);
    try {
      await createMedicationRequest(
        {
          name: name.trim(),
          dosage: dosage.trim() || undefined,
          frequency: frequency.trim() || undefined,
        },
        accessToken,
      );
      setName('');
      setDosage('');
      setFrequency('');
      await load();
    } catch (error) {
      Alert.alert(
        'Could not save',
        error instanceof Error ? error.message : 'Try again',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen
      onRefresh={load}
      header={false}
      contentStyle={{ paddingTop: Spacing.three }}>
      <Text style={formStyles.title}>Medications</Text>
      <Text style={formStyles.sub}>Active medicines on your medical profile</Text>

      <View style={formStyles.form}>
        <Text style={formStyles.section}>Add medication</Text>
        <FieldLabel>Medicine name *</FieldLabel>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Amoxicillin"
          placeholderTextColor={Brand.muted}
          style={formStyles.input}
        />
        <FieldLabel>Dosage</FieldLabel>
        <TextInput
          value={dosage}
          onChangeText={setDosage}
          placeholder="e.g. 500mg"
          placeholderTextColor={Brand.muted}
          style={formStyles.input}
        />
        <FieldLabel>Frequency</FieldLabel>
        <TextInput
          value={frequency}
          onChangeText={setFrequency}
          placeholder="e.g. Twice daily"
          placeholderTextColor={Brand.muted}
          style={formStyles.input}
        />
        <Pressable
          onPress={onAdd}
          disabled={saving || !name.trim()}
          style={[
            formStyles.btn,
            (!name.trim() || saving) && formStyles.btnDisabled,
          ]}>
          <Text style={formStyles.btnText}>
            {saving ? 'Saving…' : 'Add medication'}
          </Text>
        </Pressable>
      </View>

      <TableHead columns={['Medicine', 'Dosage', 'Status']} />
      {items.length === 0 ? (
        <Text style={formStyles.empty}>No medications yet.</Text>
      ) : (
        items.map((item) => (
          <TableRow
            key={item.id}
            cells={[
              item.name,
              [item.dosage, item.frequency].filter(Boolean).join(' · ') || '—',
              item.isActive === false ? 'Inactive' : 'Active',
            ]}
          />
        ))
      )}
    </Screen>
  );
}
