import {
  PrismaClient,
  AppointmentStatus,
  BloodType,
  ConsultationStatus,
  ConsultationType,
  DailyLogSource,
  DoctorVerificationStatus,
  Gender,
  GoalStatus,
  HydrationStatus,
  MoodLevel,
  SleepQuality,
  StressLevel,
  EnergyLevel,
  ActivityLevel,
  PainLevel,
  PaymentMethod,
  PaymentStatus,
  Role,
  NotificationType,
  NotificationChannel,
  ConsentStatus,
  AccessLevel,
  AccessRequestType,
  AuditAction,
} from "@prisma/client";

import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "Daryeel@123";

async function main() {
  console.log("🌱 Starting Daryeel Health database seed...\n");

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // ============================================================
  // 1. USERS
  // ============================================================

  console.log("👤 Creating users...");

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@daryeel.so" },
    update: {
      fullName: "Daryeel Super Admin",
      role: Role.SUPER_ADMIN,
      isActive: true,
      isSuspended: false,
      emailVerified: true,
      phoneVerified: true,
      passwordHash,
    },
    create: {
      email: "superadmin@daryeel.so",
      phone: "+252634000001",
      passwordHash,
      fullName: "Daryeel Super Admin",
      role: Role.SUPER_ADMIN,
      isActive: true,
      isSuspended: false,
      emailVerified: true,
      phoneVerified: true,
      language: "so",
      timezone: "Africa/Mogadishu",
      country: "Somaliland",
      city: "Hargeisa",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@daryeel.so" },
    update: {
      fullName: "Daryeel Administrator",
      role: Role.ADMIN,
      isActive: true,
      passwordHash,
    },
    create: {
      email: "admin@daryeel.so",
      phone: "+252634000002",
      passwordHash,
      fullName: "Daryeel Administrator",
      role: Role.ADMIN,
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      language: "so",
      timezone: "Africa/Mogadishu",
      country: "Somaliland",
      city: "Hargeisa",
    },
  });

  const admin2 = await prisma.user.upsert({
    where: { email: "admin2@daryeel.so" },
    update: {
      fullName: "Daryeel Health Manager",
      role: Role.ADMIN,
      isActive: true,
      passwordHash,
    },
    create: {
      email: "admin2@daryeel.so",
      phone: "+252634000003",
      passwordHash,
      fullName: "Daryeel Health Manager",
      role: Role.ADMIN,
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      language: "so",
      timezone: "Africa/Mogadishu",
      country: "Somaliland",
      city: "Hargeisa",
    },
  });

  const patient = await prisma.user.upsert({
    where: { email: "patient@daryeel.so" },
    update: {
      fullName: "Ayaan Mohamed",
      healthId: "DYL-000001",
      role: Role.USER,
      passwordHash,
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
    },
    create: {
      email: "patient@daryeel.so",
      phone: "+252634000004",
      passwordHash,
      fullName: "Ayaan Mohamed",
      gender: Gender.FEMALE,
      dateOfBirth: new Date("1998-05-15"),
      healthId: "DYL-000001",
      role: Role.USER,
      isActive: true,
      isSuspended: false,
      emailVerified: true,
      phoneVerified: true,
      language: "so",
      timezone: "Africa/Mogadishu",
      country: "Somaliland",
      region: "Maroodi Jeex",
      city: "Hargeisa",
      district: "26 June",
    },
  });

  // ============================================================
  // 1c. ROLES (PlatformRole — RBAC permissions for ADMIN vs SUPER_ADMIN)
  // ============================================================

  console.log("🔐 Seeding platform roles & permissions...");

  const roleData = [
    {
      name: "SUPER_ADMIN",
      description: "Full access",
      isSystem: true,
      permissions: ["*"],
    },
    {
      name: "ADMIN",
      description: "Platform admin",
      isSystem: true,
      permissions: [
        "user:read",
        "user:update",
        "user:suspend",
        "user:password_reset",
        "doctor:read",
        "doctor:verify",
        "doctor:suspend",
        "appointment:read",
        "appointment:update",
        "payment:read",
        "payment:refund",
        "audit:read",
        "settings:read",
        "settings:update",
      ],
    },
    {
      name: "DOCTOR_VERIFIER",
      description: "Verify doctors",
      isSystem: false,
      permissions: [
        "doctor:read",
        "doctor:verify",
        "doctor:reject",
        "document:review",
      ],
    },
    {
      name: "FINANCE",
      description: "Payments & refunds",
      isSystem: false,
      permissions: [
        "payment:read",
        "payment:refund",
        "payment:export",
        "appointment:read",
      ],
    },
    {
      name: "AUDITOR",
      description: "Read-only audit",
      isSystem: false,
      permissions: [
        "audit:read",
        "user:read",
        "doctor:read",
        "payment:read",
        "appointment:read",
      ],
    },
    {
      name: "SUPPORT",
      description: "Customer support",
      isSystem: false,
      permissions: [
        "user:read",
        "appointment:read",
        "consultation:read",
        "notification:send",
      ],
    },
  ];

  const seededRoles: Record<string, { id: string; name: string }> = {};
  for (const r of roleData) {
    seededRoles[r.name] = await prisma.platformRole.upsert({
      where: { name: r.name },
      update: {
        description: r.description,
        permissions: r.permissions,
        isSystem: r.isSystem,
      },
      create: r,
    });
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdmin.userid,
        roleId: seededRoles["SUPER_ADMIN"].id,
      },
    },
    update: {},
    create: {
      userId: superAdmin.userid,
      roleId: seededRoles["SUPER_ADMIN"].id,
      assignedBy: superAdmin.userid,
    },
  });

  for (const u of [admin, admin2]) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: u.userid,
          roleId: seededRoles["ADMIN"].id,
        },
      },
      update: {},
      create: {
        userId: u.userid,
        roleId: seededRoles["ADMIN"].id,
        assignedBy: superAdmin.userid,
      },
    });
  }

  // ============================================================
  // 1d. SETTINGS
  // ============================================================

  console.log("⚙️  Seeding platform settings...");

  const settings = [
    {
      key: "app.name",
      value: "Daryeel Health",
      category: "GENERAL",
      isPublic: true,
    },
    {
      key: "app.currency",
      value: "USD",
      category: "PAYMENT",
      isPublic: true,
    },
    {
      key: "app.timezone",
      value: "Africa/Mogadishu",
      category: "GENERAL",
      isPublic: true,
    },
    {
      key: "consultation.default_fee",
      value: 5,
      category: "PAYMENT",
    },
    {
      key: "consultation.max_free_per_day",
      value: 3,
      category: "PAYMENT",
    },
    { key: "sms.enabled", value: true, category: "NOTIFICATION" },
    { key: "email.enabled", value: true, category: "NOTIFICATION" },
    {
      key: "security.session_timeout_minutes",
      value: 60,
      category: "SECURITY",
    },
    {
      key: "security.max_login_attempts",
      value: 5,
      category: "SECURITY",
    },
    {
      key: "feature.video_consultation",
      value: true,
      category: "FEATURE_FLAGS",
      isPublic: true,
    },
    {
      key: "feature.chat_consultation",
      value: true,
      category: "FEATURE_FLAGS",
      isPublic: true,
    },
    {
      key: "feature.health_connect",
      value: true,
      category: "FEATURE_FLAGS",
      isPublic: true,
    },
  ];

  for (const s of settings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: {
        value: s.value,
        category: s.category,
        isPublic: s.isPublic ?? false,
        updatedBy: superAdmin.userid,
      },
      create: {
        key: s.key,
        value: s.value,
        category: s.category,
        isPublic: s.isPublic ?? false,
        updatedBy: superAdmin.userid,
      },
    });
  }

  // ============================================================
  // 1e. FEATURE FLAGS
  // ============================================================

  console.log("🚩 Seeding feature flags...");

  const flags = [
    { key: "video_consultation", isEnabled: true, rolloutPercent: 100 },
    { key: "chat_consultation", isEnabled: true, rolloutPercent: 100 },
    { key: "health_connect_sync", isEnabled: true, rolloutPercent: 100 },
    { key: "ai_symptom_checker", isEnabled: false, rolloutPercent: 0 },
    { key: "family_accounts", isEnabled: true, rolloutPercent: 100 },
    { key: "emergency_qr_card", isEnabled: true, rolloutPercent: 100 },
  ];

  for (const f of flags) {
    await prisma.featureFlag.upsert({
      where: { key: f.key },
      update: f,
      create: f,
    });
  }

  // ============================================================
  // 1b. CLEANUP (idempotency) — safe to re-run seed
  // ============================================================

  console.log("🧹 Cleaning previous seed data for patient...");

  // Delete in dependency order (children first)
  await prisma.doctorVerificationLog.deleteMany({});
  await prisma.doctorDocument.deleteMany({});
  await prisma.adminAction.deleteMany({});
  await prisma.loginAttempt.deleteMany({});
  await prisma.userSession.deleteMany({});
  await prisma.broadcastMessage.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.emergencyCardScan.deleteMany({});

  await prisma.auditLog.deleteMany({});
  await prisma.medicalAccessRequest.deleteMany({ where: { patientId: patient.userid } });
  await prisma.consent.deleteMany({ where: { userId: patient.userid } });
  await prisma.notification.deleteMany({ where: { userId: patient.userid } });
  await prisma.doctorReview.deleteMany({ where: { userId: patient.userid } });
  await prisma.payment.deleteMany({ where: { userId: patient.userid } });
  await prisma.consultation.deleteMany({ where: { userId: patient.userid } });
  await prisma.appointment.deleteMany({ where: { userId: patient.userid } });
  await prisma.prescription.deleteMany({ where: { userId: patient.userid } });
  await prisma.labResult.deleteMany({ where: { userId: patient.userid } });
  await prisma.diagnosis.deleteMany({ where: { userId: patient.userid } });
  await prisma.vitalSign.deleteMany({ where: { userId: patient.userid } });
  await prisma.dailyHealthLog.deleteMany({ where: { userId: patient.userid } });
  await prisma.healthDeviceConnection.deleteMany({ where: { userId: patient.userid } });
  await prisma.medicalDocument.deleteMany({ where: { userId: patient.userid } });
  await prisma.medicalRecord.deleteMany({ where: { userId: patient.userid } });
  await prisma.medication.deleteMany({ where: { userId: patient.userid } });
  await prisma.chronicCondition.deleteMany({ where: { userId: patient.userid } });
  await prisma.allergy.deleteMany({ where: { userId: patient.userid } });
  await prisma.familyMember.deleteMany({ where: { userId: patient.userid } });
  await prisma.emergencyContact.deleteMany({ where: { userId: patient.userid } });

  // Re-assign RBAC roles after cleanup wiped userRole rows
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdmin.userid,
        roleId: seededRoles["SUPER_ADMIN"].id,
      },
    },
    update: {},
    create: {
      userId: superAdmin.userid,
      roleId: seededRoles["SUPER_ADMIN"].id,
      assignedBy: superAdmin.userid,
    },
  });
  for (const u of [admin, admin2]) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: u.userid,
          roleId: seededRoles["ADMIN"].id,
        },
      },
      update: {},
      create: {
        userId: u.userid,
        roleId: seededRoles["ADMIN"].id,
        assignedBy: superAdmin.userid,
      },
    });
  }

  // ============================================================
  // 2. MEDICAL PROFILE
  // ============================================================

  console.log("🩺 Creating medical profile...");

  await prisma.medicalProfile.upsert({
    where: { userId: patient.userid },
    update: {
      bloodType: BloodType.O_POSITIVE,
      smokingStatus: "NEVER",
      alcoholUse: "NONE",
      exerciseFrequency: "3-4 TIMES WEEKLY",
      dietType: "BALANCED",
      familyHistory: {
        diabetes: true,
        hypertension: true,
        heartDisease: false,
      },
      surgicalHistory: [],
      notes: "Sample Daryeel Health patient profile.",
    },
    create: {
      userId: patient.userid,
      bloodType: BloodType.O_POSITIVE,
      smokingStatus: "NEVER",
      alcoholUse: "NONE",
      exerciseFrequency: "3-4 TIMES WEEKLY",
      dietType: "BALANCED",
      familyHistory: {
        diabetes: true,
        hypertension: true,
        heartDisease: false,
      },
      surgicalHistory: [],
      notes: "Sample Daryeel Health patient profile.",
    },
  });

  // ============================================================
  // 3. EMERGENCY CONTACT
  // ============================================================

  await prisma.emergencyContact.create({
    data: {
      userId: patient.userid,
      fullName: "Mohamed Ahmed",
      relationship: "Brother",
      phone: "+252634000010",
      alternatePhone: "+252634000011",
      email: "mohamed.family@daryeel.so",
      isPrimary: true,
    },
  });

  // ============================================================
  // 4. EMERGENCY CARD
  // ============================================================

  await prisma.emergencyCard.upsert({
    where: { userId: patient.userid },
    update: {
      bloodType: BloodType.O_POSITIVE,
      emergencyContactName: "Mohamed Ahmed",
      emergencyContactPhone: "+252634000010",
      allergiesSummary: "Penicillin",
      conditionsSummary: "Mild asthma",
      medicationsSummary: "Salbutamol inhaler when needed",
      doctorNotes: "Emergency medical information for Daryeel patient.",
      isActive: true,
      lastUpdatedAt: new Date(),
    },
    create: {
      userId: patient.userid,
      cardNumber: "DYL-EMR-000001",
      bloodType: BloodType.O_POSITIVE,
      emergencyContactName: "Mohamed Ahmed",
      emergencyContactPhone: "+252634000010",
      allergiesSummary: "Penicillin",
      conditionsSummary: "Mild asthma",
      medicationsSummary: "Salbutamol inhaler when needed",
      doctorNotes: "Emergency medical information for Daryeel patient.",
      qrCode: "DARYEEL-QR-DYL-000001",
      isActive: true,
    },
  });

  // ============================================================
  // 5. FAMILY MEMBERS
  // ============================================================

  await prisma.familyMember.createMany({
    data: [
      {
        userId: patient.userid,
        fullName: "Mohamed Ahmed",
        relationship: "Brother",
        dateOfBirth: new Date("1994-03-20"),
        gender: Gender.MALE,
        phone: "+252634000010",
        isDependent: false,
        canManageHealthRecords: true,
        canBookAppointments: true,
        canViewMedicalRecords: true,
        isEmergencyContact: true,
        notes: "Primary family contact.",
      },
      {
        userId: patient.userid,
        fullName: "Hodan Mohamed",
        relationship: "Mother",
        dateOfBirth: new Date("1970-07-12"),
        gender: Gender.FEMALE,
        phone: "+252634000012",
        isDependent: false,
        canManageHealthRecords: true,
        canBookAppointments: true,
        canViewMedicalRecords: true,
        isEmergencyContact: false,
        notes: "Family health member.",
      },
      {
        userId: patient.userid,
        fullName: "Abdi Mohamed",
        relationship: "Son",
        dateOfBirth: new Date("2020-09-10"),
        gender: Gender.MALE,
        phone: null,
        isDependent: true,
        canManageHealthRecords: false,
        canBookAppointments: false,
        canViewMedicalRecords: false,
        isEmergencyContact: false,
        notes: "Dependent family member.",
      },
    ],
  });

  // ============================================================
  // 6. ALLERGIES
  // ============================================================

  await prisma.allergy.createMany({
    data: [
      {
        userId: patient.userid,
        allergen: "Penicillin",
        type: "Medication",
        severity: "Moderate",
        reaction: "Skin rash",
        diagnosedAt: new Date("2018-02-10"),
        isActive: true,
        notes: "Avoid penicillin antibiotics.",
      },
      {
        userId: patient.userid,
        allergen: "Dust",
        type: "Environmental",
        severity: "Mild",
        reaction: "Sneezing",
        diagnosedAt: new Date("2020-06-15"),
        isActive: true,
        notes: "Seasonal/environmental allergy.",
      },
    ],
  });

  // ============================================================
  // 7. CHRONIC CONDITIONS
  // ============================================================

  await prisma.chronicCondition.createMany({
    data: [
      {
        userId: patient.userid,
        condition: "Mild Asthma",
        icdCode: "J45.909",
        diagnosedAt: new Date("2019-04-12"),
        severity: "Mild",
        isActive: true,
        isControlled: true,
        notes: "Controlled asthma.",
      },
      {
        userId: patient.userid,
        condition: "Vitamin D Deficiency",
        icdCode: "E55.9",
        diagnosedAt: new Date("2024-01-20"),
        severity: "Mild",
        isActive: true,
        isControlled: true,
        notes: "Managed with supplementation.",
      },
    ],
  });

  // ============================================================
  // 8. MEDICATIONS
  // ============================================================

  await prisma.medication.createMany({
    data: [
      {
        userId: patient.userid,
        name: "Salbutamol",
        dosage: "100 mcg",
        frequency: "As needed",
        route: "Inhalation",
        startedAt: new Date("2019-04-12"),
        isActive: true,
        prescribedBy: "Dr. Khalid Omar",
        reason: "Asthma",
        notes: "Use when experiencing asthma symptoms.",
      },
      {
        userId: patient.userid,
        name: "Vitamin D3",
        dosage: "1000 IU",
        frequency: "Once daily",
        route: "Oral",
        startedAt: new Date("2024-01-20"),
        isActive: true,
        prescribedBy: "Dr. Nasteexo Ahmed",
        reason: "Vitamin D deficiency",
        notes: "Take after meal.",
      },
    ],
  });

  // ============================================================
  // 9. MEDICAL RECORDS
  // ============================================================

  const medicalRecord1 = await prisma.medicalRecord.create({
    data: {
      userId: patient.userid,
      recordType: "CONSULTATION",
      title: "General Medical Consultation",
      description: "Routine medical consultation.",
      diagnosis: "Mild asthma",
      treatment: "Continue prescribed inhaler.",
      doctorName: "Dr. Nasteexo Ahmed",
      facilityName: "Daryeel Premium Clinic",
      recordDate: new Date("2026-10-20"),
      notes: "Patient stable.",
    },
  });

  const medicalRecord2 = await prisma.medicalRecord.create({
    data: {
      userId: patient.userid,
      recordType: "LAB_RESULT",
      title: "Routine Blood Test",
      description: "Routine blood investigation.",
      diagnosis: null,
      treatment: null,
      doctorName: "Dr. Khalid Omar",
      facilityName: "Daryeel Premium Medical Center",
      recordDate: new Date("2026-10-25"),
      notes: "Routine laboratory examination.",
    },
  });

  // ============================================================
  // 10. MEDICAL DOCUMENTS
  // ============================================================

  await prisma.medicalDocument.createMany({
    data: [
      {
        userId: patient.userid,
        medicalRecordId: medicalRecord1.id,
        title: "Consultation Report",
        documentType: "CONSULTATION_REPORT",
        fileUrl: "https://example.com/daryeel/consultation-report.pdf",
        fileName: "consultation-report.pdf",
        mimeType: "application/pdf",
        fileSize: 245000,
        description: "Sample consultation document.",
        documentDate: new Date("2026-10-20"),
        isVerified: true,
      },
      {
        userId: patient.userid,
        medicalRecordId: medicalRecord2.id,
        title: "Blood Test Report",
        documentType: "LAB_RESULT",
        fileUrl: "https://example.com/daryeel/blood-test.pdf",
        fileName: "blood-test.pdf",
        mimeType: "application/pdf",
        fileSize: 185000,
        description: "Sample laboratory report.",
        documentDate: new Date("2026-10-25"),
        isVerified: true,
      },
    ],
  });

  // ============================================================
  // 11. DOCTORS
  // ============================================================

  console.log("👨‍⚕️ Creating doctors...");

  const doctors = [
    // ---------------- FREE DOCTORS ----------------
    {
      email: "dr.abdi@daryeel.so",
      phone: "+252634100101",
      fullName: "Dr. Abdi Hassan",
      gender: Gender.MALE,
      specialty: "General Medicine",
      subSpecialty: "Primary Care",
      qualification: "MBBS",
      university: "University of Hargeisa",
      yearsExperience: 5,
      languages: ["Somali", "English"],
      clinicName: "Daryeel General Clinic",
    },
    {
      email: "dr.ahmed@daryeel.so",
      phone: "+252634100102",
      fullName: "Dr. Ahmed Ali",
      gender: Gender.MALE,
      specialty: "Internal Medicine",
      subSpecialty: "Adult Medicine",
      qualification: "MBBS, MD",
      university: "Amoud University",
      yearsExperience: 8,
      languages: ["Somali", "English"],
      clinicName: "Daryeel Medical Center",
    },
    {
      email: "dr.hibo@daryeel.so",
      phone: "+252634100103",
      fullName: "Dr. Hibo Mohamed",
      gender: Gender.FEMALE,
      specialty: "Pediatrics",
      subSpecialty: "Child Health",
      qualification: "MBBS",
      university: "Amoud University",
      yearsExperience: 7,
      languages: ["Somali", "English"],
      clinicName: "Daryeel Children's Clinic",
    },
    {
      email: "dr.ilyas@daryeel.so",
      phone: "+252634100104",
      fullName: "Dr. Ilyas Omar",
      gender: Gender.MALE,
      specialty: "Dermatology",
      subSpecialty: "Skin Health",
      qualification: "MBBS, Dermatology",
      university: "University of Hargeisa",
      yearsExperience: 9,
      languages: ["Somali", "English", "Arabic"],
      clinicName: "Daryeel Skin Clinic",
    },
    {
      email: "dr.fatima@daryeel.so",
      phone: "+252634100105",
      fullName: "Dr. Fatima Yusuf",
      gender: Gender.FEMALE,
      specialty: "Gynecology",
      subSpecialty: "Women's Health",
      qualification: "MBBS",
      university: "Amoud University",
      yearsExperience: 10,
      languages: ["Somali", "English"],
      clinicName: "Daryeel Women's Clinic",
    },
    {
      email: "dr.mohamed@daryeel.so",
      phone: "+252634100106",
      fullName: "Dr. Mohamed Ismail",
      gender: Gender.MALE,
      specialty: "Cardiology",
      subSpecialty: "Heart Health",
      qualification: "MBBS",
      university: "University of Hargeisa",
      yearsExperience: 12,
      languages: ["Somali", "English"],
      clinicName: "Daryeel Heart Clinic",
    },
    {
      email: "dr.asiya@daryeel.so",
      phone: "+252634100107",
      fullName: "Dr. Asiya Ahmed",
      gender: Gender.FEMALE,
      specialty: "Psychiatry",
      subSpecialty: "Mental Health",
      qualification: "MBBS",
      university: "Amoud University",
      yearsExperience: 6,
      languages: ["Somali", "English"],
      clinicName: "Daryeel Mental Wellness",
    },
    {
      email: "dr.yasin@daryeel.so",
      phone: "+252634100108",
      fullName: "Dr. Yasin Abdullahi",
      gender: Gender.MALE,
      specialty: "Orthopedics",
      subSpecialty: "Bone & Joint Health",
      qualification: "MBBS",
      university: "University of Hargeisa",
      yearsExperience: 11,
      languages: ["Somali", "English"],
      clinicName: "Daryeel Orthopedic Center",
    },
    {
      email: "dr.maryan@daryeel.so",
      phone: "+252634100109",
      fullName: "Dr. Maryan Hassan",
      gender: Gender.FEMALE,
      specialty: "Family Medicine",
      subSpecialty: "Family Care",
      qualification: "MBBS",
      university: "Amoud University",
      yearsExperience: 7,
      languages: ["Somali", "English"],
      clinicName: "Daryeel Family Clinic",
    },
    {
      email: "dr.osman@daryeel.so",
      phone: "+252634100110",
      fullName: "Dr. Osman Ali",
      gender: Gender.MALE,
      specialty: "ENT",
      subSpecialty: "Ear, Nose & Throat",
      qualification: "MBBS",
      university: "University of Hargeisa",
      yearsExperience: 8,
      languages: ["Somali", "English", "Arabic"],
      clinicName: "Daryeel ENT Center",
    },
    {
      email: "dr.sahra@daryeel.so",
      phone: "+252634100111",
      fullName: "Dr. Sahra Ahmed",
      gender: Gender.FEMALE,
      specialty: "Nutrition",
      subSpecialty: "Clinical Nutrition",
      qualification: "BSc Nutrition",
      university: "Amoud University",
      yearsExperience: 5,
      languages: ["Somali", "English"],
      clinicName: "Daryeel Nutrition Center",
    },
    {
      email: "dr.bashir@daryeel.so",
      phone: "+252634100112",
      fullName: "Dr. Bashir Mohamed",
      gender: Gender.MALE,
      specialty: "General Surgery",
      subSpecialty: "Surgical Care",
      qualification: "MBBS",
      university: "University of Hargeisa",
      yearsExperience: 13,
      languages: ["Somali", "English"],
      clinicName: "Daryeel Surgical Center",
    },
    {
      email: "dr.deeqo@daryeel.so",
      phone: "+252634100113",
      fullName: "Dr. Deeqo Yusuf",
      gender: Gender.FEMALE,
      specialty: "Ophthalmology",
      subSpecialty: "Eye Health",
      qualification: "MBBS",
      university: "Amoud University",
      yearsExperience: 9,
      languages: ["Somali", "English"],
      clinicName: "Daryeel Eye Center",
    },
    {
      email: "dr.jama@daryeel.so",
      phone: "+252634100114",
      fullName: "Dr. Jama Ahmed",
      gender: Gender.MALE,
      specialty: "Urology",
      subSpecialty: "Urinary Health",
      qualification: "MBBS",
      university: "University of Hargeisa",
      yearsExperience: 10,
      languages: ["Somali", "English"],
      clinicName: "Daryeel Urology Center",
    },
    {
      email: "dr.nimco@daryeel.so",
      phone: "+252634100115",
      fullName: "Dr. Nimco Abdi",
      gender: Gender.FEMALE,
      specialty: "Endocrinology",
      subSpecialty: "Diabetes & Hormones",
      qualification: "MBBS",
      university: "Amoud University",
      yearsExperience: 8,
      languages: ["Somali", "English"],
      clinicName: "Daryeel Diabetes Center",
    },
    {
      email: "dr.yusuf@daryeel.so",
      phone: "+252634100116",
      fullName: "Dr. Yusuf Hassan",
      gender: Gender.MALE,
      specialty: "Neurology",
      subSpecialty: "Brain & Nervous System",
      qualification: "MBBS",
      university: "University of Hargeisa",
      yearsExperience: 12,
      languages: ["Somali", "English"],
      clinicName: "Daryeel Neuro Center",
    },
    {
      email: "dr.rahma@daryeel.so",
      phone: "+252634100117",
      fullName: "Dr. Rahma Ali",
      gender: Gender.FEMALE,
      specialty: "Dentistry",
      subSpecialty: "General Dentistry",
      qualification: "DDS",
      university: "Amoud University",
      yearsExperience: 6,
      languages: ["Somali", "English"],
      clinicName: "Daryeel Dental Center",
    },
    {
      email: "dr.muse@daryeel.so",
      phone: "+252634100118",
      fullName: "Dr. Muse Ibrahim",
      gender: Gender.MALE,
      specialty: "Radiology",
      subSpecialty: "Diagnostic Imaging",
      qualification: "MBBS",
      university: "University of Hargeisa",
      yearsExperience: 10,
      languages: ["Somali", "English"],
      clinicName: "Daryeel Diagnostic Center",
    },
    {
      email: "dr.hani@daryeel.so",
      phone: "+252634100119",
      fullName: "Dr. Hani Mohamed",
      gender: Gender.FEMALE,
      specialty: "Emergency Medicine",
      subSpecialty: "Emergency Care",
      qualification: "MBBS",
      university: "Amoud University",
      yearsExperience: 7,
      languages: ["Somali", "English"],
      clinicName: "Daryeel Emergency Center",
    },
    {
      email: "dr.abdirahman@daryeel.so",
      phone: "+252634100120",
      fullName: "Dr. Abdirahman Omar",
      gender: Gender.MALE,
      specialty: "Infectious Disease",
      subSpecialty: "Infection Management",
      qualification: "MBBS",
      university: "University of Hargeisa",
      yearsExperience: 9,
      languages: ["Somali", "English", "Arabic"],
      clinicName: "Daryeel Infectious Disease Center",
    },

    // ---------------- PAID DOCTORS ----------------
    {
      email: "dr.nasteexo@daryeel.so",
      phone: "+252634100121",
      fullName: "Dr. Nasteexo Ahmed",
      gender: Gender.FEMALE,
      specialty: "General Medicine",
      subSpecialty: "Primary Care",
      qualification: "MBBS",
      university: "Amoud University",
      yearsExperience: 6,
      languages: ["Somali", "English"],
      clinicName: "Daryeel Premium Clinic",
      consultationFee: 5,
      videoConsultationFee: 5,
      chatConsultationFee: 5,
    },
    {
      email: "dr.khalid@daryeel.so",
      phone: "+252634100122",
      fullName: "Dr. Khalid Omar",
      gender: Gender.MALE,
      specialty: "Internal Medicine",
      subSpecialty: "Chronic Disease Management",
      qualification: "MBBS, MD",
      university: "University of Hargeisa",
      yearsExperience: 11,
      languages: ["Somali", "English", "Arabic"],
      clinicName: "Daryeel Premium Medical Center",
      consultationFee: 10,
      videoConsultationFee: 10,
      chatConsultationFee: 10,
    },
    {
      email: "dr.umar@daryeel.so",
      phone: "+252634100123",
      fullName: "Dr. Umar Hassan",
      gender: Gender.MALE,
      specialty: "Cardiology",
      subSpecialty: "Heart & Cardiovascular Health",
      qualification: "MBBS, Cardiology",
      university: "University of Hargeisa",
      yearsExperience: 14,
      languages: ["Somali", "English"],
      clinicName: "Daryeel Heart Center",
      consultationFee: 15,
      videoConsultationFee: 15,
      chatConsultationFee: 15,
    },
    {
      email: "dr.samira@daryeel.so",
      phone: "+252634100124",
      fullName: "Dr. Samira Abdullahi",
      gender: Gender.FEMALE,
      specialty: "Gynecology",
      subSpecialty: "Women's Health & Maternal Care",
      qualification: "MBBS, Gynecology",
      university: "Amoud University",
      yearsExperience: 13,
      languages: ["Somali", "English", "Arabic"],
      clinicName: "Daryeel Women's Center",
      consultationFee: 20,
      videoConsultationFee: 20,
      chatConsultationFee: 20,
    },
    {
      email: "dr.hassan@daryeel.so",
      phone: "+252634100125",
      fullName: "Dr. Hassan Mohamed",
      gender: Gender.MALE,
      specialty: "Neurology",
      subSpecialty: "Brain & Nervous System",
      qualification: "MBBS, Neurology",
      university: "University of Hargeisa",
      yearsExperience: 16,
      languages: ["Somali", "English", "Arabic"],
      clinicName: "Daryeel Specialist Center",
      consultationFee: 25,
      videoConsultationFee: 25,
      chatConsultationFee: 25,
    },
  ];

  const seededDoctors: { user: any; doctor: any }[] = [];

  for (const doctorData of doctors) {
    const user = await prisma.user.upsert({
      where: { email: doctorData.email },
      update: {
        phone: doctorData.phone,
        fullName: doctorData.fullName,
        gender: doctorData.gender,
        role: Role.USER,
        passwordHash,
        isActive: true,
        isSuspended: false,
        emailVerified: true,
        phoneVerified: true,
        language: "so",
        timezone: "Africa/Mogadishu",
        country: "Somaliland",
        city: "Hargeisa",
      },
      create: {
        email: doctorData.email,
        phone: doctorData.phone,
        fullName: doctorData.fullName,
        gender: doctorData.gender,
        role: Role.USER,
        passwordHash,
        isActive: true,
        isSuspended: false,
        emailVerified: true,
        phoneVerified: true,
        language: "so",
        timezone: "Africa/Mogadishu",
        country: "Somaliland",
        city: "Hargeisa",
      },
    });

    const doctor = await prisma.doctor.upsert({
      where: { userId: user.userid },
      update: {
        fullName: doctorData.fullName,
        gender: doctorData.gender,
        specialty: doctorData.specialty,
        subSpecialty: doctorData.subSpecialty,
        qualification: doctorData.qualification,
        university: doctorData.university,
        yearsExperience: doctorData.yearsExperience,
        languages: doctorData.languages,
        verificationStatus: DoctorVerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        consultationEnabled: true,
        videoConsultationEnabled: true,
        chatConsultationEnabled: true,
        consultationFee: doctorData.consultationFee ?? 0,
        videoConsultationFee: doctorData.videoConsultationFee ?? 0,
        chatConsultationFee: doctorData.chatConsultationFee ?? 0,
        currency: "USD",
        isAvailable: true,
        isOnline: true,
        isActive: true,
        clinicName: doctorData.clinicName,
        city: "Hargeisa",
        country: "Somaliland",
      },
      create: {
        userId: user.userid,
        fullName: doctorData.fullName,
        gender: doctorData.gender,
        specialty: doctorData.specialty,
        subSpecialty: doctorData.subSpecialty,
        qualification: doctorData.qualification,
        university: doctorData.university,
        yearsExperience: doctorData.yearsExperience,
        languages: doctorData.languages,
        verificationStatus: DoctorVerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        consultationEnabled: true,
        videoConsultationEnabled: true,
        chatConsultationEnabled: true,
        consultationFee: doctorData.consultationFee ?? 0,
        videoConsultationFee: doctorData.videoConsultationFee ?? 0,
        chatConsultationFee: doctorData.chatConsultationFee ?? 0,
        currency: "USD",
        isAvailable: true,
        isOnline: true,
        isActive: true,
        clinicName: doctorData.clinicName,
        city: "Hargeisa",
        country: "Somaliland",
      },
    });

    seededDoctors.push({ user, doctor });
  }

  // ============================================================
  // 12. HEALTH DEVICE CONNECTION
  // ============================================================

  await prisma.healthDeviceConnection.create({
    data: {
      userId: patient.userid,
      provider: "GOOGLE_HEALTH_CONNECT",
      deviceName: "Android Health Connect",
      providerUserId: "health-connect-demo-user",
      accessTokenEncrypted: "ENCRYPTED_DEMO_ACCESS_TOKEN",
      refreshTokenEncrypted: "ENCRYPTED_DEMO_REFRESH_TOKEN",
      scopes: ["steps", "heart_rate", "sleep", "weight", "calories"],
      isActive: true,
      lastSyncAt: new Date(),
      lastError: null,
    },
  });

  // ============================================================
  // 13. DAILY HEALTH LOGS
  // ============================================================

  const dailyLogs = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    dailyLogs.push({
      userId: patient.userid,
      date,

      mood: MoodLevel.GOOD,
      sleepQuality: SleepQuality.GOOD,
      stressLevel: StressLevel.LOW,
      energyLevel: EnergyLevel.HIGH,
      activityLevel: ActivityLevel.MODERATE,
      painLevel: PainLevel.NONE,

      steps: 6500 + i * 350,
      distanceKm: 4.2 + i * 0.2,
      activeMinutes: 45 + i * 3,
      caloriesBurned: 380 + i * 15,

      heartRateAvg: 74,
      heartRateMin: 60,
      heartRateMax: 108,

      weightKg: 62.5,
      bodyFatPercent: 24.5,
      bmi: 23.1,
      oxygenSaturation: 98,

      waterIntakeMl: 1800 + i * 100,
      waterGoalMl: 2500, // ✅ correct field name
      hydrationStatus: i === 0 ? HydrationStatus.MET : HydrationStatus.PARTIAL,

      sleepHours: 7.2,
      sleepStart: new Date(date.getTime() - 8 * 60 * 60 * 1000),
      sleepEnd: new Date(date.getTime() - 1 * 60 * 60 * 1000),

      stepsGoal: 8000,
      // ✅ removed invalid `waterGoal`
      activeMinutesGoal: 60,
      sleepGoalHours: 8,

      stepsGoalStatus: GoalStatus.IN_PROGRESS,
      waterGoalStatus: GoalStatus.IN_PROGRESS,
      activeGoalStatus: GoalStatus.IN_PROGRESS,
      sleepGoalStatus: GoalStatus.IN_PROGRESS,

      source: DailyLogSource.HEALTH_CONNECT,
      deviceName: "Android Health Connect",
    });
  }

  for (const log of dailyLogs) {
    await prisma.dailyHealthLog.upsert({
      where: {
        userId_date: {
          userId: log.userId,
          date: log.date,
        },
      },
      update: log,
      create: log,
    });
  }

  // ============================================================
  // 14. VITAL SIGNS  (✅ field names fixed)
  // ============================================================

  await prisma.vitalSign.createMany({
    data: [
      {
        userId: patient.userid,
        temperature: 36.7,
        bloodPressureSys: 118,   // ✅ was systolicBP
        bloodPressureDia: 76,    // ✅ was diastolicBP
        heartRate: 72,
        respiratoryRate: 16,
        oxygenSaturation: 98,
        weight: 62.5,            // ✅ was weightKg
        height: 164,             // ✅ was heightCm
        bmi: 23.2,
        source: "HEALTH_CONNECT",
        recordedAt: new Date("2026-10-20T09:00:00"),
      },
      {
        userId: patient.userid,
        temperature: 36.8,
        bloodPressureSys: 120,   // ✅
        bloodPressureDia: 78,    // ✅
        heartRate: 75,
        respiratoryRate: 17,
        oxygenSaturation: 98,
        weight: 62.4,            // ✅
        height: 164,             // ✅
        bmi: 23.2,
        source: "MANUAL",
        recordedAt: new Date("2026-10-25T10:00:00"),
      },
    ],
  });

  // ============================================================
  // 15. DIAGNOSIS
  // ============================================================

  const freeDoctor = seededDoctors[0].doctor;
  const paidDoctor1 = seededDoctors[20].doctor;
  const paidDoctor2 = seededDoctors[21].doctor;
  const paidDoctor3 = seededDoctors[22].doctor;

  await prisma.diagnosis.createMany({
    data: [
      {
        userId: patient.userid,
        doctorId: freeDoctor.id,
        diagnosis: "Mild Asthma",
        icdCode: "J45.909",
        description: "Stable mild asthma.",
        diagnosedAt: new Date("2026-10-20"),
        isPrimary: true,
        status: "ACTIVE",
        notes: "Continue current treatment.",
      },
      {
        userId: patient.userid,
        doctorId: paidDoctor2.id,
        diagnosis: "Vitamin D Deficiency",
        icdCode: "E55.9",
        description: "Vitamin D deficiency requiring supplementation.",
        diagnosedAt: new Date("2026-10-25"),
        isPrimary: true,
        status: "ACTIVE",
        notes: "Continue Vitamin D3.",
      },
    ],
  });

  // ============================================================
  // 16. LAB RESULTS  (✅ testCode fixed)
  // ============================================================

  await prisma.labResult.createMany({
    data: [
      {
        userId: patient.userid,
        doctorId: paidDoctor1.id,
        testName: "Complete Blood Count",
        testCode: "CBC",                 // ✅ was `code`
        category: "Hematology",
        resultValue: "Normal",
        unit: null,
        referenceRange: "Normal",
        status: "NORMAL",
        interpretation: "CBC within normal range.",
        labName: "Daryeel Medical Laboratory",
        resultDate: new Date("2026-10-25"),
        notes: "Routine blood test.",
      },
      {
        userId: patient.userid,
        doctorId: paidDoctor2.id,
        testName: "Vitamin D",
        testCode: "25-OH-D",             // ✅ was `code`
        category: "Biochemistry",
        resultValue: "21",
        unit: "ng/mL",
        referenceRange: "30-100 ng/mL",
        status: "LOW",
        interpretation: "Vitamin D below recommended range.",
        labName: "Daryeel Medical Laboratory",
        resultDate: new Date("2026-10-25"),
        notes: "Supplementation recommended.",
      },
    ],
  });

  // ============================================================
  // 17. PRESCRIPTION  (✅ issuedAt fixed)
  // ============================================================

  const prescription = await prisma.prescription.create({
    data: {
      userId: patient.userid,
      doctorId: paidDoctor1.id,
      prescriptionNumber: "RX-DYL-000001",
      issuedAt: new Date("2026-10-25"),   // ✅ was `prescribedAt`
      startDate: new Date("2026-10-25"),
      endDate: new Date("2026-11-25"),
      status: "ACTIVE",
      notes: "Sample prescription.",
    },
  });

  await prisma.prescriptionItem.createMany({
    data: [
      {
        prescriptionId: prescription.id,
        medicineName: "Vitamin D3",
        dosage: "1000 IU",
        frequency: "Once daily",
        route: "Oral",
        duration: "30 days",
        quantity: "30",
        instructions: "Take after breakfast.",
        isActive: true,
      },
      {
        prescriptionId: prescription.id,
        medicineName: "Salbutamol",
        dosage: "100 mcg",
        frequency: "As needed",
        route: "Inhalation",
        duration: "30 days",
        quantity: "1",
        instructions: "Use when asthma symptoms occur.",
        isActive: true,
      },
    ],
  });

  // ============================================================
  // 18. APPOINTMENTS
  // ============================================================

  console.log("📅 Creating appointments...");

  const appointment1 = await prisma.appointment.create({
    data: {
      userId: patient.userid,
      doctorId: paidDoctor1.id,
      appointmentCode: "APT-DYL-000001",
      scheduledAt: new Date("2026-10-28T09:00:00"),
      duration: 30,
      reason: "General medical consultation",
      notes: "Paid consultation.",
      status: AppointmentStatus.COMPLETED,
      meetingLink: "https://meet.daryeel.so/apt-000001",
      paymentRequired: true,
      consultationFee: 5,
      currency: "USD",
      paymentStatus: PaymentStatus.PAID,
      reminderSent: true,
      confirmedAt: new Date("2026-10-27T10:00:00"),
    },
  });

  const appointment2 = await prisma.appointment.create({
    data: {
      userId: patient.userid,
      doctorId: paidDoctor2.id,
      appointmentCode: "APT-DYL-000002",
      scheduledAt: new Date("2026-11-02T10:00:00"),
      duration: 30,
      reason: "Internal medicine consultation",
      notes: "Pending payment example.",
      status: AppointmentStatus.CONFIRMED,
      meetingLink: "https://meet.daryeel.so/apt-000002",
      paymentRequired: true,
      consultationFee: 10,
      currency: "USD",
      paymentStatus: PaymentStatus.PENDING,
      reminderSent: true,
    },
  });

  const appointment3 = await prisma.appointment.create({
    data: {
      userId: patient.userid,
      doctorId: paidDoctor3.id,
      appointmentCode: "APT-DYL-000003",
      scheduledAt: new Date("2026-10-30T11:00:00"),
      duration: 45,
      reason: "Cardiology consultation",
      notes: "Successful paid video consultation.",
      status: AppointmentStatus.COMPLETED,
      meetingLink: "https://meet.daryeel.so/apt-000003",
      paymentRequired: true,
      consultationFee: 15,
      currency: "USD",
      paymentStatus: PaymentStatus.PAID,
      reminderSent: true,
      confirmedAt: new Date("2026-10-29T10:00:00"),
    },
  });

  const appointment4 = await prisma.appointment.create({
    data: {
      userId: patient.userid,
      doctorId: freeDoctor.id,
      appointmentCode: "APT-DYL-000004",
      scheduledAt: new Date("2026-11-05T09:30:00"),
      duration: 30,
      reason: "General health check",
      notes: "Free consultation.",
      status: AppointmentStatus.ACCEPTED,
      paymentRequired: false,
      consultationFee: 0,
      currency: "USD",
      paymentStatus: PaymentStatus.PAID,
    },
  });

  // ============================================================
  // 19. CONSULTATIONS
  // ============================================================


