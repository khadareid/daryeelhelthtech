import { Link } from "react-router-dom"
import { LegalDoc, LegalSection } from "@/components/home/LegalDoc"
import { siteConfig } from "@/config/site"

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="Privacy Policy"
      updated="November 2026"
      otherLabel="Terms of Service →"
      otherTo="/terms"
    >
      <p>Welcome to Daryeel Healthtech.</p>
      <p>
        This Privacy Policy explains how Daryeel Healthtech (&quot;Daryeel&quot;,
        &quot;we&quot;, &quot;us&quot;) may collect, use, store, and share
        personal and healthcare-related information when you use our platform,
        website, applications, and related services.
      </p>
      <p>
        By creating an account or using Daryeel, you acknowledge this Privacy
        Policy. Your use of Daryeel is also governed by our{" "}
        <Link to="/terms" className="font-semibold text-primary hover:underline">
          Terms of Service
        </Link>
        .
      </p>

      <LegalSection title="1. Information We May Collect">
        <p>Depending on how you use Daryeel, we may collect:</p>
        <ul>
          <li>
            <strong>Account information</strong> — such as name, email, phone
            number, password, and profile details
          </li>
          <li>
            <strong>Health-related information</strong> — such as health
            profile details, appointment history, prescriptions, laboratory
            results, vital signs, or records you choose to store or share
          </li>
          <li>
            <strong>Booking information</strong> — such as preferred providers,
            appointment times, and reasons you provide
          </li>
          <li>
            <strong>Provider information</strong> — for hospitals, clinics,
            doctors, laboratories, pharmacies, and organizations using Daryeel
          </li>
          <li>
            <strong>Technical information</strong> — such as device type,
            browser, IP address, app version, and usage logs needed to operate
            and secure the platform
          </li>
          <li>
            <strong>Payment-related information</strong> — where payments are
            available, limited payment details processed through third-party
            payment providers
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. How We Use Information">
        <p>We may use information to:</p>
        <ul>
          <li>Create and manage your account</li>
          <li>Connect you with hospitals, doctors, and healthcare services</li>
          <li>Support appointment booking and visit management</li>
          <li>
            Provide digital health tools such as records, reminders, and Health
            ID features where available
          </li>
          <li>Communicate service updates, confirmations, and support messages</li>
          <li>Improve platform reliability, security, and user experience</li>
          <li>Detect abuse, fraud, or unauthorized access</li>
          <li>Comply with applicable legal obligations</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Healthcare Information">
        <p>
          Healthcare-related information is sensitive. Daryeel treats it with
          care and uses access controls, authentication, and related security
          measures appropriate to the platform.
        </p>
        <p>
          Daryeel provides digital tools and connections. Daryeel does not
          replace qualified medical professionals, and platform information
          should not automatically be treated as a diagnosis or treatment
          recommendation.
        </p>
      </LegalSection>

      <LegalSection title="4. How Information May Be Shared">
        <p>We may share information only as needed to operate Daryeel, including:</p>
        <ul>
          <li>
            <strong>Healthcare providers</strong> you choose to book with or
            connect to (for example, appointment and relevant patient details)
          </li>
          <li>
            <strong>Service providers</strong> that help us run hosting,
            messaging, analytics, or payment features
          </li>
          <li>
            <strong>Legal or safety reasons</strong> when required by law or to
            protect users, providers, or the platform
          </li>
        </ul>
        <p>
          We do not sell personal information as a business model.
        </p>
      </LegalSection>

      <LegalSection title="5. Third-Party Services">
        <p>
          Daryeel may integrate with third-party services, including payment
          providers and healthcare systems.
        </p>
        <p>
          Those services may process information under their own privacy
          policies and terms. Users should review those policies when using
          third-party features.
        </p>
      </LegalSection>

      <LegalSection title="6. Account Security">
        <p>You are responsible for:</p>
        <ul>
          <li>Keeping your login credentials secure</li>
          <li>Not sharing your account with unauthorized persons</li>
          <li>
            Notifying Daryeel if you believe your account has been compromised
          </li>
        </ul>
        <p>
          Daryeel may suspend or restrict an account when necessary to protect
          the platform, users, or healthcare providers.
        </p>
      </LegalSection>

      <LegalSection title="7. Data Retention">
        <p>
          We retain information for as long as needed to provide Daryeel
          services, maintain account history, meet legal or operational
          requirements, and resolve disputes.
        </p>
        <p>
          When information is no longer needed, we may delete or de-identify it
          according to our retention practices.
        </p>
      </LegalSection>

      <LegalSection title="8. Your Choices">
        <p>Depending on available functionality, you may be able to:</p>
        <ul>
          <li>Update account and profile information</li>
          <li>Manage appointments and related preferences</li>
          <li>Request support regarding your account information</li>
          <li>Stop using Daryeel at any time</li>
        </ul>
        <p>
          For privacy questions or requests, contact Daryeel through the support
          channels on the platform.
        </p>
      </LegalSection>

      <LegalSection title="9. Children and Dependents">
        <p>
          If you use Daryeel on behalf of another person, including a family
          member or dependent, you must have the appropriate authority to do so
          and must provide accurate information.
        </p>
      </LegalSection>

      <LegalSection title="10. International and Local Use">
        <p>
          Daryeel is designed for users and providers in Somaliland, Somalia, and
          the broader East Africa region as the platform expands.
        </p>
        <p>
          Information may be processed on infrastructure needed to deliver the
          service securely and reliably.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to This Policy">
        <p>Daryeel may update this Privacy Policy from time to time.</p>
        <p>
          Updated versions will be published on the platform with a new
          &quot;Last Updated&quot; date.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact">
        <p>
          For questions about this Privacy Policy or Daryeel privacy practices,
          contact us through the official support channels on the platform, or
          email{" "}
          <a
            href={`mailto:${siteConfig.supportEmail}`}
            className="font-semibold text-primary hover:underline"
          >
            {siteConfig.supportEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalDoc>
  )
}
