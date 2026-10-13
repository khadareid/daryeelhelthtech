// src/features/types/Types.ts
// Complete TypeScript interfaces — generated from Healthcare Prisma Schema

/* ==================================================================
   ENUMS
================================================================== */

export const RoleEnum = {
  SUPER_ADMIN: "SUPER_ADMIN",
  USER: "USER",
  PATIENT: "PATIENT",
  DOCTOR: "DOCTOR",
  NURSE: "NURSE",
  MIDWIFE: "MIDWIFE",
  LAB_TECH: "LAB_TECH",
  PHARMACIST: "PHARMACIST",
  RECEPTIONIST: "RECEPTIONIST",
  ADMIN: "ADMIN",
} as const;
export type Role = keyof typeof RoleEnum;

export const GenderEnum = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
} as const;
export type Gender = keyof typeof GenderEnum;

export const BloodTypeEnum = {
  A_POSITIVE: "A_POSITIVE",
  A_NEGATIVE: "A_NEGATIVE",
  B_POSITIVE: "B_POSITIVE",
  B_NEGATIVE: "B_NEGATIVE",
  AB_POSITIVE: "AB_POSITIVE",
  AB_NEGATIVE: "AB_NEGATIVE",
  O_POSITIVE: "O_POSITIVE",
  O_NEGATIVE: "O_NEGATIVE",
  UNKNOWN: "UNKNOWN",
} as const;
export type BloodType = keyof typeof BloodTypeEnum;

export const ConsentScopeEnum = {
  MEDICAL_RECORDS: "MEDICAL_RECORDS",
  APPOINTMENTS: "APPOINTMENTS",
  LAB_RESULTS: "LAB_RESULTS",
  PRESCRIPTIONS: "PRESCRIPTIONS",
  VITAL_SIGNS: "VITAL_SIGNS",
  ALL: "ALL",
} as const;
export type ConsentScope = keyof typeof ConsentScopeEnum;

export const ConsentStatusEnum = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  REVOKED: "REVOKED",
} as const;
export type ConsentStatus = keyof typeof ConsentStatusEnum;