await prisma.consultation.createMany({
  data: [
    {
      consultationCode: "CON-DYL-000001",
      userId: patient.userid,
      doctorId: paidDoctor1.id,
      appointmentId: appointment1.id,
      type: ConsultationType.VIDEO,
      status: ConsultationStatus.COMPLETED,
      scheduledAt: appointment1.scheduledAt,
      meetingLink: appointment1.meetingLink,
      summary: "General medical consultation completed.",
      doctorNotes: "Patient stable. Continue current treatment.", // ✅ was `notes`
      followUpAt: new Date("2026-11-20"),                         // ✅ was `followUpDate`
    },
    {
      consultationCode: "CON-DYL-000002",
      userId: patient.userid,
      doctorId: paidDoctor3.id,
      appointmentId: appointment3.id,
      type: ConsultationType.VIDEO,
      status: ConsultationStatus.COMPLETED,
      scheduledAt: appointment3.scheduledAt,
      meetingLink: appointment3.meetingLink,
      summary: "Cardiology consultation completed.",
      doctorNotes: "No immediate cardiac emergency identified.",   // ✅
      followUpAt: new Date("2026-12-01"),                           // ✅
    },
    {
      consultationCode: "CON-DYL-000003",
      userId: patient.userid,
      doctorId: paidDoctor2.id,
      appointmentId: appointment2.id,
      type: ConsultationType.CHAT,
      status: ConsultationStatus.SCHEDULED,
      scheduledAt: appointment2.scheduledAt,
      meetingLink: null,
      summary: null,
      doctorNotes: "Pending consultation.",                        // ✅
      followUpAt: null,                                            // ✅
    },
  ],
});

  // ============================================================
  // 20. PAYMENTS
  // ============================================================

  console.log("💳 Creating payments...");

  await prisma.payment.create({
    data: {
      appointmentId: appointment1.id,
      userId: patient.userid,
      amount: 5,
      currency: "USD",
      status: PaymentStatus.PAID,
      method: PaymentMethod.MOBILE_MONEY,
      transactionId: "TXN-DYL-000001",
      provider: "ZAAD",
      externalTransactionId: "ZAAD-DYL-000001",
      providerResponse: { status: "success", reference: "ZAAD-DYL-000001" },
      paidAt: new Date("2026-10-28T08:45:00"),
    },
  });

  await prisma.payment.create({
    data: {
      appointmentId: appointment2.id,
      userId: patient.userid,
      amount: 10,
      currency: "USD",
      status: PaymentStatus.PENDING,
      method: PaymentMethod.MOBILE_MONEY,
      transactionId: "TXN-DYL-000002",
      provider: "ZAAD",
    },
  });

  await prisma.payment.create({
    data: {
      appointmentId: appointment3.id,
      userId: patient.userid,
      amount: 15,
      currency: "USD",
      status: PaymentStatus.PAID,
      method: PaymentMethod.CARD,
      transactionId: "TXN-DYL-000003",
      provider: "DARYEEL_PAY",
      externalTransactionId: "CARD-DYL-000003",
      providerResponse: { status: "success", card: "****4242" },
      paidAt: new Date("2026-10-30T10:30:00"),
    },
  });

  await prisma.payment.create({
    data: {
      appointmentId: appointment2.id,
      userId: patient.userid,
      amount: 10,
      currency: "USD",
      status: PaymentStatus.FAILED,
      method: PaymentMethod.MOBILE_MONEY,
      transactionId: "TXN-DYL-000004",
      provider: "ZAAD",
      failureReason: "Insufficient wallet balance",
    },
  });

  // ============================================================
  // 21. DOCTOR REVIEWS
  // ============================================================

  await prisma.doctorReview.createMany({
    data: [
      {
        userId: patient.userid,
        doctorId: paidDoctor1.id,
        appointmentId: appointment1.id,
        rating: 5,
        review: "Excellent doctor. Very professional and helpful.",
        isAnonymous: false,
        isPublished: true,
      },
      {
        userId: patient.userid,
        doctorId: paidDoctor3.id,
        appointmentId: appointment3.id,
        rating: 5,
        review: "Very good consultation and clear explanation.",
        isAnonymous: false,
        isPublished: true,
      },
    ],
  });

  await prisma.doctor.update({
    where: { id: paidDoctor1.id },
    data: { rating: 5, reviewCount: 1 },
  });

  await prisma.doctor.update({
    where: { id: paidDoctor3.id },
    data: { rating: 5, reviewCount: 1 },
  });

  // ============================================================
  // 22. NOTIFICATIONS
  // ============================================================

  await prisma.notification.createMany({
    data: [
      {
        userId: patient.userid,
        title: "Appointment Confirmed",
        body: "Your appointment with Dr. Nasteexo Ahmed has been confirmed.",
        type: NotificationType.APPOINTMENT_ACCEPTED,
        channel: NotificationChannel.IN_APP,
        isRead: false,
      },
      {
        userId: patient.userid,
        title: "Payment Successful",
        body: "Your $5 consultation payment was successful.",
        type: NotificationType.PAYMENT_SUCCESS,
        channel: NotificationChannel.IN_APP,
        isRead: false,
      },
      {
        userId: patient.userid,
        title: "Consultation Completed",
        body: "Your consultation with Dr. Nasteexo Ahmed has been completed.",
        type: NotificationType.CONSULTATION,
        channel: NotificationChannel.PUSH,
        isRead: true,
      },
      {
        userId: patient.userid,
        title: "Payment Pending",
        body: "Your $10 consultation payment is still pending.",
        type: NotificationType.PAYMENT,
        channel: NotificationChannel.IN_APP,
        isRead: false,
      },
      {
        userId: patient.userid,
        title: "Health Reminder",
        body: "Remember to drink enough water today.",
        type: NotificationType.SYSTEM,
        channel: NotificationChannel.IN_APP,
        isRead: false,
      },
    ],
  });

  // ============================================================
  // 23. CONSENT
  // ============================================================

  await prisma.consent.create({
    data: {
      userId: patient.userid,
      requesterId: paidDoctor1.id,
      doctorId: paidDoctor1.id,
      accessLevel: AccessLevel.FULL,
      status: ConsentStatus.APPROVED,
      purpose: "Medical consultation",
      medicalRecords: true,
      vitalSigns: true,
      medications: true,
      labResults: true,
      prescriptions: true,
      appointments: true,
      grantedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: "Patient granted temporary access to doctor.",
    },
  });

  // ============================================================
  // 24. MEDICAL ACCESS REQUESTS
  // ============================================================

  await prisma.medicalAccessRequest.create({
    data: {
      requesterId: seededDoctors[21].user.userid,
      patientId: patient.userid,
      requestType: AccessRequestType.FULL_RECORD,
      status: ConsentStatus.PENDING,
      message:
        "Please approve access to your medical records for the upcoming consultation.",
    },
  });

  await prisma.medicalAccessRequest.create({
    data: {
      requesterId: seededDoctors[22].user.userid,
      patientId: patient.userid,
      requestType: AccessRequestType.LAB_RESULTS,
      status: ConsentStatus.APPROVED,
      message: "Request to review laboratory results.",
    },
  });

  // ============================================================
  // 25. AUDIT LOGS
  // ============================================================

  await prisma.auditLog.createMany({
    data: [
      {
        userId: superAdmin.userid,
        action: AuditAction.LOGIN,
        entity: "User",
        entityId: superAdmin.userid,
        description: "Super administrator logged in.",
        metadata: { seeded: true },
      },
      {
        userId: admin.userid,
        action: AuditAction.CREATE,
        entity: "Doctor",
        entityId: paidDoctor1.id,
        description: "Paid doctor created during seed.",
        metadata: { seeded: true, consultationFee: 5 },
      },
      {
        userId: patient.userid,
        action: AuditAction.PAYMENT,
        entity: "Payment",
        entityId: "TXN-DYL-000001",
        description: "Successful consultation payment.",
        metadata: { amount: 5, currency: "USD", provider: "ZAAD" },
      },
      {
        userId: patient.userid,
        action: AuditAction.SHARE,
        entity: "Consent",
        description: "Patient shared medical information with doctor.",
        metadata: { accessLevel: "FULL" },
      },
    ],
  });

  // ============================================================
  // SUMMARY
  // ============================================================

  console.log("\n==============================================");
  console.log("✅ DARYEEL HEALTH SEED COMPLETED");
  console.log("==============================================");
  console.log("👤 Users:              29");
  console.log("👨‍⚕️ Doctors:            25");
  console.log("🆓 Free doctors:       20");
  console.log("💰 Paid doctors:       5");
  console.log("📅 Appointments:       4");
  console.log("🩺 Consultations:      3");
  console.log("💳 Payments:           4");
  console.log("⭐ Doctor reviews:      2");
  console.log("🧪 Lab results:         2");
  console.log("💊 Prescriptions:       1");
  console.log("📄 Medical records:     2");
  console.log("❤️ Daily health logs:   7");
  console.log("🔐 Consents:            1");
  console.log("📨 Access requests:     2");
  console.log("🔔 Notifications:       5");
  console.log("🔐 Roles:               " + Object.keys(seededRoles).length);
  console.log("⚙️  Platform settings:   " + settings.length);
  console.log("🚩 Feature flags:       " + flags.length);
  console.log("==============================================");
  console.log("💵 Paid consultation fees:");
  console.log("   Dr. Nasteexo Ahmed  → $5");
  console.log("   Dr. Khalid Omar     → $10");
  console.log("   Dr. Umar Hassan     → $15");
  console.log("   Dr. Samira          → $20");
  console.log("   Dr. Hassan Mohamed  → $25");
  console.log("==============================================");
  console.log(`🔑 Demo password: ${PASSWORD}`);
  console.log("==============================================\n");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });