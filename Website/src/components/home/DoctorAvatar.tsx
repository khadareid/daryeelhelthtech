import { useState } from "react"
import {
  doctorDisplayName,
  doctorInitials,
  doctorPhoto,
} from "@/Redex/service/doctors/DoctorsApi"
import type { Doctor } from "@/Redex/types/Types"
import { cn } from "@/lib/utils"

type Props = {
  doctor?: Partial<Doctor> | null
  className?: string
  /** Extra classes on the initials block */
  initialsClassName?: string
  rounded?: "full" | "2xl" | "3xl"
}

/** Doctor photo with name-initials fallback when image is missing or fails. */
export function DoctorAvatar({
  doctor,
  className,
  initialsClassName,
  rounded = "full",
}: Props) {
  const src = doctorPhoto(doctor)
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(src) && !failed
  const initials = doctorInitials(doctor)
  const name = doctorDisplayName(doctor)
  const radius =
    rounded === "full"
      ? "rounded-full"
      : rounded === "3xl"
        ? "rounded-3xl"
        : "rounded-2xl"

  if (showImage) {
    return (
      <img
        src={src}
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
