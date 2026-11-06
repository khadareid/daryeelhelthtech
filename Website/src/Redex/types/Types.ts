/* Types aligned with Backend Prisma schema */

export type ApiResponse<T = unknown> = {
  isSuccess: boolean
  message?: string
  result?: T
  data?: T
}

export type PageMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type Paginated<T> = {
  items: T[]
  meta: PageMeta
}

export const RoleEnum = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  USER: "USER",
} as const
export type Role = keyof typeof RoleEnum

export const GenderEnum = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
} as const
export type Gender = keyof typeof GenderEnum

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
} as const
export type BloodType = keyof typeof BloodTypeEnum

export const AppointmentStatusEnum = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  RESCHEDULE_REQUESTED: "RESCHEDULE_REQUESTED",
  CONFIRMED: "CONFIRMED",
  CHECKED_IN: "CHECKED_IN",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const
export type AppointmentStatus = keyof typeof AppointmentStatusEnum

export const ConsultationTypeEnum = {
  VIDEO: "VIDEO",
  AUDIO: "AUDIO",
  CHAT: "CHAT",
  IN_PERSON: "IN_PERSON",
} as const
export type ConsultationType = keyof typeof ConsultationTypeEnum

export const ConsultationStatusEnum = {
  SCHEDULED: "SCHEDULED",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const
export type ConsultationStatus = keyof typeof ConsultationStatusEnum

export const PaymentStatusEnum = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  PAID: "PAID",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
  PARTIALLY_REFUNDED: "PARTIALLY_REFUNDED",
} as const
export type PaymentStatus = keyof typeof PaymentStatusEnum

export const PaymentMethodEnum = {
  CASH: "CASH",
  CARD: "CARD",
  MOBILE_MONEY: "MOBILE_MONEY",
  BANK_TRANSFER: "BANK_TRANSFER",
  WALLET: "WALLET",
  ONLINE: "ONLINE",
  OTHER: "OTHER",
} as const
export type PaymentMethod = keyof typeof PaymentMethodEnum

export const NotificationTypeEnum = {
  APPOINTMENT: "APPOINTMENT",
  APPOINTMENT_REMINDER: "APPOINTMENT_REMINDER",
  APPOINTMENT_ACCEPTED: "APPOINTMENT_ACCEPTED",
  APPOINTMENT_REJECTED: "APPOINTMENT_REJECTED",
  CONSULTATION: "CONSULTATION",
  PAYMENT: "PAYMENT",
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  MEDICAL_RECORD: "MEDICAL_RECORD",
  SYSTEM: "SYSTEM",
} as const
export type NotificationType = keyof typeof NotificationTypeEnum

export const NotificationChannelEnum = {
  IN_APP: "IN_APP",
  PUSH: "PUSH",
  SMS: "SMS",
  EMAIL: "EMAIL",
} as const
export type NotificationChannel = keyof typeof NotificationChannelEnum

export const MoodLevelEnum = {
  VERY_BAD: "VERY_BAD",
  BAD: "BAD",
  NEUTRAL: "NEUTRAL",
  GOOD: "GOOD",
  VERY_GOOD: "VERY_GOOD",
} as const
export type MoodLevel = keyof typeof MoodLevelEnum

export const SleepQualityEnum = {
  VERY_POOR: "VERY_POOR",
  POOR: "POOR",
  FAIR: "FAIR",
  GOOD: "GOOD",
  EXCELLENT: "EXCELLENT",
} as const
export type SleepQuality = keyof typeof SleepQualityEnum

export const StressLevelEnum = {
  NONE: "NONE",
  LOW: "LOW",
  MODERATE: "MODERATE",
  HIGH: "HIGH",
  VERY_HIGH: "VERY_HIGH",
} as const
export type StressLevel = keyof typeof StressLevelEnum

export const EnergyLevelEnum = {
  VERY_LOW: "VERY_LOW",
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  VERY_HIGH: "VERY_HIGH",
} as const
export type EnergyLevel = keyof typeof EnergyLevelEnum

export const ActivityLevelEnum = {
  SEDENTARY: "SEDENTARY",
  LIGHT: "LIGHT",
  MODERATE: "MODERATE",
  ACTIVE: "ACTIVE",
  VERY_ACTIVE: "VERY_ACTIVE",
} as const
export type ActivityLevel = keyof typeof ActivityLevelEnum

export const PainLevelEnum = {
  NONE: "NONE",
  MILD: "MILD",
  MODERATE: "MODERATE",
  SEVERE: "SEVERE",
  VERY_SEVERE: "VERY_SEVERE",
} as const
export type PainLevel = keyof typeof PainLevelEnum

