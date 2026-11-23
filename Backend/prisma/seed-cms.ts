/**
 * CMS-only seed: branding, About / Management-Staff pages, and full team sample.
 * Run: npx ts-node --transpile-only prisma/seed-cms.ts
 */
import { CmsPageStatus, PrismaClient, TeamMemberCategory } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📰 Seeding Daryeel CMS team sample data...\n");

  await prisma.platformSetting.upsert({
    where: { key: "site.branding" },
    update: {
      value: {
        name: "Daryeel",
        appName: "Daryeel Health",
        tagline: "Caafimaadkaaga, Gacantaada",
        description:
          "Multi-tenant digital health platform connecting patients, providers, hospitals, labs, and pharmacies across Somaliland and East Africa.",
        url: "https://www.daryeelhealth.com",
        supportEmail: "info@daryeel.com",
        supportPhone: "+252634000100",
        location: "Hargeisa · Somaliland · East Africa",
        address: "Hargeisa, Somaliland",
      },
      category: "CMS",
      isPublic: true,
      description: "Public website & app branding",
    },
    create: {
      key: "site.branding",
      value: {
        name: "Daryeel",
        appName: "Daryeel Health",
        tagline: "Caafimaadkaaga, Gacantaada",
        description:
          "Multi-tenant digital health platform connecting patients, providers, hospitals, labs, and pharmacies across Somaliland and East Africa.",
        url: "https://www.daryeelhealth.com",
        supportEmail: "info@daryeel.com",
        supportPhone: "+252634000100",
        location: "Hargeisa · Somaliland · East Africa",
        address: "Hargeisa, Somaliland",
      },
      category: "CMS",
      isPublic: true,
      description: "Public website & app branding",
    },
  });

  const leadershipPagePayload = {
    title: "Management & Staff",
    subtitle:
      "Meet the dedicated team, board members, partners, and supporters behind Daryeel Health",
    summary:
      "Our dedicated team consists of qualified healthcare leaders, administrators, board members, partners, and volunteers committed to serving the community with professionalism, integrity, and passion.",
    highlights: [
      {
        title: "Qualified Professionals",
        description: "Experienced clinicians and digital health experts",
      },
      {
        title: "Committed to Service",
        description: "Patient-first care across Somaliland & East Africa",
      },
      {
        title: "Excellence in Action",
        description: "Secure, connected healthcare technology",
      },
    ],
    body: {
      eyebrow: "Our People",
      stats: [
        { label: "Board Members", value: "6" },
        { label: "Executive Team", value: "4" },
        { label: "Staff Members", value: "16+" },
        { label: "Partners", value: "6+" },
        { label: "Volunteers", value: "20+" },
        { label: "Patients Reached", value: "5,000+" },
      ],
      values: [
        {
          title: "Commitment",
          description: "Dedicated to serving our community with excellence",
        },
        {
          title: "Transparency",
          description: "Open and honest in all our operations",
        },
        {
          title: "Accountability",
          description: "Taking responsibility for our actions",
        },
        {
          title: "Teamwork",
          description: "Collaborating to achieve shared goals",
        },
      ],
    },
    quote: {
      text: "Healthcare is not just a service — it is a connected community of people working together to protect lives, inspire trust, and build healthier futures.",
      author: "Eng. Khadar Eid",
      role: "Founder & Platform Lead, Daryeel Health",
    },
    cta: {
      title: "Want to Work or Volunteer With Us?",
      description:
        "We're always looking for passionate individuals to join our team as staff, volunteers, or partners.",
      primaryLabel: "Contact Us",
      primaryHref: "/#contact",
      secondaryLabel: "Apply as Doctor",
      secondaryHref: "/doctors/apply",
    },
    status: CmsPageStatus.PUBLISHED,
    publishedAt: new Date(),
    sortOrder: 1,
  };

  await prisma.cmsPage.upsert({
    where: { slug: "management-staff" },
    update: leadershipPagePayload,
    create: { slug: "management-staff", ...leadershipPagePayload },
  });

  await prisma.cmsPage.upsert({
    where: { slug: "about" },
    update: {
      title: "About Daryeel Health",
      subtitle: "Your Health. Your Care. One Connected Platform.",
      summary:
        "Daryeel Health connects patients, providers, hospitals, labs, pharmacies, employers and government across Somaliland and East Africa.",
      status: CmsPageStatus.PUBLISHED,
      publishedAt: new Date(),
      sortOrder: 0,
    },
    create: {
      slug: "about",
      title: "About Daryeel Health",
      subtitle: "Your Health. Your Care. One Connected Platform.",
      summary:
        "Daryeel Health connects patients, providers, hospitals, labs, pharmacies, employers and government across Somaliland and East Africa.",
      status: CmsPageStatus.PUBLISHED,
      publishedAt: new Date(),
      sortOrder: 0,
    },
  });

  const teamSeed: Array<{
    slug: string;
    fullName: string;
    title: string;
    department?: string;
    category: TeamMemberCategory;
    bio: string;
    email?: string;
    phone?: string;
    expertise?: string[];
    education?: string;
    yearsExperience?: number;
    sortOrder: number;
    isFeatured?: boolean;
  }> = [
    {
      slug: "dr-ahmed-mohamed",
      fullName: "Dr. Ahmed Mohamed",
      title: "Chairman of the Board",
      department: "Board of Directors",
      category: TeamMemberCategory.BOARD,
      bio: "Dr. Ahmed has over 25 years of experience in healthcare policy and hospital leadership. He leads the board with vision and strategic direction.",
      email: "chairman@daryeel.com",
      phone: "+252634000101",
      expertise: ["Health Policy", "Strategic Planning"],
      yearsExperience: 25,
      sortOrder: 1,
      isFeatured: true,
    },
    {
      slug: "fatima-hassan-board",
      fullName: "Fatima Hassan",
      title: "Vice Chairperson",
      department: "Board of Directors",
      category: TeamMemberCategory.BOARD,
      bio: "Fatima brings extensive experience in community development and public health programs to the board.",
      email: "vicechair@daryeel.com",
      phone: "+252634000102",
      expertise: ["Community Engagement", "Public Health"],
      sortOrder: 2,
    },
    {
      slug: "mohamed-abdullahi-board",
      fullName: "Mohamed Abdullahi",
      title: "Secretary",
      department: "Board of Directors",
      category: TeamMemberCategory.BOARD,
      bio: "Mohamed oversees board documentation and ensures effective communication between members and the executive team.",
      email: "secretary@daryeel.com",
      phone: "+252634000103",
      expertise: ["Governance", "Administration"],
      sortOrder: 3,
    },
    {
      slug: "amina-warsame-board",
      fullName: "Amina Warsame",
      title: "Treasurer",
      department: "Board of Directors",
      category: TeamMemberCategory.BOARD,
      bio: "Amina manages financial oversight and fundraising strategies for Daryeel Health.",
      email: "treasurer@daryeel.com",
      phone: "+252634000104",
      expertise: ["Finance", "Fundraising"],
      sortOrder: 4,
    },
    {
      slug: "omar-hassan-board",
      fullName: "Omar Hassan",
      title: "Board Member",
      department: "Board of Directors",
      category: TeamMemberCategory.BOARD,
      bio: "Omar represents the business community’s interests in digital health and hospital network growth.",
      email: "omar.hassan@daryeel.com",
      phone: "+252634000105",
      expertise: ["Business Development", "Partnerships"],
      sortOrder: 5,
    },
    {
      slug: "sadia-ibrahim-board",
      fullName: "Sadia Ibrahim",
      title: "Board Member",
      department: "Board of Directors",
      category: TeamMemberCategory.BOARD,
      bio: "Sadia advocates for women’s health, youth programs, and equitable access to care on the platform.",
      email: "sadia.ibrahim@daryeel.com",
      phone: "+252634000106",
      expertise: ["Women’s Health", "Education"],
      sortOrder: 6,
    },
    {
      slug: "eng-khadar-eid",
      fullName: "Eng. Khadar Eid",
      title: "Founder & Platform Lead",
      department: "Executive Leadership",
      category: TeamMemberCategory.EXECUTIVE,
      bio: "Leads Daryeel Health with vision and dedication to connected, accessible digital healthcare across Somaliland and East Africa.",
      email: "info@daryeel.com",
      phone: "+252634000100",
      expertise: ["Digital Health", "Product Strategy"],
      education: "Software Engineering",
      yearsExperience: 10,
      sortOrder: 1,
      isFeatured: true,
    },
    {
      slug: "dr-abdi-hassan",
      fullName: "Dr. Abdi Hassan",
      title: "Chief Medical Advisor",
      department: "Executive Leadership",
      category: TeamMemberCategory.EXECUTIVE,
      bio: "Guides clinical standards, provider quality, and patient-safety practices across the Daryeel network.",
      email: "dr.abdi@daryeel.so",
      phone: "+252634000110",
      expertise: ["Clinical Governance", "Telemedicine"],
      education: "MD, Internal Medicine",
      yearsExperience: 15,
      sortOrder: 2,
      isFeatured: true,
    },
    {
      slug: "fartun-ahmed-exec",
      fullName: "Fartun Ahmed",
      title: "Deputy Director",
      department: "Executive Leadership",
      category: TeamMemberCategory.EXECUTIVE,
      bio: "Fartun oversees daily operations and strategic planning for healthcare services.",
      email: "fartun.ahmed@daryeel.com",
      phone: "+252634000111",
      expertise: ["Operations", "Strategy"],
      education: "MBA in Healthcare Management",
      yearsExperience: 12,
      sortOrder: 3,
      isFeatured: true,
    },
    {
      slug: "amina-yusuf-exec",
      fullName: "Amina Yusuf",
      title: "Head of Patient Programs",
      department: "Patient Services",
      category: TeamMemberCategory.EXECUTIVE,
      bio: "Amina develops programs for families and young adults, including health education and community outreach.",
      email: "amina.yusuf@daryeel.com",
      phone: "+252634000112",
      expertise: ["Patient Programs", "Community Health"],
      education: "Bachelor's in Public Health",
      yearsExperience: 8,
      sortOrder: 4,
      isFeatured: true,
    },
    {
      slug: "mohamed-ali-dept",
      fullName: "Mohamed Ali",
      title: "Digital Services Manager",
      department: "Technology",
      category: TeamMemberCategory.DEPARTMENT,
      bio: "Oversees Daryeel’s digital infrastructure, mobile apps, hospital integrations, and technology training.",
      sortOrder: 1,
    },
    {
      slug: "sadia-ibrahim-dept",
      fullName: "Sadia Ibrahim",
      title: "Administrative Manager",
      department: "Administration",
      category: TeamMemberCategory.DEPARTMENT,
      bio: "Manages daily operations, budgeting, and human resources for the Daryeel platform team.",
      sortOrder: 2,
    },
    {
      slug: "hassan-nur-dept",
      fullName: "Hassan Nur",
      title: "Facilities & Partner Ops",
      department: "Operations",
      category: TeamMemberCategory.DEPARTMENT,
      bio: "Ensures partner hospitals and clinics stay connected and ready to serve patients.",
      sortOrder: 3,
    },
    {
      slug: "nadia-omar-dept",
      fullName: "Nadia Omar",
      title: "Outreach Coordinator",
      department: "Community Relations",
      category: TeamMemberCategory.DEPARTMENT,
      bio: "Leads community partnerships, health awareness campaigns, and outreach across Somaliland.",
      sortOrder: 4,
    },
    {
      slug: "abdirahman-yusuf-staff",
      fullName: "Abdirahman Yusuf",
      title: "Clinical Support Specialist",
      department: "Clinical Services",
      category: TeamMemberCategory.STAFF,
      bio: "Supports clinicians with appointment workflows and patient care coordination.",
      sortOrder: 1,
    },
    {
      slug: "halima-aden-staff",
      fullName: "Halima Aden",
      title: "Records Specialist",
      department: "Health Records",
      category: TeamMemberCategory.STAFF,
      bio: "Maintains accurate digital health records and document quality standards.",
      sortOrder: 2,
    },
    {
      slug: "mustafa-jama-staff",
      fullName: "Mustafa Jama",
      title: "IT Support Specialist",
      department: "Technology",
      category: TeamMemberCategory.STAFF,
      bio: "Provides technical support for users, clinics, and hospital integrations.",
      sortOrder: 3,
    },
    {
      slug: "fartun-hassan-staff",
      fullName: "Fartun Hassan",
      title: "Youth Health Coordinator",
      department: "Patient Programs",
      category: TeamMemberCategory.STAFF,
      bio: "Coordinates youth wellness and family health education activities.",
      sortOrder: 4,
    },
    {
      slug: "khadar-ahmed-staff",
      fullName: "Khadar Ahmed",
      title: "Research Assistant",
      department: "Insights",
      category: TeamMemberCategory.STAFF,
      bio: "Supports health insights, reporting, and program evaluation.",
      sortOrder: 5,
    },
    {
      slug: "asha-duale-staff",
      fullName: "Asha Duale",
      title: "Event Coordinator",
      department: "Community Engagement",
      category: TeamMemberCategory.STAFF,
      bio: "Plans health campaigns, partner events, and community workshops.",
      sortOrder: 6,
    },
    {
      slug: "yusuf-ali-staff",
      fullName: "Yusuf Ali",
      title: "Care Desk Supervisor",
      department: "Customer Service",
      category: TeamMemberCategory.STAFF,
      bio: "Supervises patient support channels and booking assistance.",
      sortOrder: 7,
    },
    {
      slug: "safiya-ismail-staff",
      fullName: "Safiya Ismail",
      title: "Compliance Officer",
      department: "Trust & Safety",
      category: TeamMemberCategory.STAFF,
      bio: "Helps protect privacy, consent, and responsible healthcare data practices.",
      sortOrder: 8,
    },
    {
      slug: "ministry-of-health-somaliland",
      fullName: "Ministry of Health - Somaliland",
      title: "Government",
      department: "Government",
      category: TeamMemberCategory.PARTNER,
      bio: "Strategic partner for public health programs and digital care initiatives.",
      expertise: ["Public Health"],
      sortOrder: 1,
    },
    {
      slug: "hargeisa-group-hospital",
      fullName: "Hargeisa Group Hospital",
      title: "Hospital Partner",
      department: "Hospital",
      category: TeamMemberCategory.PARTNER,
      bio: "Collaboration on hospital bookings, referrals, and clinician network growth.",
      expertise: ["Hospital Care"],
      sortOrder: 2,
    },
    {
      slug: "ethiopia-somali-region-health",
      fullName: "Ethiopia Somali Region Health Network",
      title: "International",
      department: "International",
      category: TeamMemberCategory.PARTNER,
      bio: "Regional partnership for clinician training and cross-border care coordination.",
      expertise: ["Regional Care"],
      sortOrder: 3,
    },
    {
      slug: "hargeisa-municipality",
      fullName: "Hargeisa Municipality",
      title: "Government",
      department: "Government",
      category: TeamMemberCategory.PARTNER,
      bio: "Local government support for community health programs.",
      expertise: ["Community Programs"],
      sortOrder: 4,
    },
    {
      slug: "university-of-hargeisa",
      fullName: "University of Hargeisa",
      title: "Education",
      department: "Education",
      category: TeamMemberCategory.PARTNER,
      bio: "Academic partnership for research, internships, and health innovation.",
      expertise: ["Research", "Education"],
      sortOrder: 5,
    },
    {
      slug: "local-business-association",
      fullName: "Local Business Association",
      title: "Business",
      department: "Business",
      category: TeamMemberCategory.PARTNER,
      bio: "Support for workplace wellness and employer health programs.",
      expertise: ["Employer Health"],
      sortOrder: 6,
    },
    {
      slug: "dahabshiil-group",
      fullName: "Dahabshiil Group",
      title: "Gold Sponsor - Supporting digital health access programs",
      department: "Gold Sponsor",
      category: TeamMemberCategory.SPONSOR,
      bio: "Supporting youth innovation and digital health access programs.",
      sortOrder: 1,
    },
    {
      slug: "telesom-company",
      fullName: "Telesom Company",
      title: "Silver Sponsor - Providing connectivity for care",
      department: "Silver Sponsor",
      category: TeamMemberCategory.SPONSOR,
      bio: "Providing connectivity that helps patients and clinics stay online.",
      sortOrder: 2,
    },
    {
      slug: "golis-telecom",
      fullName: "Golis Telecom",
      title: "Bronze Sponsor - Technology infrastructure support",
      department: "Bronze Sponsor",
      category: TeamMemberCategory.SPONSOR,
      bio: "Technology infrastructure support for digital healthcare delivery.",
      sortOrder: 3,
    },
    {
      slug: "somali-development-foundation",
      fullName: "Somali Development Foundation",
      title: "Partner for community development initiatives",
      department: "Partner Sponsor",
      category: TeamMemberCategory.SPONSOR,
      bio: "Partner for community development and health equity initiatives.",
      sortOrder: 4,
    },
    {
      slug: "international-rescue-committee",
      fullName: "International Rescue Committee",
      title: "Support for literacy and health education programs",
      department: "Partner Sponsor",
      category: TeamMemberCategory.SPONSOR,
      bio: "Support for health education and community wellbeing programs.",
      sortOrder: 5,
    },
    {
      slug: "undp-somalia",
      fullName: "UNDP Somalia",
      title: "Support for sustainable development initiatives",
      department: "Partner Sponsor",
      category: TeamMemberCategory.SPONSOR,
      bio: "Support for sustainable digital development initiatives.",
      sortOrder: 6,
    },
    {
      slug: "hawa-mohamed-vol",
      fullName: "Hawa Mohamed",
      title: "Health Education Tutor",
      department: "Volunteers",
      category: TeamMemberCategory.VOLUNTEER,
      bio: "Supports community health literacy sessions and patient onboarding.",
      yearsExperience: 120,
      sortOrder: 1,
    },
    {
      slug: "abdikarim-hussein-vol",
      fullName: "Abdikarim Hussein",
      title: "Tech Mentor",
      department: "Volunteers",
      category: TeamMemberCategory.VOLUNTEER,
      bio: "Mentors clinics on using Daryeel digital tools effectively.",
      yearsExperience: 85,
      sortOrder: 2,
    },
    {
      slug: "nasra-ali-vol",
      fullName: "Nasra Ali",
      title: "Wellness Facilitator",
      department: "Volunteers",
      category: TeamMemberCategory.VOLUNTEER,
      bio: "Helps run wellness and family health awareness sessions.",
      yearsExperience: 60,
      sortOrder: 3,
    },
    {
      slug: "omar-farah-vol",
      fullName: "Omar Farah",
      title: "Event Assistant",
      department: "Volunteers",
      category: TeamMemberCategory.VOLUNTEER,
      bio: "Assists with community health events and partner outreach days.",
      yearsExperience: 45,
      sortOrder: 4,
    },
  ];

  for (const member of teamSeed) {
    await prisma.teamMember.upsert({
      where: { slug: member.slug },
      update: {
        fullName: member.fullName,
        title: member.title,
        department: member.department,
        category: member.category,
        bio: member.bio,
        email: member.email,
        phone: member.phone,
        expertise: member.expertise ?? [],
        education: member.education,
        yearsExperience: member.yearsExperience,
        sortOrder: member.sortOrder,
        isPublished: true,
        isFeatured: Boolean(member.isFeatured),
      },
      create: {
        slug: member.slug,
        fullName: member.fullName,
        title: member.title,
        department: member.department,
        category: member.category,
        bio: member.bio,
        email: member.email,
        phone: member.phone,
        expertise: member.expertise ?? [],
        education: member.education,
        yearsExperience: member.yearsExperience,
        sortOrder: member.sortOrder,
        isPublished: true,
        isFeatured: Boolean(member.isFeatured),
      },
    });
  }

  const extraPages = [
    {
      slug: "training",
      title: "Training",
      subtitle:
        "Practical digital health training for clinicians, hospital teams, and community partners.",
      summary:
        "Learn the skills that power connected care across Somaliland and East Africa.",
      sortOrder: 2,
    },
    {
      slug: "events",
      title: "Events",
      subtitle:
        "Workshops, community days, and partner sessions that bring connected healthcare to life.",
      summary: "Join us in person or online. Registration is free unless noted.",
      sortOrder: 3,
    },
    {
      slug: "insights",
      title: "Insights",
      subtitle:
        "Stories, guides, and updates on digital healthcare and patient safety.",
      summary: "Insights for patients and providers across East Africa.",
      sortOrder: 4,
    },
    {
      slug: "contact",
      title: "Contact",
      subtitle:
        "Reach the Daryeel Health team for support, partnerships, training, or media.",
      summary: "We usually respond within one business day.",
      sortOrder: 5,
    },
  ] as const;

  for (const page of extraPages) {
    await prisma.cmsPage.upsert({
      where: { slug: page.slug },
      update: {
        title: page.title,
        subtitle: page.subtitle,
        summary: page.summary,
        status: CmsPageStatus.PUBLISHED,
        publishedAt: new Date(),
        sortOrder: page.sortOrder,
      },
      create: {
        slug: page.slug,
        title: page.title,
        subtitle: page.subtitle,
        summary: page.summary,
        status: CmsPageStatus.PUBLISHED,
        publishedAt: new Date(),
        sortOrder: page.sortOrder,
      },
    });
  }

  const count = await prisma.teamMember.count();
  const pages = await prisma.cmsPage.count();
  console.log("✅ CMS seed complete");
  console.log(`   Pages: ${pages}`);
  console.log(`   Team members: ${count}`);
}

main()
  .catch((error) => {
    console.error("❌ CMS seed failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
