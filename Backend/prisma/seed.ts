import {
  NewsCategory,
  NewsPostStatus,
  NewsVisibility,
  PlanInterval,
  PlatformSubscriptionStatus,
  Role,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { ensureDefaultFeatureFlags } from "../src/services/featureFlag.service";

async function main() {
  console.log("Seeding Daryeel Health…");

  await ensureDefaultFeatureFlags();

  const passwordHash = await bcrypt.hash("Daryeel@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@daryeel.so" },
    update: {
      role: Role.SUPER_ADMIN,
      isActive: true,
      isSuspended: false,
      emailVerified: true,
      passwordHash,
    },
    create: {
      email: "admin@daryeel.so",
      fullName: "Daryeel Super Admin",
      role: Role.SUPER_ADMIN,
      passwordHash,
      emailVerified: true,
      isActive: true,
    },
  });

  const patient = await prisma.user.upsert({
    where: { email: "patient@daryeel.so" },
    update: { role: Role.PATIENT, passwordHash, emailVerified: true },
    create: {
      email: "patient@daryeel.so",
      fullName: "Fadumo Patient",
      role: Role.PATIENT,
      passwordHash,
      emailVerified: true,
      phone: "+252634000101",
    },
  });

  const doctorUser = await prisma.user.upsert({
    where: { email: "doctor@daryeel.so" },
    update: { role: Role.DOCTOR, passwordHash, emailVerified: true },
    create: {
      email: "doctor@daryeel.so",
      fullName: "Dr. Ayaan Warsame",
      role: Role.DOCTOR,
      passwordHash,
      emailVerified: true,
      phone: "+252634000102",
    },
  });

  await prisma.professionalProfile.upsert({
    where: { userId: doctorUser.userid },
    update: {
      isVerified: true,
      isActive: true,
      isPubliclyVisible: true,
      specialization: "Cardiologist",
      yearsOfExperience: 12,
      publicBio:
        "Heart specialist focused on clear, calm care for families across Somaliland.",
    },
    create: {
      userId: doctorUser.userid,
      professionalType: Role.DOCTOR,
      specialization: "Cardiologist",
      yearsOfExperience: 12,
      isVerified: true,
      isActive: true,
      isPubliclyVisible: true,
      consultationFee: 25,
      publicBio:
        "Heart specialist focused on clear, calm care for families across Somaliland.",
    },
  });

  await prisma.userProfile.upsert({
    where: { userId: patient.userid },
    update: { city: "Hargeisa", country: "Somaliland", bloodType: "O_POSITIVE" },
    create: {
      userId: patient.userid,
      city: "Hargeisa",
      country: "Somaliland",
      bloodType: "O_POSITIVE",
      healthId: "DYL-PAT-001",
    },
  });

  const newsSeed = [
    {
      title: "Stay hydrated during hot days in Hargeisa",
      content:
        "Drink water regularly, especially outdoors. Aim for clear urine as a simple hydration check. This is general advice — not a personal diagnosis.",
      category: NewsCategory.PUBLIC_HEALTH,
      isOfficial: true,
    },
    {
      title: "When to book a blood-pressure check",
      content:
        "Adults with a family history of heart disease should check blood pressure at least yearly. Bring a list of medicines to your visit.",
      category: NewsCategory.HEALTH_NEWS,
      isOfficial: true,
    },
    {
      title: "Child fever: home care basics",
      content:
        "Keep the child cool, offer fluids, and seek care if fever lasts more than three days, breathing is hard, or the child is unusually sleepy.",
      category: NewsCategory.COMMUNITY_HEALTH,
      isOfficial: false,
    },
    {
      title: "Daryeel clinics: evening appointment slots",
      content:
        "Selected facilities now offer evening visits. Book from Doctors in the app or website after you sign in.",
      category: NewsCategory.HOSPITAL_UPDATES,
      isOfficial: true,
    },
    {
      title: "Verified clinicians on Daryeel",
      content:
        "Clinicians with a Verified badge completed Super Admin review of their professional application. Always confirm identity at the facility.",
      category: NewsCategory.PROFESSIONAL_NEWS,
      isOfficial: true,
    },
  ];

  for (const item of newsSeed) {
    const exists = await prisma.newsPost.findFirst({
      where: { title: item.title, authorId: admin.userid },
    });
    if (exists) continue;
    await prisma.newsPost.create({
      data: {
        authorId: admin.userid,
        title: item.title,
        content: item.content,
        category: item.category,
        status: NewsPostStatus.PUBLISHED,
        visibility: NewsVisibility.PUBLIC,
        isOfficial: item.isOfficial,
        publishedAt: new Date(),
      },
    });
  }

  // Minimal today health log for demo patient (real DB row, not UI fake)
  const today = new Date();
  const dateOnly = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
  );
  await prisma.dailyHealthLog.upsert({
    where: {
      userId_date: { userId: patient.userid, date: dateOnly },
    },
    update: {
      steps: 4200,
      waterIntakeMl: 1200,
      sleepHours: 7,
      mood: "GOOD",
      source: "MANUAL",
    },
    create: {
      userId: patient.userid,
      date: dateOnly,
      steps: 4200,
      waterIntakeMl: 1200,
      sleepHours: 7,
      mood: "GOOD",
      source: "MANUAL",
    },
  });

  const plans = [
    {
      code: "STARTER",
      name: "Starter Clinic",
      description: "Single facility digital front desk for appointments and patient records.",
      price: 49,
      interval: PlanInterval.MONTHLY,
      features: ["1 facility", "Up to 5 staff", "Appointments", "Patient profiles"],
      sortOrder: 1,
      trialDays: 14,
      maxUsers: 5,
      maxBranches: 1,
    },
    {
      code: "GROWTH",
      name: "Growth Hospital",
      description: "Multi-branch care ops with labs, pharmacy, and professional directory.",
      price: 149,
      interval: PlanInterval.MONTHLY,
      features: [
        "Up to 3 branches",
        "Up to 25 staff",
        "Labs & pharmacy",
        "Public doctor profiles",
        "Priority support",
      ],
      sortOrder: 2,
      trialDays: 14,
      maxUsers: 25,
      maxBranches: 3,
    },
    {
      code: "ENTERPRISE",
      name: "Enterprise Network",
      description: "Regional hospital networks with custom SLAs and advanced controls.",
      price: 399,
      interval: PlanInterval.MONTHLY,
      features: [
        "Unlimited branches",
        "Unlimited staff",
        "Custom branding",
        "Audit exports",
        "Dedicated success manager",
      ],
      sortOrder: 3,
      trialDays: 30,
      maxUsers: null,
      maxBranches: null,
    },
  ];

  for (const plan of plans) {
    await prisma.platformPlan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        description: plan.description,
        price: plan.price,
        interval: plan.interval,
        features: plan.features,
        isActive: true,
        isPublic: true,
        sortOrder: plan.sortOrder,
        trialDays: plan.trialDays,
        maxUsers: plan.maxUsers,
        maxBranches: plan.maxBranches,
      },
      create: {
        code: plan.code,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: "USD",
        interval: plan.interval,
        features: plan.features,
        isActive: true,
        isPublic: true,
        sortOrder: plan.sortOrder,
        trialDays: plan.trialDays,
        maxUsers: plan.maxUsers,
        maxBranches: plan.maxBranches,
      },
    });
  }

  const growth = await prisma.platformPlan.findUnique({ where: { code: "GROWTH" } });
  if (growth) {
    const existingSub = await prisma.platformSubscription.findFirst({
      where: { organizationName: "Daryeel Central Demo", planId: growth.planid },
    });
    if (!existingSub) {
      const ends = new Date();
      ends.setMonth(ends.getMonth() + 1);
      await prisma.platformSubscription.create({
        data: {
          planId: growth.planid,
          organizationName: "Daryeel Central Demo",
          contactEmail: "billing@daryeel.so",
          status: PlatformSubscriptionStatus.ACTIVE,
          startsAt: new Date(),
          endsAt: ends,
          notes: "Seed subscription for Super Admin testing",
        },
      });
    }
  }

  await prisma.cmsContent.upsert({
    where: { key: "homepage" },
    update: {
      title: "Homepage",
      published: true,
      updatedById: admin.userid,
      data: {
        brand: "Daryeel",
        headline: "Better care, closer to home",
        subheadline:
          "Book clinicians, open hospitals, and keep labs & prescriptions in one trusted place across Somaliland.",
        ctaPrimary: { label: "Find a doctor", href: "/doctors" },
        ctaSecondary: { label: "Browse hospitals", href: "/hospitals" },
        heroImageUrl:
          "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&q=80",
        servicesTitle: "Care services",
        services: [
          { title: "General Medicine", desc: "Primary care and long-term support." },
          { title: "Maternity", desc: "Antenatal to postnatal midwifery care." },
          { title: "Laboratory", desc: "Clear diagnostics with quick turnaround." },
          { title: "Pharmacy", desc: "Prescriptions and refill reminders." },
        ],
      },
    },
    create: {
      key: "homepage",
      title: "Homepage",
      published: true,
      updatedById: admin.userid,
      data: {
        brand: "Daryeel",
        headline: "Better care, closer to home",
        subheadline:
          "Book clinicians, open hospitals, and keep labs & prescriptions in one trusted place across Somaliland.",
        ctaPrimary: { label: "Find a doctor", href: "/doctors" },
        ctaSecondary: { label: "Browse hospitals", href: "/hospitals" },
        heroImageUrl:
          "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&q=80",
        servicesTitle: "Care services",
        services: [
          { title: "General Medicine", desc: "Primary care and long-term support." },
          { title: "Maternity", desc: "Antenatal to postnatal midwifery care." },
          { title: "Laboratory", desc: "Clear diagnostics with quick turnaround." },
          { title: "Pharmacy", desc: "Prescriptions and refill reminders." },
        ],
      },
    },
  });

  console.log("Seed complete.");
  console.log("  Super Admin: admin@daryeel.so / Daryeel@123");
  console.log("  Patient:     patient@daryeel.so / Daryeel@123");
  console.log("  Doctor:      doctor@daryeel.so / Daryeel@123");
  console.log(`  Admin id: ${admin.userid}`);
  console.log("  Console:    /admin (SUPER_ADMIN only for plans/CMS)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
