"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CMS_PAGE_CATALOG = void 0;
/** Keep in sync with Website/src/config/cmsPages.ts */
const cmsListDefaults_1 = require("./cmsListDefaults");
exports.CMS_PAGE_CATALOG = [
    {
        slug: "about",
        title: "About Us",
        subtitle: "Discover the story, mission, and people behind Daryeel Health",
        summary: "Daryeel Health connects patients, providers, hospitals, labs, pharmacies, employers and government across Somaliland and East Africa.",
        sortOrder: 0,
        body: {
            vision: "A Somaliland and East Africa where every family can access trusted care through one connected digital health identity — continuous, secure, and human.",
            mission: "To connect patients and providers with practical digital tools for records, bookings, hospitals, and doctors — so care is easier to find, easier to manage, and easier to trust.",
            philosophy: "Business first, technology second — design for real care workflows, then use technology to serve people with clarity and dignity.",
            quote: "Caafimaadkaaga, Gacantaada",
            values: [
                {
                    title: "Patient first",
                    description: "Every feature starts with safer, clearer care for families.",
                },
                {
                    title: "Access for all",
                    description: "Hospitals and doctors should be discoverable across communities.",
                },
                {
                    title: "Privacy & trust",
                    description: "Consent, security, and responsible handling of health data.",
                },
                {
                    title: "Excellence",
                    description: "Reliable tools clinicians and patients will actually use.",
                },
                {
                    title: "Partnership",
                    description: "Growing a trusted network of facilities and professionals.",
                },
                {
                    title: "Innovation",
                    description: "Practical digital health that fits local workflows.",
                },
            ],
        },
    },
    {
        slug: "management-staff",
        title: "Our Dedicated Team",
        subtitle: "Meet the dedicated team, board members, partners, and supporters behind Daryeel Health",
        summary: "Our dedicated team consists of qualified healthcare leaders, administrators, board members, partners, and volunteers committed to serving the community with professionalism, integrity, and passion.",
        sortOrder: 1,
    },
    {
        slug: "training",
        title: "Training",
        subtitle: "Practical digital health training for clinicians, hospital teams, and community partners.",
        summary: "Learn the skills that power connected care across Somaliland and East Africa.",
        sortOrder: 2,
        body: (0, cmsListDefaults_1.bodyForSlug)("training"),
    },
    {
        slug: "events",
        title: "Events",
        subtitle: "Workshops, community days, and partner sessions that bring connected healthcare to life.",
        summary: "Join us in person or online. Registration is free unless noted.",
        sortOrder: 3,
        body: (0, cmsListDefaults_1.bodyForSlug)("events"),
    },
    {
        slug: "insights",
        title: "Insights",
        subtitle: "Stories, guides, and updates on digital healthcare and patient safety.",
        summary: "Insights for patients and providers across East Africa.",
        sortOrder: 4,
        body: (0, cmsListDefaults_1.bodyForSlug)("insights"),
    },
    {
        slug: "contact",
        title: "Contact",
        subtitle: "Reach the Daryeel Health team for support, partnerships, training, or media.",
        summary: "We usually respond within one business day.",
        sortOrder: 5,
    },
    {
        slug: "care",
        title: "Care",
        subtitle: "Find hospitals, doctors, and the care pathway that fits you.",
        summary: "Book hospital visits, connect with Daryeel doctors, track appointments, and keep your health journey in one place.",
        sortOrder: 6,
        highlights: [
            { title: "Hospital visits", description: "Book with partner facility doctors" },
            { title: "Doctor bookings", description: "Independent clinicians on Daryeel" },
            { title: "Visit tracking", description: "Confirmations and status in your dashboard" },
        ],
        cta: {
            title: "Ready to get care?",
            description: "Browse hospitals or doctors and request a visit.",
            primaryLabel: "Find hospitals",
            primaryHref: "/hospitals",
            secondaryLabel: "Find doctors",
            secondaryHref: "/doctors",
        },
    },
    {
        slug: "home",
        title: "Healthcare, Connected Around You",
        subtitle: "Your Health. Your Care. One Connected Platform.",
        summary: "Daryeel Health helps people connect with hospitals and doctors, manage health information, and stay connected to better care across Somaliland and East Africa.",
        sortOrder: 6,
        highlights: [
            { title: "Hospitals", description: "Browse partner facilities and book visits" },
            { title: "Doctors", description: "Find clinicians by specialty" },
            { title: "Health records", description: "Keep your care journey in one place" },
        ],
    },
    {
        slug: "hospitals",
        title: "Hospitals",
        subtitle: "Browse partner hospitals and book with facility doctors.",
        summary: "Discover hospitals across the Daryeel network and request a visit with their clinicians.",
        sortOrder: 7,
    },
    {
        slug: "doctors",
        title: "Daryeel doctors",
        subtitle: "Independent clinicians on the Daryeel directory — specialty, bio, and booking.",
        summary: "Find independent Daryeel doctors by specialty and book a local visit.",
        sortOrder: 8,
    },
    {
        slug: "privacy",
        title: "Privacy Policy",
        subtitle: "How Daryeel Health protects your personal and health information.",
        summary: "We are committed to privacy, consent, and responsible handling of health data.",
        sortOrder: 9,
    },
    {
        slug: "terms",
        title: "Terms of Use",
        subtitle: "The rules that guide use of the Daryeel Health platform.",
        summary: "Please read these terms carefully before using Daryeel Health services.",
        sortOrder: 10,
    },
];
