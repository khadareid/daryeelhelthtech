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
import { CardListSkeleton } from '@/components/skeleton';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  createVitalSignRequest,
  listVitalSignsRequest,
  type VitalItem,
} from '@/lib/api';

export default function VitalsScreen() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<VitalItem[]>([]);
  const [heartRate, setHeartRate] = useState('');
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    try {
      setItems(await listVitalSignsRequest(accessToken));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function onAdd() {
    if (!accessToken) return;
    setSaving(true);
    try {
      await createVitalSignRequest(
        {
          heartRate: heartRate ? Number(heartRate) : undefined,
          bloodPressureSys: sys ? Number(sys) : undefined,
          bloodPressureDia: dia ? Number(dia) : undefined,
          weight: weight ? Number(weight) : undefined,
          source: 'MANUAL',
        },
        accessToken,
      );
      setHeartRate('');
      setSys('');
      setDia('');
      setWeight('');
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
      <Text style={formStyles.title}>Vital signs</Text>
      <Text style={formStyles.sub}>Log blood pressure and heart rate</Text>

      <View style={formStyles.form}>
        <Text style={formStyles.section}>Add reading</Text>
        <FieldLabel>Heart rate (bpm)</FieldLabel>
        <TextInput
          value={heartRate}
          onChangeText={setHeartRate}
          placeholder="e.g. 72"
          keyboardType="numeric"
          placeholderTextColor={Brand.muted}
          style={formStyles.input}
        />
        <FieldLabel>Blood pressure SYS</FieldLabel>
        <TextInput
          value={sys}
          onChangeText={setSys}
          placeholder="e.g. 120"
          keyboardType="numeric"
          placeholderTextColor={Brand.muted}
          style={formStyles.input}
        />
        <FieldLabel>Blood pressure DIA</FieldLabel>
        <TextInput
          value={dia}
          onChangeText={setDia}
          placeholder="e.g. 80"
          keyboardType="numeric"
          placeholderTextColor={Brand.muted}
          style={formStyles.input}
        />
        <FieldLabel>Weight (kg)</FieldLabel>
        <TextInput
          value={weight}
          onChangeText={setWeight}
          placeholder="Optional"
          keyboardType="decimal-pad"
          placeholderTextColor={Brand.muted}
          style={formStyles.input}
        />
        <Pressable
          onPress={onAdd}
          disabled={saving}
          style={[formStyles.btn, saving && formStyles.btnDisabled]}>
          <Text style={formStyles.btnText}>
            {saving ? 'Saving…' : 'Save reading'}
          </Text>
        </Pressable>
      </View>

      {loading ? <CardListSkeleton rows={3} /> : null}
      {!loading ? (
        <>
          <TableHead columns={['When', 'BP', 'HR']} />
          {items.length === 0 ? (
            <Text style={formStyles.empty}>No vital signs yet.</Text>
          ) : (
            items.map((item) => (
              <TableRow
                key={item.id}
                cells={[
                  item.recordedAt
                    ? new Date(item.recordedAt).toLocaleString()
                    : 'Reading',
                  item.bloodPressureSys != null && item.bloodPressureDia != null
                    ? `${item.bloodPressureSys}/${item.bloodPressureDia}`
                    : '—',
                  item.heartRate != null ? String(item.heartRate) : '—',
                ]}
              />
            ))
          )}
        </>
      ) : null}
    </Screen>
  );
}
