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
import { CardListSkeleton } from '@/components/skeleton';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  createFamilyMemberRequest,
  listFamilyMembersRequest,
  type FamilyMemberItem,
} from '@/lib/api';
import {
  enumLabel,
  GENDER_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from '@/lib/enums';

export default function FamilyScreen() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<FamilyMemberItem[]>([]);
  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState('SON');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    try {
      setItems(await listFamilyMembersRequest(accessToken));
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
    if (!accessToken || !fullName.trim() || !relationship) return;
    setSaving(true);
    try {
      await createFamilyMemberRequest(
        {
          fullName: fullName.trim(),
          relationship,
          phone: phone.trim() || undefined,
          gender: gender || undefined,
        },
        accessToken,
      );
      setFullName('');
      setRelationship('SON');
      setPhone('');
      setGender('');
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
      <Text style={formStyles.title}>Family members</Text>
      <Text style={formStyles.sub}>
        Add people like Maxamed Xasan with relationship
      </Text>

      <View style={formStyles.form}>
        <Text style={formStyles.section}>Add family member</Text>
        <FieldLabel>Full name *</FieldLabel>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="e.g. Maxamed Xasan"
          placeholderTextColor={Brand.muted}
          style={formStyles.input}
        />
        <FieldLabel>Relationship / Family *</FieldLabel>
        <EnumChips
          options={RELATIONSHIP_OPTIONS}
          value={relationship}
          onChange={setRelationship}
        />
        <FieldLabel>Phone</FieldLabel>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="e.g. 63xxxxxxx"
          keyboardType="phone-pad"
          placeholderTextColor={Brand.muted}
          style={formStyles.input}
        />
        <FieldLabel>Gender</FieldLabel>
        <EnumChips
          options={GENDER_OPTIONS}
          value={gender}
          onChange={setGender}
        />
        <Pressable
          onPress={onAdd}
          disabled={saving || !fullName.trim() || !relationship}
          style={[
            formStyles.btn,
            (saving || !fullName.trim() || !relationship) &&
              formStyles.btnDisabled,
          ]}>
          <Text style={formStyles.btnText}>
            {saving ? 'Saving…' : 'Add member'}
          </Text>
        </Pressable>
      </View>

      {loading ? <CardListSkeleton rows={3} /> : null}
      {!loading ? (
        <>
          <TableHead columns={['Name', 'Family', 'Phone']} />
          {items.length === 0 ? (
            <Text style={formStyles.empty}>No family members yet.</Text>
          ) : (
            items.map((item) => (
              <TableRow
                key={item.id}
                cells={[
                  item.fullName,
                  enumLabel(item.relationship),
                  item.phone || '—',
                ]}
              />
            ))
          )}
        </>
      ) : null}
    </Screen>
  );
}