export const HydrationStatusEnum = {
  NOT_MET: "NOT_MET",
  PARTIAL: "PARTIAL",
  MET: "MET",
  EXCEEDED: "EXCEEDED",
} as const
export type HydrationStatus = keyof typeof HydrationStatusEnum

export const GoalStatusEnum = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const
export type GoalStatus = keyof typeof GoalStatusEnum

export const DailyLogSourceEnum = {
  MANUAL: "MANUAL",
  HEALTH_CONNECT: "HEALTH_CONNECT",
  DEVICE: "DEVICE",
  MIXED: "MIXED",
} as const
export type DailyLogSource = keyof typeof DailyLogSourceEnum

export const DoctorVerificationStatusEnum = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
  SUSPENDED: "SUSPENDED",
} as const
export type DoctorVerificationStatus = keyof typeof DoctorVerificationStatusEnum

export const ConsentStatusEnum = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  REVOKED: "REVOKED",
  EXPIRED: "EXPIRED",
} as const
export type ConsentStatus = keyof typeof ConsentStatusEnum

export const AccessLevelEnum = {
  VIEW: "VIEW",
  DOWNLOAD: "DOWNLOAD",
  FULL: "FULL",
} as const
export type AccessLevel = keyof typeof AccessLevelEnum

export const AccessRequestTypeEnum = {
  MEDICAL_RECORD: "MEDICAL_RECORD",
  VITALS: "VITALS",
  MEDICATIONS: "MEDICATIONS",
  LAB_RESULTS: "LAB_RESULTS",
  PRESCRIPTIONS: "PRESCRIPTIONS",
  FULL_RECORD: "FULL_RECORD",
} as const
export type AccessRequestType = keyof typeof AccessRequestTypeEnum

export interface User {
  userid: string
  email: string
  phone?: string | null
  fullName: string
  gender?: Gender | null
  dateOfBirth?: string | null
  avatarUrl?: string | null
  picture?: string | null
  healthId?: string | null
  googleId?: string | null
  role: Role | string
  isActive?: boolean
  isSuspended?: boolean
  emailVerified?: boolean
  phoneVerified?: boolean
  language?: string
  timezone?: string
  country?: string | null
  region?: string | null
  city?: string | null
  district?: string | null
  lastLoginAt?: string | null
  lastLogin?: string | null
  createdAt?: string
  updatedAt?: string
  doctor?: Doctor | null
  medicalProfile?: MedicalProfile | null
  emergencyCard?: EmergencyCard | null
}

export type UserInput = {
  email: string
  password: string
  fullName?: string
  name?: string
  phone?: string
  gender?: Gender
  dateOfBirth?: string
}

export type UserUpdateInput = Partial<{
  fullName: string
  phone: string | null
  gender: Gender | null
  dateOfBirth: string | null
  avatarUrl: string | null
  picture: string | null
  language: string
  timezone: string
  country: string | null
  region: string | null
  city: string | null
  district: string | null
}>

export type UserLoginInput = {
  email?: string
  phone?: string
  password: string
}

export type AuthResponse = ApiResponse<{
  user: User
  accessToken: string
  refreshToken: string
}>