export const AppointmentStatusEnum = {
  SCHEDULED: "SCHEDULED",
  CONFIRMED: "CONFIRMED",
  CHECKED_IN: "CHECKED_IN",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const;
export type AppointmentStatus = keyof typeof AppointmentStatusEnum;

export const PrescriptionStatusEnum = {
  PENDING: "PENDING",
  DISPENSED: "DISPENSED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
} as const;
export type PrescriptionStatus = keyof typeof PrescriptionStatusEnum;

export const LabOrderStatusEnum = {
  ORDERED: "ORDERED",
  SAMPLE_COLLECTED: "SAMPLE_COLLECTED",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type LabOrderStatus = keyof typeof LabOrderStatusEnum;

export const HealthTrackingTypeEnum = {
  BLOOD_PRESSURE: "BLOOD_PRESSURE",
  BLOOD_SUGAR: "BLOOD_SUGAR",
  WEIGHT: "WEIGHT",
  HEIGHT: "HEIGHT",
  HEART_RATE: "HEART_RATE",
  TEMPERATURE: "TEMPERATURE",
  OXYGEN_SATURATION: "OXYGEN_SATURATION",
  STEPS: "STEPS",
  SLEEP: "SLEEP",
  WATER_INTAKE: "WATER_INTAKE",
  MOOD: "MOOD",
  PAIN_LEVEL: "PAIN_LEVEL",
  CUSTOM: "CUSTOM",
} as const;
export type HealthTrackingType = keyof typeof HealthTrackingTypeEnum;

export const NotificationTypeEnum = {
  APPOINTMENT_REMINDER: "APPOINTMENT_REMINDER",
  LAB_RESULT: "LAB_RESULT",
  PRESCRIPTION: "PRESCRIPTION",
  SYSTEM: "SYSTEM",
  PAYMENT: "PAYMENT",
  HEALTH_TIP: "HEALTH_TIP",
  CONSENT_REQUEST: "CONSENT_REQUEST",
} as const;
export type NotificationType = keyof typeof NotificationTypeEnum;

export const NotificationChannelEnum = {
  SMS: "SMS",
  PUSH: "PUSH",
  EMAIL: "EMAIL",
  IN_APP: "IN_APP",
} as const;
export type NotificationChannel = keyof typeof NotificationChannelEnum;

export const TransactionTypeEnum = {
  CREDIT: "CREDIT",
  DEBIT: "DEBIT",
  REFUND: "REFUND",
  COMMISSION: "COMMISSION",
} as const;
export type TransactionType = keyof typeof TransactionTypeEnum;

export const TransactionStatusEnum = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;
export type TransactionStatus = keyof typeof TransactionStatusEnum;

export const PaymentMethodEnum = {
  WALLET: "WALLET",
  CASH: "CASH",
  CARD: "CARD",
  MOBILE_MONEY: "MOBILE_MONEY",
} as const;
export type PaymentMethod = keyof typeof PaymentMethodEnum;

export const VerificationPurposeEnum = {
  PHONE_VERIFICATION: "PHONE_VERIFICATION",
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  PASSWORD_RESET: "PASSWORD_RESET",
  LOGIN_OTP: "LOGIN_OTP",
  TWO_FACTOR: "TWO_FACTOR",
  CHANGE_PHONE: "CHANGE_PHONE",
  CHANGE_EMAIL: "CHANGE_EMAIL",
} as const;
export type VerificationPurpose = keyof typeof VerificationPurposeEnum;

/* ==================================================================
   BASE / SHARED
================================================================== */

export interface ApiResponse<T = any> {
  isSuccess: boolean;
  message: string;
  result?: T;
  error?: string;
  errors?: any[];
}

export interface PaginatedResponse<T> {
  isSuccess: boolean;
  data: T[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface BaseFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DateRangeParams {
  startDate?: Date | string;
  endDate?: Date | string;
}

/* ==================================================================
   1. USER
================================================================== */

export interface User {
  userid: string;
  email: string;
  phone?: string | null;
  passwordHash?: string | null;
  fullName: string;
  gender?: Gender | null;
  dateOfBirth?: Date | string | null;
  avatarUrl?: string | null;
  isDeleted: boolean;

  googleId?: string | null;
  picture?: string | null;
  lastLogin?: Date | string | null;
  role: Role;

  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;

  language: string;
  timezone: string;

  isActive: boolean;
  isSuspended: boolean;
  lastLoginAt?: Date | string | null;
  deletedAt?: Date | string | null;

  createdAt: Date | string;
  updatedAt: Date | string;

  // Relations
  profile?: UserProfile | null;
  medicalProfile?: MedicalProfile | null;
  professionalProfiles?: ProfessionalProfile[];

  healthRecords?: MedicalRecord[];
  vitalSigns?: VitalSign[];
  diagnoses?: Diagnosis[];
  prescriptions?: Prescription[];
  labOrders?: LabOrder[];
  labResults?: LabResult[];
  appointments?: Appointment[];
  documents?: Document[];

  emergencyContacts?: EmergencyContact[];
  allergies?: Allergy[];
  chronicConditions?: ChronicCondition[];
  medications?: Medication[];

  dailyHealthLogs?: DailyHealthLog[];

  wallets?: Wallet[];
  transactions?: Transaction[];

  consentsGranted?: Consent[];
  consentsReceived?: Consent[];

  notifications?: Notification[];
  messagesSent?: Message[];
  sessions?: Session[];
  verificationCodes?: VerificationCode[];
  passwordResets?: PasswordReset[];
  auditLogs?: AuditLog[];
}

export interface UserInput {
  email: string;
  password?: string;
  fullName: string;
  phone?: string;
  role?: Role;
  gender?: Gender;
  dateOfBirth?: Date | string;
  avatarUrl?: string;
  picture?: string;
  language?: string;
  timezone?: string;
}

export interface UserUpdateInput extends Partial<Omit<UserInput, "password" | "email">> {
  email?: string;
}

export interface UserLoginInput {
  email: string;
  password: string;
}

export interface UserRegisterInput extends UserInput {
  confirmPassword?: string;
}

/* ==================================================================
   2. USER PROFILE
================================================================== */

export interface UserProfile {
  userprofileid: string;
  userId: string;
  healthId?: string | null;

  middleName?: string | null;
  nationalId?: string | null;
  nationality?: string | null;
  maritalStatus?: string | null;
  occupation?: string | null;

  country?: string | null;
  region?: string | null;
  city?: string | null;
  district?: string | null;
  addressLine?: string | null;
  postalCode?: string | null;

  alternatePhone?: string | null;
  alternateEmail?: string | null;

  bloodType: BloodType;
  height?: number | null;
  weight?: number | null;

  preferredLanguage: string;
  preferredContact: string;

  createdAt: Date | string;
  updatedAt: Date | string;

  user?: User;
}

export interface UserProfileInput {
  userId: string;
  healthId?: string;
  middleName?: string;
  nationalId?: string;
  nationality?: string;
  maritalStatus?: string;
  occupation?: string;
  country?: string;
  region?: string;
  city?: string;
  district?: string;
  addressLine?: string;
  postalCode?: string;
  alternatePhone?: string;
  alternateEmail?: string;
  bloodType?: BloodType;
  height?: number;
  weight?: number;
  preferredLanguage?: string;
  preferredContact?: string;
}

export interface UserProfileUpdateInput extends Partial<Omit<UserProfileInput, "userId">> {}

/* ==================================================================
   3. MEDICAL PROFILE
================================================================== */

export interface MedicalProfile {
  medicalprofileid: string;
  userId: string;

  smokingStatus?: string | null;
  alcoholUse?: string | null;
  exerciseFrequency?: string | null;
  dietType?: string | null;

  familyHistory?: any | null;
  surgicalHistory?: any | null;
  hospitalizationHistory?: any | null;
  immunizationRecords?: any | null;

  organDonor: boolean;
  dnrStatus: boolean;
  notes?: string | null;

  createdAt: Date | string;
  updatedAt: Date | string;

  user?: User;
}

export interface MedicalProfileInput {
  userId: string;
  smokingStatus?: string;
  alcoholUse?: string;
  exerciseFrequency?: string;
  dietType?: string;
  familyHistory?: any;
  surgicalHistory?: any;
  hospitalizationHistory?: any;
  immunizationRecords?: any;
  organDonor?: boolean;
  dnrStatus?: boolean;
  notes?: string;
}

/* ==================================================================
   4. EMERGENCY CONTACT
================================================================== */

export interface EmergencyContact {
  emergencycontactid: string;
  userId: string;
  fullName: string;
  relationship: string;
  phone: string;
  alternatePhone?: string | null;
  email?: string | null;
  address?: string | null;
  isPrimary: boolean;
  priority: number;
  createdAt: Date | string;
  updatedAt: Date | string;

  user?: User;
}

export interface EmergencyContactInput {
  userId: string;
  fullName: string;
  relationship: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  isPrimary?: boolean;
  priority?: number;
}

/* ==================================================================
   5. ALLERGY
================================================================== */

export interface Allergy {
  allergyid: string;
  userId: string;
  allergen: string;
  type: string;
  severity: string;
  reaction?: string | null;
  diagnosedAt?: Date | string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;

  user?: User;
}

export interface AllergyInput {
  userId: string;
  allergen: string;
  type: string;
  severity: string;
  reaction?: string;
  diagnosedAt?: Date | string;
  notes?: string;
  isActive?: boolean;
}

/* ==================================================================
   6. CHRONIC CONDITION
================================================================== */

export interface ChronicCondition {
  chronicconditionid: string;
  userId: string;
  condition: string;
  icdCode?: string | null;
  diagnosedAt?: Date | string | null;
  severity?: string | null;
  isActive: boolean;
  isControlled: boolean;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;

  user?: User;
}

export interface ChronicConditionInput {
  userId: string;
  condition: string;
  icdCode?: string;
  diagnosedAt?: Date | string;
  severity?: string;
  isActive?: boolean;
  isControlled?: boolean;
  notes?: string;
}

/* ==================================================================
   7. MEDICATION
================================================================== */

export interface Medication {
  medicationid: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: string;
  route?: string | null;
  startedAt: Date | string;
  endedAt?: Date | string | null;
  isActive: boolean;
  prescribedBy?: string | null;
  reason?: string | null;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;

  user?: User;
}

export interface MedicationInput {
  userId: string;
  name: string;
  dosage: string;
  frequency: string;
  route?: string;
  startedAt: Date | string;
  endedAt?: Date | string;
  isActive?: boolean;
  prescribedBy?: string;
  reason?: string;
  notes?: string;
}

/* ==================================================================
   8. MEDICAL RECORD
================================================================== */

export interface MedicalRecord {
  medicalrecordid: string;
  userId: string;
  recordType: string;
  title: string;
  description?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  notes?: string | null;

  facilityName?: string | null;
  facilityId?: string | null;
  doctorName?: string | null;
  doctorId?: string | null;

  recordDate: Date | string;
  attachments?: any | null;

  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;

  user?: User;
}

export interface MedicalRecordInput {
  userId: string;
  recordType: string;
  title: string;
  description?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  facilityName?: string;
  facilityId?: string;
  doctorName?: string;
  doctorId?: string;
  recordDate: Date | string;
  attachments?: any;
  isActive?: boolean;
}

/* ==================================================================
   9. VITAL SIGN
================================================================== */

export interface VitalSign {
  vitalsignid: string;
  userId: string;

  temperature?: number | null;
  bloodPressureSys?: number | null;
  bloodPressureDia?: number | null;
  heartRate?: number | null;
  respiratoryRate?: number | null;
  oxygenSaturation?: number | null;
  weight?: number | null;
  height?: number | null;
  bmi?: number | null;

  source: string;
  facilityName?: string | null;
  facilityId?: string | null;
  notes?: string | null;
  recordedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;

  user?: User;
}

export interface VitalSignInput {
  userId: string;
  temperature?: number;
  bloodPressureSys?: number;
  bloodPressureDia?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  source?: string;
  facilityName?: string;
  facilityId?: string;
  notes?: string;
  recordedAt?: Date | string;
}

/* ==================================================================
   10. DIAGNOSIS
================================================================== */

export interface Diagnosis {
  diagnosisid: string;
  userId: string;
  icdCode?: string | null;
  description: string;
  category?: string | null;
  isPrimary: boolean;
  isChronic: boolean;

  diagnosedBy?: string | null;
  doctorId?: string | null;
  facilityName?: string | null;
  facilityId?: string | null;

  diagnosedAt: Date | string;
  resolvedAt?: Date | string | null;
  isActive: boolean;

  notes?: string | null;
  attachments?: any | null;

  createdAt: Date | string;
  updatedAt: Date | string;

  user?: User;
}

export interface DiagnosisInput {
  userId: string;
  icdCode?: string;
  description: string;
  category?: string;
  isPrimary?: boolean;
  isChronic?: boolean;
  diagnosedBy?: string;
  doctorId?: string;
  facilityName?: string;
  facilityId?: string;
  diagnosedAt: Date | string;
  resolvedAt?: Date | string;
  isActive?: boolean;
  notes?: string;
  attachments?: any;
}

/* ==================================================================
   11. PRESCRIPTION
================================================================== */

export interface Prescription {
  prescriptionid: string;
  userId: string;
  prescriptionCode: string;

  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  route?: string | null;
  instructions?: string | null;

  prescribedBy?: string | null;
  doctorId?: string | null;
  facilityName?: string | null;
  facilityId?: string | null;

  status: PrescriptionStatus;

  issuedAt: Date | string;
  expiresAt?: Date | string | null;
  dispensedAt?: Date | string | null;
  dispensedBy?: string | null;
  pharmacyName?: string | null;
  pharmacyId?: string | null;

  notes?: string | null;
  attachments?: any | null;

  createdAt: Date | string;
  updatedAt: Date | string;

  user?: User;
}

export interface PrescriptionInput {
  userId: string;
  prescriptionCode?: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  route?: string;
  instructions?: string;
  prescribedBy?: string;
  doctorId?: string;
  facilityName?: string;
  facilityId?: string;
  status?: PrescriptionStatus;
  issuedAt?: Date | string;
  expiresAt?: Date | string;
  notes?: string;
  attachments?: any;
}

/* ==================================================================
   12. LAB ORDER
================================================================== */

export interface LabOrder {
  laborderid: string;
  userId: string;
  orderCode: string;

  testName: string;
  testCategory?: string | null;
  instructions?: string | null;

  orderedBy?: string | null;
  doctorId?: string | null;
  facilityName?: string | null;
  facilityId?: string | null;
  labName?: string | null;
  labId?: string | null;

  status: LabOrderStatus;

  orderedAt: Date | string;
  sampleCollectedAt?: Date | string | null;
  completedAt?: Date | string | null;

  notes?: string | null;

  createdAt: Date | string;
  updatedAt: Date | string;

  user?: User;
  result?: LabResult | null;
}

export interface LabOrderInput {
  userId: string;
  orderCode?: string;
  testName: string;
  testCategory?: string;
  instructions?: string;
  orderedBy?: string;
  doctorId?: string;
  facilityName?: string;
  facilityId?: string;
  labName?: string;
  labId?: string;
  status?: LabOrderStatus;
  orderedAt?: Date | string;
  notes?: string;
}

/* ==================================================================
   13. LAB RESULT
================================================================== */

export interface LabResult {
  labresultid: string;
  userId: string;
  labOrderId: string;

  testName: string;
  resultData?: any | null;
  resultText?: string | null;
  interpretation?: string | null;
  isAbnormal: boolean;
  isCritical: boolean;

  labName?: string | null;
  labId?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: Date | string | null;

  completedAt: Date | string;
  attachments?: any | null;

  createdAt: Date | string;
  updatedAt: Date | string;

  user?: User;
  labOrder?: LabOrder;
}

export interface LabResultInput {
  userId: string;
  labOrderId: string;
  testName: string;
  resultData?: any;
  resultText?: string;
  interpretation?: string;
  isAbnormal?: boolean;
  isCritical?: boolean;
  labName?: string;
  labId?: string;
  verifiedBy?: string;
  verifiedAt?: Date | string;
  completedAt?: Date | string;
  attachments?: any;
}

/* ==================================================================
   14. APPOINTMENT
================================================================== */

export interface Appointment {
  appointmentid: string;
  userId: string;
  appointmentCode: string;

  facilityName?: string | null;
  facilityId?: string | null;
  branchName?: string | null;
  branchId?: string | null;
  doctorName?: string | null;
  doctorId?: string | null;
  specialty?: string | null;

  scheduledAt: Date | string;
  duration: number;

  reason?: string | null;
  notes?: string | null;
  meetingLink?: string | null;

  status: AppointmentStatus;

  reminderSent: boolean;
  reminderAt?: Date | string | null;

  cancelledAt?: Date | string | null;
  cancelledReason?: string | null;

  createdAt: Date | string;
  updatedAt: Date | string;

  user?: User;
}

export interface AppointmentInput {
  userId: string;
  appointmentCode?: string;
  facilityName?: string;
  facilityId?: string;
  branchName?: string;
  branchId?: string;
  doctorName?: string;
  doctorId?: string;
  specialty?: string;
  scheduledAt: Date | string;
  duration?: number;
  reason?: string;
  notes?: string;
  meetingLink?: string;
  status?: AppointmentStatus;
}

/* ==================================================================
   15. HEALTH TRACKING
================================================================== */



/* ==================================================================
   16. DAILY HEALTH LOG
   ================================================================== */

/**
 * User's overall mood for the day.
 */
export enum MoodLevel {
  VERY_BAD = "VERY_BAD",
  BAD = "BAD",
  NEUTRAL = "NEUTRAL",
  GOOD = "GOOD",
  VERY_GOOD = "VERY_GOOD",
}

/**
 * How well the user slept.
 */
export enum SleepQuality {
  VERY_POOR = "VERY_POOR",
  POOR = "POOR",
  FAIR = "FAIR",
  GOOD = "GOOD",
  EXCELLENT = "EXCELLENT",
}

/**
 * User's stress level.
 */
export enum StressLevel {
  NONE = "NONE",
  LOW = "LOW",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
  VERY_HIGH = "VERY_HIGH",
}

/**
 * User's energy level.
 */
export enum EnergyLevel {
  VERY_LOW = "VERY_LOW",
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  VERY_HIGH = "VERY_HIGH",
}

/**
 * General daily activity level.
 */
export enum ActivityLevel {
  SEDENTARY = "SEDENTARY",
  LIGHT = "LIGHT",
  MODERATE = "MODERATE",
  ACTIVE = "ACTIVE",
  VERY_ACTIVE = "VERY_ACTIVE",
}

/**
 * Pain severity.
 */
export enum PainLevel {
  NONE = "NONE",
  MILD = "MILD",
  MODERATE = "MODERATE",
  SEVERE = "SEVERE",
  VERY_SEVERE = "VERY_SEVERE",
}

/**
 * Hydration progress.
 */
export enum HydrationStatus {
  NOT_MET = "NOT_MET",
  PARTIAL = "PARTIAL",
  MET = "MET",
  EXCEEDED = "EXCEEDED",
}

/**
 * Status of a daily goal.
 */
export enum GoalStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

/**
 * Where the health data came from.
 */
export enum DailyLogSource {
  MANUAL = "MANUAL",
  DEVICE = "DEVICE",
  HEALTH_APP = "HEALTH_APP",
  MIXED = "MIXED",
}


/* ==================================================================
   DAILY HEALTH LOG
   ================================================================== */

export interface DailyHealthLog {
  dailyhealthlogid: string;

  userId: string;

  /**
   * One daily record per user.
   */
  date: Date | string;


  // ================================================================
  // DAILY WELLNESS CHECK-IN
  // ================================================================

  mood?: MoodLevel | null;

  sleepQuality?: SleepQuality | null;

  stressLevel?: StressLevel | null;

  energyLevel?: EnergyLevel | null;

  activityLevel?: ActivityLevel | null;

  painLevel?: PainLevel | null;

  painAreas?: string | null;

  notes?: string | null;


  // ================================================================
  // ACTIVITY & FITNESS
  // ================================================================

  /**
   * Can be manually entered or automatically synced.
   */
  steps: number;

  distanceKm: number;

  distanceMeters: number;

  activeMinutes: number;

  caloriesBurned: number;

  floorsClimbed: number;


  // ================================================================
  // BODY MEASUREMENTS
  // ================================================================

  weightKg?: number | null;

  bodyFatPercent?: number | null;

  muscleMassKg?: number | null;

  waterPercent?: number | null;

  bmi?: number | null;

  measurementRecordedAt?: Date | string | null;


  // ================================================================
  // NUTRITION
  // ================================================================

  caloriesIntake: number;

  proteinG?: number | null;

  carbsG?: number | null;

  fatG?: number | null;

  fiberG?: number | null;

  sugarG?: number | null;


  // ================================================================
  // HYDRATION
  // ================================================================

  waterIntakeMl: number;

  waterGoalMl: number;

  hydrationStatus: HydrationStatus;


  // ================================================================
  // SLEEP
  // ================================================================

  sleepHours?: number | null;

  sleepStart?: Date | string | null;

  sleepEnd?: Date | string | null;


  // ================================================================
  // WELLNESS ACTIVITIES
  // ================================================================

  relaxationMinutes: number;

  meditationMinutes: number;


  // ================================================================
  // DAILY GOALS
  // ================================================================

  stepsGoal: number;

  stepsGoalStatus: GoalStatus;


  waterGoalMlTarget: number;

  waterGoalStatus: GoalStatus;


  activeMinutesGoal: number;

  activeGoalStatus: GoalStatus;


  sleepGoalHours: number;

  sleepGoalStatus: GoalStatus;


  caloriesGoal?: number | null;

  calorieGoalStatus: GoalStatus;


  // ================================================================
  // SOURCE / DEVICE
  // ================================================================

  source: DailyLogSource;

  deviceName?: string | null;


  // ================================================================
  // TIMESTAMPS
  // ================================================================

  createdAt: Date | string;

  updatedAt: Date | string;


  // ================================================================
  // RELATION
  // ================================================================

  user?: User;
}


/* ==================================================================
   DAILY HEALTH LOG INPUT
   ================================================================== */

export interface DailyHealthLogInput {

  /**
   * Normally this should come from authenticated user.
   * Do not trust userId from frontend in production.
   */
  userId: string;

  date: Date | string;


  // ================================================================
  // DAILY WELLNESS CHECK-IN
  // ================================================================

  mood?: MoodLevel;

  sleepQuality?: SleepQuality;

  stressLevel?: StressLevel;

  energyLevel?: EnergyLevel;

  activityLevel?: ActivityLevel;

  painLevel?: PainLevel;

  painAreas?: string;

  notes?: string;


  // ================================================================
  // ACTIVITY
  // ================================================================

  steps?: number;

  distanceKm?: number;

  distanceMeters?: number;

  activeMinutes?: number;

  caloriesBurned?: number;

  floorsClimbed?: number;


  // ================================================================
  // BODY
  // ================================================================

  weightKg?: number;

  bodyFatPercent?: number;

  muscleMassKg?: number;

  waterPercent?: number;

  bmi?: number;

  measurementRecordedAt?: Date | string;


  // ================================================================
  // NUTRITION
  // ================================================================

  caloriesIntake?: number;

  proteinG?: number;

  carbsG?: number;

  fatG?: number;

  fiberG?: number;

  sugarG?: number;


  // ================================================================
  // HYDRATION
  // ================================================================

  waterIntakeMl?: number;

  waterGoalMl?: number;


  // ================================================================
  // SLEEP
  // ================================================================

  sleepHours?: number;

  sleepStart?: Date | string;

  sleepEnd?: Date | string;


  // ================================================================
  // WELLNESS
  // ================================================================

  relaxationMinutes?: number;

  meditationMinutes?: number;


  // ================================================================
  // GOALS
  // ================================================================

  stepsGoal?: number;

  waterGoalMlTarget?: number;

  activeMinutesGoal?: number;

  sleepGoalHours?: number;

  caloriesGoal?: number;


  // ================================================================
  // SOURCE
  // ================================================================

  source?: DailyLogSource;

  deviceName?: string;
}





/* ==================================================================
   20. CONSENT
================================================================== */

export interface Consent {
  consentid: string;
  userId: string;

  grantedToTenantId?: string | null;
  grantedToTenantName?: string | null;
  grantedToBranchId?: string | null;
  grantedToUserId?: string | null;
  grantedToUserName?: string | null;

  scope: ConsentScope;
  status: ConsentStatus;

  grantedAt: Date | string;
  expiresAt?: Date | string | null;
  revokedAt?: Date | string | null;
  revokedReason?: string | null;

  purpose?: string | null;
  notes?: string | null;

  createdAt: Date | string;
  updatedAt: Date | string;

  user?: User;
  grantedToUser?: User | null;
}

export interface ConsentInput {
  userId: string;
  grantedToTenantId?: string;
  grantedToTenantName?: string;
  grantedToBranchId?: string;
  grantedToUserId?: string;
  grantedToUserName?: string;
  scope: ConsentScope;
  status?: ConsentStatus;
  grantedAt?: Date | string;
  expiresAt?: Date | string;
  revokedAt?: Date | string;
  revokedReason?: string;
  purpose?: string;
  notes?: string;
}

/* ==================================================================
   21. DOCUMENT
================================================================== */

export interface Document {
  documentid: string;
  userId: string;
  title: string;
  description?: string | null;
  category: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy?: string | null;
  uploadedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;

  user?: User;
}

export interface DocumentInput {
  userId: string;
  title: string;
  description?: string;
  category: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy?: string;
}

/* ==================================================================
   22. WALLET
================================================================== */

export interface Wallet {
  walletid: string;
  userId: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;

  user?: User;
  transactions?: Transaction[];
}

export interface WalletInput {
  userId: string;
  balance?: number;
  currency?: string;
  isActive?: boolean;
}

/* ==================================================================
   23. TRANSACTION
================================================================== */

export interface Transaction {
  transactionid: string;
  walletId: string;
  userId: string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  paymentMethod?: PaymentMethod | null;

  reference?: string | null;
  description?: string | null;

  facilityName?: string | null;
  facilityId?: string | null;

  metadata?: any | null;

  createdAt: Date | string;
  updatedAt: Date | string;

  wallet?: Wallet;
  user?: User;
}

export interface TransactionInput {
  walletId: string;
  userId: string;
  amount: number;
  currency?: string;
  type: TransactionType;
  status?: TransactionStatus;
  paymentMethod?: PaymentMethod;
  reference?: string;
  description?: string;
  facilityName?: string;
  facilityId?: string;
  metadata?: any;
}

/* ==================================================================
   24. NOTIFICATION
================================================================== */

export interface Notification {
  notificationid: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  channel: NotificationChannel;
  isRead: boolean;
  sentAt?: Date | string | null;
  metadata?: any | null;
  createdAt: Date | string;

  user?: User;
}

export interface NotificationInput {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  channel: NotificationChannel;
  isRead?: boolean;
  sentAt?: Date | string;
  metadata?: any;
}

/* ==================================================================
   25. MESSAGE
================================================================== */

export interface Message {
  messageid: string;
  senderId: string;
  recipientId?: string | null;
  recipientType?: string | null;

  subject?: string | null;
  body: string;
  attachmentUrl?: string | null;
  isRead: boolean;
  readAt?: Date | string | null;

  createdAt: Date | string;

  sender?: User;
}

export interface MessageInput {
  senderId: string;
  recipientId?: string;
  recipientType?: string;
  subject?: string;
  body: string;
  attachmentUrl?: string;
}

/* ==================================================================
   26. SESSION
================================================================== */

export interface Session {
  sessionid: string;
  userId: string;
  refreshToken: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  deviceInfo?: string | null;
  expiresAt: Date | string;
  createdAt: Date | string;
  revokedAt?: Date | string | null;
  // ⚠️ Schema has an extra relation field:
  userUserid?: string | null;
  user?: User | null;
}

export interface SessionInput {
  userId: string;
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
  deviceInfo?: string;
  expiresAt: Date | string;
}

/* ==================================================================
   27. VERIFICATION CODE
================================================================== */

export interface VerificationCode {
  verificationcodeid: string;
  userId?: string | null;
  phone?: string | null;
  email?: string | null;
  code: string;
  purpose: VerificationPurpose;
  expiresAt: Date | string;
  isUsed: boolean;
  createdAt: Date | string;
  // ⚠️ Schema has an extra relation field:
  userUserid?: string | null;
  user?: User | null;
}

export interface VerificationCodeInput {
  userId?: string;
  phone?: string;
  email?: string;
  code: string;
  purpose: VerificationPurpose;
  expiresAt: Date | string;
}

/* ==================================================================
   28. PASSWORD RESET
================================================================== */

export interface PasswordReset {
  passwordresetid: string;
  userId: string;
  token: string;
  expiresAt: Date | string;
  isUsed: boolean;
  createdAt: Date | string;

  user?: User;
}

export interface PasswordResetInput {
  userId: string;
  token: string;
  expiresAt: Date | string;
}

/* ==================================================================
   29. AUDIT LOG
================================================================== */

export interface AuditLog {
  auditlogid: string;
  userId?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  metadata?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date | string;

  user?: User | null;
}

export interface AuditLogInput {
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

/* ==================================================================
   30. PROFESSIONAL PROFILE
================================================================== */

export interface ProfessionalProfile {
  professionalprofileid: string;
  userId: string;
  professionalType: Role;

  licenseNumber?: string | null;
  licenseExpiry?: Date | string | null;
  certifications?: any | null;

  specialization?: string | null;
  subSpecialty?: string | null;
  qualifications?: any | null;

  isPubliclyVisible: boolean;
  publicBio?: string | null;
  publicPhotoUrl?: string | null;
  publicCoverUrl?: string | null;

  yearsOfExperience?: number | null;
  languages: string[];

  consultationFee?: number | null;
  currency: string;

  rating: number;
  totalReviews: number;
  totalPatients: number;

  publicPhone?: string | null;
  publicEmail?: string | null;
  website?: string | null;

  linkedin?: string | null;
  twitter?: string | null;
  facebook?: string | null;

  isVerified: boolean;
  isActive: boolean;
  deletedAt?: Date | string | null;

  createdAt: Date | string;
  updatedAt: Date | string;

  user?: User;
}

export interface ProfessionalProfileInput {
  userId: string;
  professionalType: Role;
  licenseNumber?: string;
  licenseExpiry?: Date | string;
  certifications?: any;
  specialization?: string;
  subSpecialty?: string;
  qualifications?: any;
  isPubliclyVisible?: boolean;
  publicBio?: string;
  publicPhotoUrl?: string;
  publicCoverUrl?: string;
  yearsOfExperience?: number;
  languages?: string[];
  consultationFee?: number;
  currency?: string;
  publicPhone?: string;
  publicEmail?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  isVerified?: boolean;
  isActive?: boolean;
}

/* ==================================================================
   AUTH
================================================================== */

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  tenantId?: number | null;
}

export interface AuthResponse {
  isSuccess: boolean;
  message: string;
  result?: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

/* ==================================================================
   FILTERS
================================================================== */

export interface UserFilters extends BaseFilterParams {
  role?: Role;
  isActive?: boolean;
  isSuspended?: boolean;
  isDeleted?: boolean;
  gender?: Gender;
}

export interface AppointmentFilters extends BaseFilterParams, DateRangeParams {
  userId?: string;
  doctorId?: string;
  facilityId?: string;
  status?: AppointmentStatus;
}

export interface PrescriptionFilters extends BaseFilterParams, DateRangeParams {
  userId?: string;
  doctorId?: string;
  status?: PrescriptionStatus;
}

export interface LabOrderFilters extends BaseFilterParams, DateRangeParams {
  userId?: string;
  doctorId?: string;
  labId?: string;
  status?: LabOrderStatus;
}

export interface VitalSignFilters extends BaseFilterParams, DateRangeParams {
  userId?: string;
  source?: string;
}

export interface NotificationFilters extends BaseFilterParams {
  userId?: string;
  type?: NotificationType;
  channel?: NotificationChannel;
  isRead?: boolean;
}

export interface TransactionFilters extends BaseFilterParams, DateRangeParams {
  userId?: string;
  walletId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
}

export interface AuditLogFilters extends BaseFilterParams, DateRangeParams {
  userId?: string;
  action?: string;
  entity?: string;
}

/* ==================================================================
   DASHBOARD
================================================================== */

export interface DashboardSummary {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  totalPrescriptions: number;
  totalLabOrders: number;
  activeConsents: number;
  pendingAppointments: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  appointments: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    byStatus: Record<AppointmentStatus, number>;
  };
  prescriptions: {
    total: number;
    pending: number;
    dispensed: number;
  };
  labOrders: {
    total: number;
    pending: number;
    completed: number;
  };
  recentActivity: {
    recentUsers: User[];
    recentAppointments: Appointment[];
    recentPrescriptions: Prescription[];
  };
}

export interface DashboardResponse {
  isSuccess: boolean;
  data: DashboardData;
  generatedAt: Date | string;
}

/* ==================================================================
   HELPERS / RESPONSES
================================================================== */

export interface UserResponse {
  isSuccess: boolean;
  message: string;
  user?: User;
}

export interface UsersResponse {
  isSuccess: boolean;
  users: User[];
  total: number;
}

export interface AppointmentResponse {
  isSuccess: boolean;
  appointment?: Appointment;
  message?: string;
}

export interface PrescriptionResponse {
  isSuccess: boolean;
  prescription?: Prescription;
  message?: string;
}

export interface LabOrderResponse {
  isSuccess: boolean;
  labOrder?: LabOrder;
  message?: string;
}

export interface VitalSignResponse {
  isSuccess: boolean;
  vitalSign?: VitalSign;
  message?: string;
}

export interface ConsentResponse {
  isSuccess: boolean;
  consent?: Consent;
  message?: string;
}