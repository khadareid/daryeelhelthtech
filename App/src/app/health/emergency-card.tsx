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
  createEmergencyContactRequest,
  getEmergencyCardRequest,
  listEmergencyContactsRequest,
  upsertEmergencyCardRequest,
  type EmergencyCard,
  type EmergencyContactItem,
} from '@/lib/api';
import {
  BLOOD_TYPE_OPTIONS,
  enumLabel,
  RELATIONSHIP_OPTIONS,
} from '@/lib/enums';

export default function EmergencyCardScreen() {
  const { accessToken } = useAuth();
  const [card, setCard] = useState<EmergencyCard | null>(null);
  const [contacts, setContacts] = useState<EmergencyContactItem[]>([]);
  const [bloodType, setBloodType] = useState('UNKNOWN');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('FAMILY');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [nextCard, nextContacts] = await Promise.all([
        getEmergencyCardRequest(accessToken),
        listEmergencyContactsRequest(accessToken),
      ]);
      setCard(nextCard);
      setContacts(nextContacts);
      setBloodType(nextCard?.bloodType || 'UNKNOWN');
    } catch {
      setCard(null);
      setContacts([]);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSaveCard() {
    if (!accessToken) return;
    setSaving(true);
    try {
      const next = await upsertEmergencyCardRequest(
        {
          bloodType,
          emergencyContactName:
            contacts[0]?.fullName || fullName.trim() || undefined,
          emergencyContactPhone:
            contacts[0]?.phone || phone.trim() || undefined,
        },
        accessToken,
      );
      setCard(next ?? null);
      Alert.alert('Saved', 'Emergency card updated.');
    } catch (error) {
      Alert.alert(
        'Could not save',
        error instanceof Error ? error.message : 'Try again',
      );
    } finally {
      setSaving(false);
    }
  }

  async function onAddContact() {
    if (!accessToken || !fullName.trim() || !phone.trim()) {
      Alert.alert('Name and phone required');
      return;
    }
    setSaving(true);
    try {
      await createEmergencyContactRequest(
        {
          fullName: fullName.trim(),
          phone: phone.trim(),
          relationship,
        },
        accessToken,
      );
      setFullName('');
      setPhone('');
      setRelationship('FAMILY');
      await load();
    } catch (error) {
      Alert.alert(
        'Could not add contact',
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
      <Text style={formStyles.title}>Emergency</Text>
      <Text style={formStyles.sub}>
        Card & contacts
        {card?.cardNumber ? ` · ${card.cardNumber}` : ''}
      </Text>

      <View style={formStyles.form}>
        <Text style={formStyles.section}>Emergency card</Text>
        <FieldLabel>Blood type</FieldLabel>
        <EnumChips
          options={BLOOD_TYPE_OPTIONS}
          value={bloodType}
          onChange={setBloodType}
        />
        <Pressable
          onPress={onSaveCard}
          disabled={saving}
          style={[formStyles.btn, saving && formStyles.btnDisabled]}>
          <Text style={formStyles.btnText}>
            {saving ? 'Saving…' : card ? 'Update card' : 'Create card'}
          </Text>
        </Pressable>
      </View>

      <View style={formStyles.form}>
        <Text style={formStyles.section}>Add contact</Text>
        <FieldLabel>Full name *</FieldLabel>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="e.g. Maxamed Xasan"
          placeholderTextColor={Brand.muted}
          style={formStyles.input}
        />
        <FieldLabel>Phone *</FieldLabel>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="e.g. 63xxxxxxx"
          placeholderTextColor={Brand.muted}
          style={formStyles.input}
          keyboardType="phone-pad"
        />
        <FieldLabel>Family / relationship *</FieldLabel>
        <EnumChips
          options={RELATIONSHIP_OPTIONS}
          value={relationship}
          onChange={setRelationship}
        />
        <Pressable
          onPress={onAddContact}
          disabled={saving}
          style={[formStyles.btn, saving && formStyles.btnDisabled]}>
          <Text style={formStyles.btnText}>
            {saving ? 'Saving…' : 'Add contact'}
          </Text>
        </Pressable>
      </View>

      <TableHead columns={['Name', 'Phone', 'Family']} />
      {contacts.length === 0 ? (
        <Text style={formStyles.empty}>No emergency contacts yet.</Text>
      ) : (
        contacts.map((c) => (
          <TableRow
            key={c.id}
            cells={[c.fullName, c.phone, enumLabel(c.relationship)]}
          />
        ))
      )}
    </Screen>
  );
}
