import { useSelector } from "react-redux"
import { useLocation } from "react-router-dom"
import { RootState } from "@/Redex/store/store"
import { useGetMyProfileQuery } from "@/Redex/service/users/UsersApi"
import { useGetDashboardQuery } from "@/Redex/service/Dashboard/Dashboard"
import {
  isAdminRole,
  normalizeRole,
  sectionFromLocation,
} from "./Sidebar"
import { CareHome } from "./CareHome"
import { DailyHealthPanel } from "./DailyHealthPanel"
import { DoctorWorkspace } from "./DoctorWorkspace"
import {
  AllergiesSection,
  AppointmentsSection,
  DoctorsSection,
  EmergencySection,
  FamilySection,
  MedicationsSection,
  NotificationsSection,
  PaymentsSection,
  PrescriptionsSection,
  RecordsSection,
  VitalsSection,
} from "./HealthSections"
import { PageLoader } from "@/components/common/PageLoader"
import { PatientIdCard } from "@/components/common/PatientIdCard"
import { MyHealthcareSection } from "@/components/healthcare/MyHealthcareSection"
import { HospitalsSection } from "@/components/healthcare/HospitalsSection"
import HealthcareBookingPage from "@/features/Main/public/HealthcareBookingPage"
import { Link } from "react-router-dom"
import { ShieldCheck } from "lucide-react"
import { useGetMyDoctorProfileQuery } from "@/Redex/service/doctors/DoctorsApi"

export function Dashboard() {
  const location = useLocation()
  const session = useSelector((state: RootState) => state.userInfo)
  const role = normalizeRole(session.role)
  const section = sectionFromLocation(location.pathname, location.search)

  const { data: profile, isLoading: profileLoading } = useGetMyProfileQuery()
  const { data, isLoading: dashLoading } = useGetDashboardQuery()
  const { data: myDoctor, isLoading: doctorLoading } = useGetMyDoctorProfileQuery(
    undefined,
    {
      skip: !session.isAuthenticated,
    }
  )
  const isDoctor = Boolean(myDoctor?.id)

  const name = profile?.fullName || session.name || "User"
  const image = profile?.avatarUrl || profile?.picture || session.image
  const healthId = profile?.healthId

  const isHome = section === "dashboard" || section === "home"
  const bootLoading =
    isHome && (profileLoading || dashLoading || doctorLoading) && !data && !profile

  if (bootLoading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-5">
      {isHome ? (
        <>
          {isDoctor ? <DoctorWorkspace /> : null}
          {!isDoctor ? (
            <CareHome name={name} image={image} data={data} healthId={healthId} />
          ) : (
            <div className="rounded-2xl border border-blue-100 bg-white p-4 text-sm text-muted-foreground shadow-sm">
              Also available:{" "}
              <Link className="font-semibold text-primary" to="/dashboard?section=appointments">
                Visits inbox
              </Link>
              {" · "}
              <Link className="font-semibold text-primary" to="/dashboard?section=doctors">
                Public doctors
              </Link>
              {" · "}
              <Link className="font-semibold text-primary" to={`/doctors/${myDoctor!.id}`}>
                My public profile
              </Link>
            </div>
          )}
        </>
      ) : section === "clinic" || section === "doctor" ? (
        <DoctorWorkspace />
      ) : section === "hospitals" ? (
        <HospitalsSection />
      ) : section === "book" ? (
        <HealthcareBookingPage embedded />
      ) : section === "doctors" ? (
        isDoctor ? <DoctorWorkspace /> : <DoctorsSection />
      ) : section === "appointments" ? (
        <AppointmentsSection />
      ) : section === "healthcare" ? (
        <MyHealthcareSection />
      ) : section === "payments" ? (
        <PaymentsSection />
      ) : section === "health" ? (
        <DailyHealthPanel />
      ) : section === "vitals" ? (
        <VitalsSection />
      ) : section === "medications" ? (
        <MedicationsSection />
      ) : section === "allergies" ? (
        <AllergiesSection />
      ) : section === "prescriptions" ? (
        <PrescriptionsSection />
      ) : section === "records" ? (
        <RecordsSection />
      ) : section === "family" ? (
        <FamilySection />
      ) : section === "emergency" ? (
        <EmergencySection />
      ) : section === "notifications" ? (
        <NotificationsSection />
      ) : section === "admin" && isAdminRole(role) ? (
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <div>
              <h2 className="font-heading text-xl font-bold text-brand-dark">
                Admin console
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage users, doctor verification, and audit logs.
              </p>
            </div>
          </div>
          <Link
            to="/admin"
            className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Open admin
          </Link>
        </div>
      ) : section === "profile" ? (
        <PatientIdCard healthId={healthId} />
      ) : (
        <CareHome name={name} image={image} data={data} healthId={healthId} />
      )}
    </div>
  )
}
