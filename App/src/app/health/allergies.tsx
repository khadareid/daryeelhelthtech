import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  EnumChips,
  FieldLabel,
  TableHead,
  TableRow,
  formStyles,
} from '@/components/form-ui';
import { Screen } from '@/components/screen';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  createAllergyRequest,
  listAllergiesRequest,
  type AllergyItem,
} from '@/lib/api';
import {
  ALLERGY_SEVERITY_OPTIONS,
  ALLERGY_TYPE_OPTIONS,
  enumLabel,
} from '@/lib/enums';

export default function AllergiesScreen() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<AllergyItem[]>([]);
  const [allergen, setAllergen] = useState('');
  const [severity, setSeverity] = useState('MODERATE');
  const [type, setType] = useState('OTHER');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setItems(await listAllergiesRequest(accessToken));
    } catch {
      setItems([]);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function onAdd() {
    if (!accessToken || !allergen.trim()) return;
    setSaving(true);
    try {
      await createAllergyRequest(
        {
          allergen: allergen.trim(),
          severity,
          type,
        },
        accessToken,
      );
      setAllergen('');
      setSeverity('MODERATE');
      setType('OTHER');
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
      <Text style={formStyles.title}>Allergies</Text>
      <Text style={formStyles.sub}>Keep your care team informed</Text>

      <View style={formStyles.form}>
        <Text style={formStyles.section}>Add allergy</Text>
        <FieldLabel>Allergen *</FieldLabel>
        <TextInput
          value={allergen}
          onChangeText={setAllergen}
          placeholder="e.g. Penicillin"
          placeholderTextColor={Brand.muted}
          style={formStyles.input}
        />
        <FieldLabel>Type</FieldLabel>
        <EnumChips
          options={ALLERGY_TYPE_OPTIONS}
          value={type}
          onChange={setType}
        />
        <FieldLabel>Severity</FieldLabel>
        <EnumChips
          options={ALLERGY_SEVERITY_OPTIONS}
          value={severity}
          onChange={setSeverity}
        />
        <Pressable
          onPress={onAdd}
          disabled={saving || !allergen.trim()}
          style={[
            formStyles.btn,
            (!allergen.trim() || saving) && formStyles.btnDisabled,
          ]}>
          <Text style={formStyles.btnText}>
            {saving ? 'Saving…' : 'Add allergy'}
          </Text>
        </Pressable>
      </View>

      <TableHead columns={['Allergen', 'Type', 'Severity']} />
      {items.length === 0 ? (
        <Text style={formStyles.empty}>No allergies recorded.</Text>
      ) : (
        items.map((item) => (
          <TableRow
            key={item.id}
            cells={[
              item.allergen,
              enumLabel(item.type),
              enumLabel(item.severity, 'Unknown'),
            ]}
          />
        ))
      )}
    </Screen>
  );
}
