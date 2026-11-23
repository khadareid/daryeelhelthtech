import { FormEvent, useState } from "react"
import { Link } from "react-router-dom"
import {
  Clock3,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PageHero } from "@/components/marketing/PageHero"
import { marketingImages } from "@/config/marketingImages"
import { siteConfig } from "@/config/site"
import { useGetPublicCmsPageQuery } from "@/Redex/service/cms/CmsApi"

const TOPICS = [
  "General question",
  "Patient support",
  "Hospital partnership",
  "Doctor application",
  "Training request",
  "Event collaboration",
]

export default function ContactPage() {
  const { data: cms } = useGetPublicCmsPageQuery("contact")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [topic, setTopic] = useState(TOPICS[0])
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const heroImage = cms?.heroImageUrl || marketingImages.contactHero
  const title = cms?.title || "Contact"
  const subtitle =
    cms?.subtitle ||
    "Reach the Daryeel Health team for support, partnerships, training, or media."

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill name, email, and message")
      return
    }
    setSending(true)
    try {
      const subject = encodeURIComponent(`[Daryeel Contact] ${topic}`)
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "—"}\nTopic: ${topic}\n\n${message}`
      )
      window.location.href = `mailto:${siteConfig.supportEmail}?subject=${subject}&body=${body}`
      toast.success("Opening your email app…")
      setMessage("")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-[70vh] bg-brand-bg">
      <PageHero
        image={heroImage}
        eyebrow="Support · Engage"
        title={title}
        subtitle={subtitle}
        chips={["Support", "Partnerships", "Training", "Press"]}
        actions={
          <Button asChild className="bg-white text-primary hover:bg-white/90">
            <a href={`tel:${siteConfig.supportPhone}`}>
              Call {siteConfig.supportPhone}
            </a>
          </Button>
        }
      />

      <div className="container-page py-12 sm:py-16">
        {/* Photo strip */}
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {[
            marketingImages.contactOffice,
            marketingImages.contactSupport,
            marketingImages.careHospital,
          ].map((src, i) => (
            <div
              key={src}
              className={`overflow-hidden rounded-2xl ${i === 0 ? "sm:col-span-1" : ""}`}
            >
              <img
                src={src}
                alt=""
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="space-y-4">
            <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="font-heading text-xl font-bold text-brand-dark">
                Get in touch
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                We usually respond within one business day.
              </p>
              <ul className="mt-5 space-y-4 text-sm">
                <li className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-primary">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-brand-dark">Email</p>
                    <a
                      href={`mailto:${siteConfig.supportEmail}`}
                      className="text-primary hover:underline"
                    >
                      {siteConfig.supportEmail}
                    </a>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-primary">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-brand-dark">
                      Phone / Emergency 24/7
                    </p>
                    <a
                      href={`tel:${siteConfig.supportPhone}`}
                      className="text-primary hover:underline"
                    >
                      {siteConfig.supportPhone}
                    </a>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-primary">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-brand-dark">Location</p>
                    <p className="text-muted-foreground">
                      {siteConfig.location || "Hargeisa, Somaliland"}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-primary">
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-brand-dark">Office hours</p>
                    <p className="text-muted-foreground">
                      Sat–Thu · 8:00 AM – 6:00 PM
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="overflow-hidden rounded-3xl shadow-md">
              <img
                src={marketingImages.careDoctor}
                alt="Care team"
                className="aspect-[16/10] w-full object-cover"
              />
              <div className="bg-gradient-to-br from-primary to-brand-dark p-5 text-white">
                <MessageSquare className="h-5 w-5" />
                <p className="mt-3 font-heading text-lg font-bold">
                  Looking for care right now?
                </p>
                <p className="mt-1 text-sm text-white/85">
                  Find hospitals and doctors on the platform.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    asChild
                    variant="secondary"
                    className="bg-white text-primary"
                  >
                    <Link to="/hospitals">Hospitals</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-white/40 bg-transparent text-white hover:bg-white/10"
                  >
                    <Link to="/doctors">Doctors</Link>
                  </Button>
                </div>
              </div>
            </div>
          </aside>

          <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="font-heading text-xl font-bold text-brand-dark sm:text-2xl">
              Send a message
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell us how we can help — patients, partners, and press welcome.
            </p>

            <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 border-blue-100 bg-brand-bg"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border-blue-100 bg-brand-bg"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 border-blue-100 bg-brand-bg"
                  placeholder="+252…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="topic">Topic</Label>
                <select
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="flex h-11 w-full rounded-md border border-blue-100 bg-brand-bg px-3 text-sm"
                >
                  {TOPICS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="border-blue-100 bg-brand-bg"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" className="h-11 gap-2" disabled={sending}>
                  <Send className="h-4 w-4" />
                  {sending ? "Opening…" : "Send message"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
