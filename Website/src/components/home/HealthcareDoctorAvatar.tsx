import { useState } from "react"
import {
  doctorInitialsOf,
  doctorNameOf,
  doctorPhotoOf,
  type HealthcareDoctor,
} from "@/Redex/service/healthcare/HealthcareApi"
import { cn } from "@/lib/utils"

type Props = {
  doctor?: HealthcareDoctor | null
  className?: string
  initialsClassName?: string
  rounded?: "full" | "xl" | "2xl" | "3xl"
}

/** Hospital/SaaS doctor photo with name-initials fallback. */
export function HealthcareDoctorAvatar({
  doctor,
  className,
  initialsClassName,
  rounded = "2xl",
}: Props) {
  const src = doctorPhotoOf(doctor)
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(src) && !failed
  const initials = doctorInitialsOf(doctor)
  const name = doctorNameOf(doctor)
  const radius =
    rounded === "full"
      ? "rounded-full"
      : rounded === "3xl"
        ? "rounded-3xl"
        : rounded === "xl"
          ? "rounded-xl"
          : "rounded-2xl"

  if (showImage) {
    return (
      <img
        src={src!}
        alt={name}
        className={cn("object-cover", radius, className)}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <div
      role="img"
      aria-label={name}
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-primary/15 via-brand-light to-primary/25 font-heading font-bold text-primary",
        radius,
        className,
        initialsClassName,
      )}
    >
      {initials}
    </div>
  )
}