export interface MedicalProfile {
  id: string
  userId: string
  bloodType: BloodType | string
  smokingStatus?: string | null
  alcoholUse?: string | null
  exerciseFrequency?: string | null
  dietType?: string | null
  familyHistory?: unknown
  surgicalHistory?: unknown
  notes?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface EmergencyContact {
  id: string
  userId: string
  fullName: string
  relationship: string
  phone: string
  alternatePhone?: string | null
  email?: string | null
  isPrimary?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface EmergencyCard {
  id: string
  userId: string
  cardNumber: string
  bloodType: BloodType | string
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  allergiesSummary?: string | null
  conditionsSummary?: string | null
  medicationsSummary?: string | null
  doctorNotes?: string | null
  qrCode?: string | null
  isActive?: boolean
  lastUpdatedAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface FamilyMember {
  id: string
  userId: string
  linkedUserId?: string | null
  fullName: string
  relationship: string
  dateOfBirth?: string | null
  gender?: Gender | null
  phone?: string | null
  isDependent?: boolean
  canManageHealthRecords?: boolean
  canBookAppointments?: boolean
  canViewMedicalRecords?: boolean
  isEmergencyContact?: boolean
  notes?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Allergy {
  id: string
  userId: string
  allergen: string
  type?: string | null
  severity?: string | null
  reaction?: string | null
  diagnosedAt?: string | null
  isActive?: boolean
  notes?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ChronicCondition {
  id: string
  userId: string
  condition: string
  icdCode?: string | null
  diagnosedAt?: string | null
  severity?: string | null
  isActive?: boolean
  isControlled?: boolean
  notes?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Medication {
  id: string
  userId: string
  name: string
  dosage?: string | null
  frequency?: string | null
  route?: string | null
  startedAt?: string | null
  endedAt?: string | null
  isActive?: boolean
  prescribedBy?: string | null
  reason?: string | null
  notes?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface MedicalRecord {
  id: string
  userId: string
  recordType: string
  title: string
  description?: string | null
  diagnosis?: string | null
  treatment?: string | null
  doctorName?: string | null
  facilityName?: string | null
  recordDate: string
  notes?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface MedicalDocument {
  id: string
  userId: string
  medicalRecordId?: string | null
  title: string
  documentType: string
  fileUrl: string
  fileName?: string | null
  mimeType?: string | null
  fileSize?: number | null
  description?: string | null
  documentDate?: string | null
  isVerified?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Diagnosis {
  id: string
  userId: string
  doctorId?: string | null
  appointmentId?: string | null
  consultationId?: string | null
  diagnosis: string
  icdCode?: string | null
  description?: string | null
  diagnosedAt?: string
  isPrimary?: boolean
  status?: string | null
  notes?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface VitalSign {
  id: string
  userId: string
  temperature?: number | null
  bloodPressureSys?: number | null
  bloodPressureDia?: number | null
  heartRate?: number | null
  respiratoryRate?: number | null
  oxygenSaturation?: number | null
  weight?: number | null
  height?: number | null
  bmi?: number | null
  source?: string
  recordedAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface LabResult {
  id: string
  userId: string
  doctorId?: string | null
  appointmentId?: string | null
  testName: string
  testCode?: string | null
  category?: string | null
  resultValue?: string | null
  unit?: string | null
  referenceRange?: string | null
  status?: string | null
  interpretation?: string | null
  labName?: string | null
  resultDate: string
  documentUrl?: string | null
  notes?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface PrescriptionItem {
  id: string
  prescriptionId: string
  medicineName: string
  dosage?: string | null
  frequency?: string | null
  route?: string | null
  duration?: string | null
  quantity?: string | null
  instructions?: string | null
  isActive?: boolean
}

export interface Prescription {
  id: string
  userId: string
  doctorId?: string | null
  appointmentId?: string | null
  consultationId?: string | null
  prescriptionNumber: string
  issuedAt?: string
  startDate?: string | null
  endDate?: string | null
  status?: string
  notes?: string | null
  items?: PrescriptionItem[]
  createdAt?: string
  updatedAt?: string
}

export interface DailyHealthLog {
  id: string
  userId: string
  date: string
  mood?: MoodLevel | null
  sleepQuality?: SleepQuality | null
  stressLevel?: StressLevel | null
  energyLevel?: EnergyLevel | null
  activityLevel?: ActivityLevel | null
  painLevel?: PainLevel | null
  notes?: string | null
  steps?: number
  distanceKm?: number
  activeMinutes?: number
  caloriesBurned?: number
  heartRateAvg?: number | null
  heartRateMin?: number | null
  heartRateMax?: number | null
  weightKg?: number | null
  bodyFatPercent?: number | null
  bmi?: number | null
  oxygenSaturation?: number | null
  waterIntakeMl?: number
  waterGoalMl?: number
  hydrationStatus?: HydrationStatus
  sleepHours?: number | null
  sleepStart?: string | null
  sleepEnd?: string | null
  stepsGoal?: number
  stepsGoalStatus?: GoalStatus
  waterGoalStatus?: GoalStatus
  activeMinutesGoal?: number
  activeGoalStatus?: GoalStatus
  sleepGoalHours?: number
  sleepGoalStatus?: GoalStatus
  source?: DailyLogSource
  deviceName?: string | null
  createdAt?: string
  updatedAt?: string
}

export type DailyHealthLogInput = Partial<
  Omit<DailyHealthLog, "id" | "userId" | "createdAt" | "updatedAt">
> & { date: string }

export interface HealthDevice {
  id: string
  userId: string
  provider: string
  deviceName?: string | null
  providerUserId?: string | null
  scopes?: string[]
  isActive?: boolean
  lastSyncAt?: string | null
  lastError?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Doctor {
  id: string
  userId: string
  fullName: string
  profileImage?: string | null
  gender?: Gender | null
  specialty: string
  subSpecialty?: string | null
  qualification?: string | null
  university?: string | null
  yearsExperience?: number | null
  bio?: string | null
  languages?: string[]
  licenseNumber?: string | null
  licenseAuthority?: string | null
  verificationStatus?: DoctorVerificationStatus | string
  verifiedAt?: string | null
  rejectionReason?: string | null
  consultationEnabled?: boolean
  videoConsultationEnabled?: boolean
  chatConsultationEnabled?: boolean
  consultationFee?: number | string | null
  videoConsultationFee?: number | string | null
  chatConsultationFee?: number | string | null
  currency?: string
  isAvailable?: boolean
  isOnline?: boolean
  isActive?: boolean
  clinicName?: string | null
  city?: string | null
  country?: string | null
  rating?: number | string | null
  reviewCount?: number
  createdAt?: string
  updatedAt?: string
  user?: Pick<User, "userid" | "fullName" | "email" | "phone" | "avatarUrl">
}

export interface Appointment {
  id: string
  userId: string
  doctorId?: string | null
  appointmentCode: string
  scheduledAt: string
  duration?: number
  reason?: string | null
  notes?: string | null
  status: AppointmentStatus | string
  meetingLink?: string | null
  paymentRequired?: boolean
  consultationFee?: number | string | null
  currency?: string
  paymentStatus?: PaymentStatus | string
  reminderSent?: boolean
  reminderAt?: string | null
  requestedAt?: string
  confirmedAt?: string | null
  cancelledAt?: string | null
  cancellationReason?: string | null
  createdAt?: string
  updatedAt?: string
  doctor?: Doctor | null
  user?: Pick<User, "userid" | "fullName" | "email" | "phone" | "healthId">
}

export interface Consultation {
  id: string
  consultationCode: string
  userId: string
  doctorId?: string | null
  appointmentId?: string | null
  type: ConsultationType | string
  status: ConsultationStatus | string
  scheduledAt?: string | null
  startedAt?: string | null
  endedAt?: string | null
  meetingLink?: string | null
  summary?: string | null
  diagnosisSummary?: string | null
  treatmentPlan?: string | null
  patientNotes?: string | null
  doctorNotes?: string | null
  followUpAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface DoctorReview {
  id: string
  userId: string
  doctorId: string
  appointmentId?: string | null
  rating: number
  comment?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Payment {
  id: string
  userId: string
  appointmentId?: string | null
  amount: number | string
  currency?: string
  method?: PaymentMethod | string
  status: PaymentStatus | string
  provider?: string | null
  providerRef?: string | null
  paymentReference?: string | null
  transactionId?: string | null
  paidAt?: string | null
  refundReason?: string | null
  failureReason?: string | null
  createdAt?: string
  updatedAt?: string
  appointment?: Appointment | null
  user?: Pick<User, "userid" | "fullName" | "email" | "phone"> | null
}

export interface Notification {
  id: string
  notificationid?: string
  userId: string
  title: string
  body: string
  type: NotificationType | string
  channel?: NotificationChannel | string
  isRead?: boolean
  readAt?: string | null
  data?: unknown
  createdAt?: string
  updatedAt?: string
}

export interface Consent {
  id: string
  userId: string
  scope?: string
  status: ConsentStatus | string
  grantedTo?: string | null
  expiresAt?: string | null
  notes?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface AccessRequest {
  id: string
  requesterId: string
  patientId: string
  requestType: AccessRequestType | string
  accessLevel?: AccessLevel | string
  status: ConsentStatus | string
  reason?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface AuditLog {
  id: string
  userId?: string | null
  action: string
  entity?: string | null
  entityId?: string | null
  description?: string | null
  meta?: unknown
  metadata?: unknown
  createdAt?: string
  user?: Pick<User, "userid" | "fullName" | "email" | "role"> | null
}

export interface AdminDashboardStats {
  users: number
  doctors: number
  appointments: number
  consultations: number
  payments: number
  pendingDoctors: number
  pendingAppointments?: number
  confirmedAppointments?: number
  completedAppointments?: number
  cancelledAppointments?: number
  noShowAppointments?: number
  recentAppointments?: Appointment[]
  patients?: number
  admins?: number
  superAdmins?: number
  suspendedUsers?: number
  verifiedDoctors?: number
  rejectedDoctors?: number
  suspendedDoctors?: number
  paidPayments?: number
  pendingPayments?: number
  failedPayments?: number
  refundedPayments?: number
  freePayments?: number
  revenuePaid?: number
  notifications?: number
  unreadNotifications?: number
  auditLogs?: number
  medications?: number
  labResults?: number
  medicalRecords?: number
  familyMembers?: number
  emergencyCards?: number
  recentUsers?: Array<{
    userid: string
    fullName: string
    email: string
    role: string
    isSuspended?: boolean
    createdAt?: string
  }>
  recentPayments?: Payment[]
}
