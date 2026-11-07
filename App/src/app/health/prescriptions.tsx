import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { TableHead, TableRow, formStyles } from '@/components/form-ui';
import { Screen } from '@/components/screen';
import { CardListSkeleton } from '@/components/skeleton';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  listPrescriptionsRequest,
  type PrescriptionItem,
} from '@/lib/api';
import { enumLabel } from '@/lib/enums';

export default function PrescriptionsScreen() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    try {
      setItems(await listPrescriptionsRequest(accessToken));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen
      onRefresh={load}
      header={false}
      contentStyle={{ paddingTop: Spacing.three }}>
      <Text style={formStyles.title}>Prescriptions</Text>
      <Text style={formStyles.sub}>Issued by your clinicians</Text>

      {loading ? <CardListSkeleton rows={3} /> : null}
      {!loading ? (
        <>
          <TableHead columns={['Rx', 'Status', 'Doctor']} />
          {items.length === 0 ? (
            <Text style={formStyles.empty}>No prescriptions yet.</Text>
          ) : (
            items.map((item) => (
              <View key={item.id}>
                <TableRow
                  cells={[
                    item.prescriptionNumber || 'Prescription',
                    enumLabel(item.status, 'Active'),
                    item.doctor?.fullName
                      ? `Dr. ${item.doctor.fullName}`
                      : '—',
                  ]}
                />
                {(item.items || []).slice(0, 3).map((med) => (
                  <Text key={med.id} style={formStyles.sub}>
                    · {med.medicineName}
                    {med.dosage ? ` · ${med.dosage}` : ''}
                  </Text>
                ))}
              </View>
            ))
          )}
        </>
      ) : null}
    </Screen>
  );
}
