import { createApi } from "@reduxjs/toolkit/query/react"
import { apiBaseQuery } from "@/lib/apiBaseQuery"
import { unwrapList, unwrapResult } from "@/Redex/lib/ownedApi"
import type {
  AccessRequest,
  Allergy,
  ApiResponse,
  ChronicCondition,
  Consent,
  Diagnosis,
  EmergencyCard,
  EmergencyContact,
  FamilyMember,
  HealthDevice,
  LabResult,
  MedicalDocument,
  MedicalProfile,
  MedicalRecord,
  Medication,
  Paginated,
  Prescription,
  VitalSign,
} from "@/Redex/types/Types"

function listTransform<T>(res: ApiResponse<Paginated<T> | T[]>): T[] {
  return unwrapList(res)
}

function oneTransform<T>(res: ApiResponse<T>): T {
  return unwrapResult(res)
}

export const healthApi = createApi({
  reducerPath: "healthApi",
  baseQuery: apiBaseQuery,
  tagTypes: [
    "MedicalProfile",
    "EmergencyCard",
    "EmergencyContacts",
    "FamilyMembers",
    "Allergies",
    "ChronicConditions",
    "Medications",
    "MedicalRecords",
    "MedicalDocuments",
    "Diagnoses",
    "VitalSigns",
    "LabResults",
    "Prescriptions",
    "HealthDevices",
    "Consents",
    "AccessRequests",
  ],
  endpoints: (builder) => ({
    /* ---------- Medical profile (singleton) ---------- */
    getMedicalProfile: builder.query<MedicalProfile | null, void>({
      query: () => ({ url: "/medical-profile" }),
      transformResponse: (res: ApiResponse<MedicalProfile | null>) =>
        unwrapResult(res) ?? null,
      providesTags: ["MedicalProfile"],
    }),
    upsertMedicalProfile: builder.mutation<MedicalProfile, Partial<MedicalProfile>>({
      query: (body) => ({ url: "/medical-profile", method: "PUT", body }),
      transformResponse: (res: ApiResponse<MedicalProfile>) => unwrapResult(res),
      invalidatesTags: ["MedicalProfile"],
    }),

    /* ---------- Emergency card (singleton) ---------- */
    getEmergencyCard: builder.query<EmergencyCard | null, void>({
      query: () => ({ url: "/emergency-card" }),
      transformResponse: (res: ApiResponse<EmergencyCard | null>) =>
        unwrapResult(res) ?? null,
      providesTags: ["EmergencyCard"],
    }),
    upsertEmergencyCard: builder.mutation<EmergencyCard, Partial<EmergencyCard>>({
      query: (body) => ({ url: "/emergency-card", method: "PUT", body }),
      transformResponse: (res: ApiResponse<EmergencyCard>) => unwrapResult(res),
      invalidatesTags: ["EmergencyCard"],
    }),

    /* ---------- Emergency contacts ---------- */
    listEmergencyContacts: builder.query<EmergencyContact[], void>({
      query: () => ({ url: "/emergency-contacts" }),
      transformResponse: listTransform<EmergencyContact>,
      providesTags: [{ type: "EmergencyContacts", id: "LIST" }],
    }),
    createEmergencyContact: builder.mutation<EmergencyContact, Partial<EmergencyContact>>({
      query: (body) => ({ url: "/emergency-contacts", method: "POST", body }),
      transformResponse: oneTransform<EmergencyContact>,
      invalidatesTags: [{ type: "EmergencyContacts", id: "LIST" }],
    }),
    updateEmergencyContact: builder.mutation<
      EmergencyContact,
      { id: string; data: Partial<EmergencyContact> }
    >({
      query: ({ id, data }) => ({
        url: `/emergency-contacts/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: oneTransform<EmergencyContact>,
      invalidatesTags: [{ type: "EmergencyContacts", id: "LIST" }],
    }),
    deleteEmergencyContact: builder.mutation<{ isSuccess: boolean }, string>({
      query: (id) => ({ url: `/emergency-contacts/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "EmergencyContacts", id: "LIST" }],
    }),

    /* ---------- Family ---------- */
    listFamilyMembers: builder.query<FamilyMember[], void>({
      query: () => ({ url: "/family-members" }),
      transformResponse: listTransform<FamilyMember>,
      providesTags: [{ type: "FamilyMembers", id: "LIST" }],
    }),
    createFamilyMember: builder.mutation<FamilyMember, Partial<FamilyMember>>({
      query: (body) => ({ url: "/family-members", method: "POST", body }),
      transformResponse: oneTransform<FamilyMember>,
      invalidatesTags: [{ type: "FamilyMembers", id: "LIST" }],
    }),
    updateFamilyMember: builder.mutation<
      FamilyMember,
      { id: string; data: Partial<FamilyMember> }
    >({
      query: ({ id, data }) => ({
        url: `/family-members/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: oneTransform<FamilyMember>,
      invalidatesTags: [{ type: "FamilyMembers", id: "LIST" }],
    }),
    deleteFamilyMember: builder.mutation<{ isSuccess: boolean }, string>({
      query: (id) => ({ url: `/family-members/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "FamilyMembers", id: "LIST" }],
    }),

    /* ---------- Allergies ---------- */
    listAllergies: builder.query<Allergy[], void>({
      query: () => ({ url: "/allergies" }),
      transformResponse: listTransform<Allergy>,
      providesTags: [{ type: "Allergies", id: "LIST" }],
    }),
    createAllergy: builder.mutation<Allergy, Partial<Allergy>>({
      query: (body) => ({ url: "/allergies", method: "POST", body }),
      transformResponse: oneTransform<Allergy>,
      invalidatesTags: [{ type: "Allergies", id: "LIST" }],
    }),
    updateAllergy: builder.mutation<Allergy, { id: string; data: Partial<Allergy> }>({
      query: ({ id, data }) => ({
        url: `/allergies/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: oneTransform<Allergy>,
      invalidatesTags: [{ type: "Allergies", id: "LIST" }],
    }),
    deleteAllergy: builder.mutation<{ isSuccess: boolean }, string>({
      query: (id) => ({ url: `/allergies/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Allergies", id: "LIST" }],
    }),

    /* ---------- Chronic conditions ---------- */
    listChronicConditions: builder.query<ChronicCondition[], void>({
      query: () => ({ url: "/chronic-conditions" }),
      transformResponse: listTransform<ChronicCondition>,
      providesTags: [{ type: "ChronicConditions", id: "LIST" }],
    }),
    createChronicCondition: builder.mutation<
      ChronicCondition,
      Partial<ChronicCondition>
    >({
      query: (body) => ({ url: "/chronic-conditions", method: "POST", body }),
      transformResponse: oneTransform<ChronicCondition>,
      invalidatesTags: [{ type: "ChronicConditions", id: "LIST" }],
    }),
    updateChronicCondition: builder.mutation<
      ChronicCondition,
      { id: string; data: Partial<ChronicCondition> }
    >({
      query: ({ id, data }) => ({
        url: `/chronic-conditions/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: oneTransform<ChronicCondition>,
      invalidatesTags: [{ type: "ChronicConditions", id: "LIST" }],
    }),
    deleteChronicCondition: builder.mutation<{ isSuccess: boolean }, string>({
      query: (id) => ({ url: `/chronic-conditions/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "ChronicConditions", id: "LIST" }],
    }),

    /* ---------- Medications ---------- */
    listMedications: builder.query<Medication[], void>({
      query: () => ({ url: "/medications" }),
      transformResponse: listTransform<Medication>,
      providesTags: [{ type: "Medications", id: "LIST" }],
    }),
    createMedication: builder.mutation<Medication, Partial<Medication>>({
      query: (body) => ({ url: "/medications", method: "POST", body }),
      transformResponse: oneTransform<Medication>,
      invalidatesTags: [{ type: "Medications", id: "LIST" }],
    }),
    updateMedication: builder.mutation<
      Medication,
      { id: string; data: Partial<Medication> }
    >({
      query: ({ id, data }) => ({
        url: `/medications/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: oneTransform<Medication>,
      invalidatesTags: [{ type: "Medications", id: "LIST" }],
    }),
    deleteMedication: builder.mutation<{ isSuccess: boolean }, string>({
      query: (id) => ({ url: `/medications/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Medications", id: "LIST" }],
    }),

    /* ---------- Medical records ---------- */
    listMedicalRecords: builder.query<MedicalRecord[], void>({
      query: () => ({ url: "/medical-records" }),
      transformResponse: listTransform<MedicalRecord>,
      providesTags: [{ type: "MedicalRecords", id: "LIST" }],
    }),
    createMedicalRecord: builder.mutation<MedicalRecord, Partial<MedicalRecord>>({
      query: (body) => ({ url: "/medical-records", method: "POST", body }),
      transformResponse: oneTransform<MedicalRecord>,
      invalidatesTags: [{ type: "MedicalRecords", id: "LIST" }],
    }),
    updateMedicalRecord: builder.mutation<
      MedicalRecord,
      { id: string; data: Partial<MedicalRecord> }
    >({
      query: ({ id, data }) => ({
        url: `/medical-records/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: oneTransform<MedicalRecord>,
      invalidatesTags: [{ type: "MedicalRecords", id: "LIST" }],
    }),
    deleteMedicalRecord: builder.mutation<{ isSuccess: boolean }, string>({
      query: (id) => ({ url: `/medical-records/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "MedicalRecords", id: "LIST" }],
    }),

    /* ---------- Medical documents ---------- */
    listMedicalDocuments: builder.query<MedicalDocument[], void>({
      query: () => ({ url: "/medical-documents" }),
      transformResponse: listTransform<MedicalDocument>,
      providesTags: [{ type: "MedicalDocuments", id: "LIST" }],
    }),
    createMedicalDocument: builder.mutation<
      MedicalDocument,
      Partial<MedicalDocument>
    >({
      query: (body) => ({ url: "/medical-documents", method: "POST", body }),
      transformResponse: oneTransform<MedicalDocument>,
      invalidatesTags: [{ type: "MedicalDocuments", id: "LIST" }],
    }),
    deleteMedicalDocument: builder.mutation<{ isSuccess: boolean }, string>({
      query: (id) => ({ url: `/medical-documents/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "MedicalDocuments", id: "LIST" }],
    }),

    /* ---------- Diagnoses ---------- */
    listDiagnoses: builder.query<Diagnosis[], void>({
      query: () => ({ url: "/diagnoses" }),
      transformResponse: listTransform<Diagnosis>,
      providesTags: [{ type: "Diagnoses", id: "LIST" }],
    }),
    createDiagnosis: builder.mutation<Diagnosis, Partial<Diagnosis>>({
      query: (body) => ({ url: "/diagnoses", method: "POST", body }),
      transformResponse: oneTransform<Diagnosis>,
      invalidatesTags: [{ type: "Diagnoses", id: "LIST" }],
    }),
    deleteDiagnosis: builder.mutation<{ isSuccess: boolean }, string>({
      query: (id) => ({ url: `/diagnoses/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Diagnoses", id: "LIST" }],
    }),

    /* ---------- Vital signs ---------- */
    listVitalSigns: builder.query<VitalSign[], void>({
      query: () => ({ url: "/vital-signs" }),
      transformResponse: listTransform<VitalSign>,
      providesTags: [{ type: "VitalSigns", id: "LIST" }],
    }),
    createVitalSign: builder.mutation<VitalSign, Partial<VitalSign>>({
      query: (body) => ({ url: "/vital-signs", method: "POST", body }),
      transformResponse: oneTransform<VitalSign>,
      invalidatesTags: [{ type: "VitalSigns", id: "LIST" }],
    }),
    deleteVitalSign: builder.mutation<{ isSuccess: boolean }, string>({
      query: (id) => ({ url: `/vital-signs/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "VitalSigns", id: "LIST" }],
    }),

    /* ---------- Lab results ---------- */
    listLabResults: builder.query<LabResult[], void>({
      query: () => ({ url: "/lab-results" }),
      transformResponse: listTransform<LabResult>,
      providesTags: [{ type: "LabResults", id: "LIST" }],
    }),
    createLabResult: builder.mutation<LabResult, Partial<LabResult>>({
      query: (body) => ({ url: "/lab-results", method: "POST", body }),
      transformResponse: oneTransform<LabResult>,
      invalidatesTags: [{ type: "LabResults", id: "LIST" }],
    }),
    deleteLabResult: builder.mutation<{ isSuccess: boolean }, string>({
      query: (id) => ({ url: `/lab-results/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "LabResults", id: "LIST" }],
    }),

    /* ---------- Prescriptions ---------- */
    listPrescriptions: builder.query<Prescription[], void>({
      query: () => ({ url: "/prescriptions" }),
      transformResponse: listTransform<Prescription>,
      providesTags: [{ type: "Prescriptions", id: "LIST" }],
    }),
    getPrescription: builder.query<Prescription, string>({
      query: (id) => ({ url: `/prescriptions/${id}` }),
      transformResponse: oneTransform<Prescription>,
      providesTags: (_r, _e, id) => [{ type: "Prescriptions", id }],
    }),
    createPrescription: builder.mutation<Prescription, Partial<Prescription>>({
      query: (body) => ({ url: "/prescriptions", method: "POST", body }),
      transformResponse: oneTransform<Prescription>,
      invalidatesTags: [{ type: "Prescriptions", id: "LIST" }],
    }),
    deletePrescription: builder.mutation<{ isSuccess: boolean }, string>({
      query: (id) => ({ url: `/prescriptions/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Prescriptions", id: "LIST" }],
    }),

    /* ---------- Health devices ---------- */
    listHealthDevices: builder.query<HealthDevice[], void>({
      query: () => ({ url: "/health-devices" }),
      transformResponse: listTransform<HealthDevice>,
      providesTags: [{ type: "HealthDevices", id: "LIST" }],
    }),
    createHealthDevice: builder.mutation<HealthDevice, Partial<HealthDevice>>({
      query: (body) => ({ url: "/health-devices", method: "POST", body }),
      transformResponse: oneTransform<HealthDevice>,
      invalidatesTags: [{ type: "HealthDevices", id: "LIST" }],
    }),
    deleteHealthDevice: builder.mutation<{ isSuccess: boolean }, string>({
      query: (id) => ({ url: `/health-devices/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "HealthDevices", id: "LIST" }],
    }),

    /* ---------- Consents ---------- */
    listConsents: builder.query<Consent[], void>({
      query: () => ({ url: "/consents" }),
      transformResponse: listTransform<Consent>,
      providesTags: [{ type: "Consents", id: "LIST" }],
    }),
    createConsent: builder.mutation<Consent, Partial<Consent>>({
      query: (body) => ({ url: "/consents", method: "POST", body }),
      transformResponse: oneTransform<Consent>,
      invalidatesTags: [{ type: "Consents", id: "LIST" }],
    }),
    updateConsent: builder.mutation<Consent, { id: string; data: Partial<Consent> }>({
      query: ({ id, data }) => ({
        url: `/consents/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: oneTransform<Consent>,
      invalidatesTags: [{ type: "Consents", id: "LIST" }],
    }),

    /* ---------- Access requests ---------- */
    listAccessRequests: builder.query<AccessRequest[], void>({
      query: () => ({ url: "/access-requests" }),
      transformResponse: listTransform<AccessRequest>,
      providesTags: [{ type: "AccessRequests", id: "LIST" }],
    }),
    createAccessRequest: builder.mutation<AccessRequest, Partial<AccessRequest>>({
      query: (body) => ({ url: "/access-requests", method: "POST", body }),
      transformResponse: oneTransform<AccessRequest>,
      invalidatesTags: [{ type: "AccessRequests", id: "LIST" }],
    }),
    updateAccessRequest: builder.mutation<
      AccessRequest,
      { id: string; data: Partial<AccessRequest> }
    >({
      query: ({ id, data }) => ({
        url: `/access-requests/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: oneTransform<AccessRequest>,
      invalidatesTags: [{ type: "AccessRequests", id: "LIST" }],
    }),
  }),
})

export const {
  useGetMedicalProfileQuery,
  useUpsertMedicalProfileMutation,
  useGetEmergencyCardQuery,
  useUpsertEmergencyCardMutation,
  useListEmergencyContactsQuery,
  useCreateEmergencyContactMutation,
  useUpdateEmergencyContactMutation,
  useDeleteEmergencyContactMutation,
  useListFamilyMembersQuery,
  useCreateFamilyMemberMutation,
  useUpdateFamilyMemberMutation,
  useDeleteFamilyMemberMutation,
  useListAllergiesQuery,
  useCreateAllergyMutation,
  useUpdateAllergyMutation,
  useDeleteAllergyMutation,
  useListChronicConditionsQuery,
  useCreateChronicConditionMutation,
  useUpdateChronicConditionMutation,
  useDeleteChronicConditionMutation,
  useListMedicationsQuery,
  useCreateMedicationMutation,
  useUpdateMedicationMutation,
  useDeleteMedicationMutation,
  useListMedicalRecordsQuery,
  useCreateMedicalRecordMutation,
  useUpdateMedicalRecordMutation,
  useDeleteMedicalRecordMutation,
  useListMedicalDocumentsQuery,
  useCreateMedicalDocumentMutation,
  useDeleteMedicalDocumentMutation,
  useListDiagnosesQuery,
  useCreateDiagnosisMutation,
  useDeleteDiagnosisMutation,
  useListVitalSignsQuery,
  useCreateVitalSignMutation,
  useDeleteVitalSignMutation,
  useListLabResultsQuery,
  useCreateLabResultMutation,
  useDeleteLabResultMutation,
  useListPrescriptionsQuery,
  useGetPrescriptionQuery,
  useCreatePrescriptionMutation,
  useDeletePrescriptionMutation,
  useListHealthDevicesQuery,
  useCreateHealthDeviceMutation,
  useDeleteHealthDeviceMutation,
  useListConsentsQuery,
  useCreateConsentMutation,
  useUpdateConsentMutation,
  useListAccessRequestsQuery,
  useCreateAccessRequestMutation,
  useUpdateAccessRequestMutation,
} = healthApi
