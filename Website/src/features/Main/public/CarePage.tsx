import { Link } from "react-router-dom"
import { Building2, ClipboardList, Stethoscope } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ImageCard, PageHero } from "@/components/marketing/PageHero"
import { marketingImages } from "@/config/marketingImages"
import { useGetPublicCmsPageQuery } from "@/Redex/service/cms/CmsApi"

const PATHS = [
  {
    image: marketingImages.careHospital,
    title: "Hospital visits",
    meta: "Facilities",
    description:
      "Browse partner hospitals, open a facility, and book with its doctors.",
    href: "/hospitals",
  },
  {
    image: marketingImages.careDoctor,
    title: "Doctor bookings",
    meta: "Clinicians",
    description:
      "Find independent Daryeel doctors by specialty and book a visit.",
    href: "/doctors",
  },
  {
    image: marketingImages.contactSupport,
    title: "Visit tracking",
    meta: "Dashboard",
    description:
      "Confirmations, tickets, and visit status stay in your dashboard.",
    href: "/dashboard",
  },
]

export default function CarePage() {
  const { data: cms } = useGetPublicCmsPageQuery("care")
  const heroImage = cms?.heroImageUrl || marketingImages.careHero
  const title = cms?.title || "Care"
  const subtitle =
    cms?.subtitle ||
    "Find hospitals, doctors, and the care pathway that fits you — all on one connected platform."

  return (
    <div className="min-h-[70vh] bg-brand-bg">
      <PageHero
        image={heroImage}
        eyebrow="Care pathways"
        title={title}
        subtitle={subtitle}
        chips={["Hospitals", "Doctors", "Bookings", "Records"]}
        actions={
          <>
            <Button asChild className="bg-white text-primary hover:bg-white/90">
              <Link to="/hospitals">Find hospitals</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              <Link to="/doctors">Find doctors</Link>
            </Button>
          </>
        }
      />

      <div className="container-page py-12 sm:py-16">
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Building2, label: "Partner hospitals" },
            { icon: Stethoscope, label: "Verified clinicians" },
            { icon: ClipboardList, label: "Tracked visits" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                <Icon className="h-5 w-5" />
              </span>
              <p className="font-heading text-sm font-bold text-brand-dark">
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PATHS.map((p) => (
            <ImageCard
              key={p.title}
              image={p.image}
              title={p.title}
              meta={p.meta}
              description={p.description}
              footer={
                <Button asChild size="sm">
                  <Link to={p.href}>Open</Link>
                </Button>
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}
