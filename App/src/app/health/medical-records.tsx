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
  createLabResultRequest,
  createMedicalDocumentRequest,
  createMedicalRecordRequest,
  listLabResultsRequest,
  listMedicalDocumentsRequest,
  listMedicalRecordsRequest,
  type LabResultItem,
  type MedicalDocumentItem,
  type MedicalRecordItem,
} from '@/lib/api';
import {
  DOCUMENT_TYPE_OPTIONS,
  enumLabel,
  LAB_STATUS_OPTIONS,
  RECORD_TYPE_OPTIONS,
} from '@/lib/enums';

type Tab = 'visits' | 'labs' | 'documents';

export default function MedicalRecordsScreen() {
  const { accessToken } = useAuth();
  const [tab, setTab] = useState<Tab>('visits');
  const [records, setRecords] = useState<MedicalRecordItem[]>([]);
  const [labs, setLabs] = useState<LabResultItem[]>([]);
  const [docs, setDocs] = useState<MedicalDocumentItem[]>([]);
  const [saving, setSaving] = useState(false);

  const [visitTitle, setVisitTitle] = useState('');
  const [visitType, setVisitType] = useState('VISIT');
  const [visitDiagnosis, setVisitDiagnosis] = useState('');
  const [labName, setLabName] = useState('');
  const [labValue, setLabValue] = useState('');
  const [labUnit, setLabUnit] = useState('');
  const [labStatus, setLabStatus] = useState('FINAL');
  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docType, setDocType] = useState('REPORT');

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [r, l, d] = await Promise.all([
        listMedicalRecordsRequest(accessToken),
        listLabResultsRequest(accessToken),
        listMedicalDocumentsRequest(accessToken),
      ]);
      setRecords(r);
      setLabs(l);
      setDocs(d);
    } catch {
      setRecords([]);
      setLabs([]);
      setDocs([]);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const saveVisit = async () => {
    if (!accessToken || !visitTitle.trim()) {
      Alert.alert('Title required');
      return;
    }
    setSaving(true);
    try {
      await createMedicalRecordRequest(
        {
          title: visitTitle.trim(),
          recordType: visitType,
          diagnosis: visitDiagnosis.trim() || undefined,
        },
        accessToken,
      );
      setVisitTitle('');
      setVisitDiagnosis('');
      setVisitType('VISIT');
      await load();
    } catch {
      Alert.alert('Could not save visit');
    } finally {
      setSaving(false);
    }
  };

  const saveLab = async () => {
    if (!accessToken || !labName.trim()) {
      Alert.alert('Test name required');
      return;
    }
    setSaving(true);
    try {
      await createLabResultRequest(
        {
          testName: labName.trim(),
          resultValue: labValue.trim() || undefined,
          unit: labUnit.trim() || undefined,
          status: labStatus,
        },
        accessToken,
      );
      setLabName('');
      setLabValue('');
      setLabUnit('');
      setLabStatus('FINAL');
      await load();
    } catch {
      Alert.alert('Could not save lab');
    } finally {
      setSaving(false);
    }
  };

  const saveDoc = async () => {
    if (!accessToken || !docTitle.trim() || !docUrl.trim()) {
      Alert.alert('Title and file URL required');
      return;
    }
    setSaving(true);
    try {
      await createMedicalDocumentRequest(
        {
          title: docTitle.trim(),
          fileUrl: docUrl.trim(),
          documentType: docType,
        },
        accessToken,
      );
      setDocTitle('');
      setDocUrl('');
      setDocType('REPORT');
      await load();
    } catch {
      Alert.alert('Could not save document');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      onRefresh={load}
      header={false}
      contentStyle={{ paddingTop: Spacing.three }}>
      <Text style={formStyles.title}>Health records</Text>
      <Text style={formStyles.sub}>Visits, labs, and documents</Text>

      <EnumChips
        options={[
          { value: 'visits', label: 'Visits' },
          { value: 'labs', label: 'Labs' },
          { value: 'documents', label: 'Documents' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as Tab)}
      />

      {tab === 'visits' ? (
        <>
          <View style={formStyles.form}>
            <Text style={formStyles.section}>Add visit</Text>
            <FieldLabel>Title *</FieldLabel>
            <TextInput
              style={formStyles.input}
              placeholder="e.g. Clinic visit"
              placeholderTextColor={Brand.muted}
              value={visitTitle}
              onChangeText={setVisitTitle}
            />
            <FieldLabel>Record type</FieldLabel>
            <EnumChips
              options={RECORD_TYPE_OPTIONS}
              value={visitType}
              onChange={setVisitType}
            />
            <FieldLabel>Diagnosis</FieldLabel>
            <TextInput
              style={formStyles.input}
              placeholder="Optional"
              placeholderTextColor={Brand.muted}
              value={visitDiagnosis}
              onChangeText={setVisitDiagnosis}
            />
            <Pressable
              disabled={saving}
              onPress={saveVisit}
              style={formStyles.btn}>
              <Text style={formStyles.btnText}>
                {saving ? 'Saving…' : 'Save visit'}
              </Text>
            </Pressable>
          </View>
          <TableHead columns={['Title', 'Type', 'Date']} />
          {records.length === 0 ? (
            <Text style={formStyles.empty}>No visit records yet.</Text>
          ) : (
            records.map((item) => (
              <TableRow
                key={item.id}
                cells={[
                  item.title,
                  enumLabel(item.recordType),
                  item.recordDate
                    ? new Date(item.recordDate).toLocaleDateString()
                    : '—',
                ]}
              />
            ))
          )}
        </>
      ) : null}

      {tab === 'labs' ? (
        <>
          <View style={formStyles.form}>
            <Text style={formStyles.section}>Add lab result</Text>
            <FieldLabel>Test name *</FieldLabel>
            <TextInput
              style={formStyles.input}
              placeholder="e.g. CBC"
              placeholderTextColor={Brand.muted}
              value={labName}
              onChangeText={setLabName}
            />
            <FieldLabel>Result</FieldLabel>
            <TextInput
              style={formStyles.input}
              placeholder="Value"
              placeholderTextColor={Brand.muted}
              value={labValue}
              onChangeText={setLabValue}
            />
            <FieldLabel>Unit</FieldLabel>
            <TextInput
              style={formStyles.input}
              placeholder="e.g. mg/dL"
              placeholderTextColor={Brand.muted}
              value={labUnit}
              onChangeText={setLabUnit}
            />
            <FieldLabel>Status</FieldLabel>
            <EnumChips
              options={LAB_STATUS_OPTIONS}
              value={labStatus}
              onChange={setLabStatus}
            />
            <Pressable
              disabled={saving}
              onPress={saveLab}
              style={formStyles.btn}>
              <Text style={formStyles.btnText}>
                {saving ? 'Saving…' : 'Save lab'}
              </Text>
            </Pressable>
          </View>
          <TableHead columns={['Test', 'Result', 'Status']} />
          {labs.length === 0 ? (
            <Text style={formStyles.empty}>No lab results yet.</Text>
          ) : (
            labs.map((item) => (
              <TableRow
                key={item.id}
                cells={[
                  item.testName,
                  `${item.resultValue ?? '—'} ${item.unit ?? ''}`.trim(),
                  enumLabel(item.status),
                ]}
              />
            ))
          )}
        </>
      ) : null}

      {tab === 'documents' ? (
        <>
          <View style={formStyles.form}>
            <Text style={formStyles.section}>Add document</Text>
            <FieldLabel>Title *</FieldLabel>
            <TextInput
              style={formStyles.input}
              placeholder="Document title"
              placeholderTextColor={Brand.muted}
              value={docTitle}
              onChangeText={setDocTitle}
            />
            <FieldLabel>Type</FieldLabel>
            <EnumChips
              options={DOCUMENT_TYPE_OPTIONS}
              value={docType}
              onChange={setDocType}
            />
            <FieldLabel>File URL *</FieldLabel>
            <TextInput
              style={formStyles.input}
              placeholder="https://…"
              placeholderTextColor={Brand.muted}
              autoCapitalize="none"
              value={docUrl}
              onChangeText={setDocUrl}
            />
            <Pressable
              disabled={saving}
              onPress={saveDoc}
              style={formStyles.btn}>
              <Text style={formStyles.btnText}>
                {saving ? 'Saving…' : 'Save document'}
              </Text>
            </Pressable>
          </View>
          <TableHead columns={['Document', 'Type', 'Date']} />
          {docs.length === 0 ? (
            <Text style={formStyles.empty}>No documents yet.</Text>
          ) : (
            docs.map((item) => (
              <TableRow
                key={item.id}
                cells={[
                  item.title,
                  enumLabel(item.documentType),
                  item.documentDate
                    ? new Date(item.documentDate).toLocaleDateString()
                    : '—',
                ]}
              />
            ))
          )}
        </>
      ) : null}
    </Screen>
  );
}
