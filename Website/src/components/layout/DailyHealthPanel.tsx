import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import {
  Activity,
  Bike,
  Droplets,
  Flame,
  Footprints,
  Heart,
  Moon,
  Plus,
  Smile,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { RootState } from "@/Redex/store/store"
import {
  ActivityLevel,
  DailyHealthLog,
  DailyHealthLogInput,
  EnergyLevel,
  MoodLevel,
  PainLevel,
  SleepQuality,
  StressLevel,
} from "@/Redex/types/Types"
import {
  useCreateDailyHealthLogMutation,
  useGetDailyHealthHistoryQuery,
  useGetTodayDailyHealthLogQuery,
  useUpdateDailyHealthLogMutation,
} from "@/Redex/service/DailyHealthLog/DailyHealthLog"

function todayKey() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

function pretty(value?: string | null) {
  if (!value) return "—"
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function numberOrUndefined(value: string) {
  if (value.trim() === "") return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function percent(current?: number | null, goal?: number | null) {
  if (!goal || goal <= 0) return 0
  return Math.min(100, Math.round(((current ?? 0) / goal) * 100))
}

function dateLabel(value?: string | Date | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { message?: string } }).data
    if (data?.message) return data.message
  }
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: string | number }).status
    if (status === "FETCH_ERROR") return "The health server is not responding."
  }
  return "Could not save today's log."
}

const MOODS = Object.values(MoodLevel)
const SLEEP = Object.values(SleepQuality)
const STRESS = Object.values(StressLevel)
const ENERGY = Object.values(EnergyLevel)
const ACTIVITY = Object.values(ActivityLevel)
const PAIN = Object.values(PainLevel)

export function DailyHealthPanel({ soft = false }: { soft?: boolean }) {
  const userId = useSelector((state: RootState) => state.userInfo.userId)
  const { data: today, isLoading, isError, refetch } = useGetTodayDailyHealthLogQuery()
  const { data: history } = useGetDailyHealthHistoryQuery({ limit: 7 })
  const [createLog, { isLoading: creating }] = useCreateDailyHealthLogMutation()
  const [updateLog, { isLoading: updating }] = useUpdateDailyHealthLogMutation()

  const [mood, setMood] = useState("")
  const [sleepQuality, setSleepQuality] = useState("")
  const [stressLevel, setStressLevel] = useState("")
  const [energyLevel, setEnergyLevel] = useState("")
  const [activityLevel, setActivityLevel] = useState("")
  const [painLevel, setPainLevel] = useState("")
  const [steps, setSteps] = useState("")
  const [water, setWater] = useState("")
  const [sleepHours, setSleepHours] = useState("")
  const [activeMinutes, setActiveMinutes] = useState("")
  const [caloriesIntake, setCaloriesIntake] = useState("")
  const [caloriesBurned, setCaloriesBurned] = useState("")
  const [weightKg, setWeightKg] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (!today) return
    setMood(today.mood ?? "")
    setSleepQuality(today.sleepQuality ?? "")
    setStressLevel(today.stressLevel ?? "")
    setEnergyLevel(today.energyLevel ?? "")
    setActivityLevel(today.activityLevel ?? "")
    setPainLevel(today.painLevel ?? "")
    setSteps(today.steps ? String(today.steps) : "")
    setWater(today.waterIntakeMl ? String(today.waterIntakeMl) : "")
    setSleepHours(today.sleepHours ? String(today.sleepHours) : "")
    setActiveMinutes(today.activeMinutes ? String(today.activeMinutes) : "")
    setCaloriesIntake(today.caloriesIntake ? String(today.caloriesIntake) : "")
    setCaloriesBurned(today.caloriesBurned ? String(today.caloriesBurned) : "")
    setWeightKg(today.weightKg ? String(today.weightKg) : "")
    setNotes(today.notes ?? "")
  }, [today])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const date = todayKey()
    const fields = {
      mood: (mood || undefined) as MoodLevel | undefined,
      sleepQuality: (sleepQuality || undefined) as SleepQuality | undefined,
      stressLevel: (stressLevel || undefined) as StressLevel | undefined,
      energyLevel: (energyLevel || undefined) as EnergyLevel | undefined,
      activityLevel: (activityLevel || undefined) as ActivityLevel | undefined,
      painLevel: (painLevel || undefined) as PainLevel | undefined,
      steps: numberOrUndefined(steps),
      waterIntakeMl: numberOrUndefined(water),
      sleepHours: numberOrUndefined(sleepHours),
      activeMinutes: numberOrUndefined(activeMinutes),
      caloriesIntake: numberOrUndefined(caloriesIntake),
      caloriesBurned: numberOrUndefined(caloriesBurned),
      weightKg: numberOrUndefined(weightKg),
      notes: notes.trim() || undefined,
      source: "MANUAL" as const,
    }

    const payload = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined)
    ) as Partial<Omit<DailyHealthLogInput, "userId" | "date">>

    try {
      if (today) {
        await updateLog({ date, data: payload }).unwrap()
      } else {
        await createLog({ userId, date, ...payload } as DailyHealthLogInput).unwrap()
      }
      toast.success("Today's health log is saved")
      refetch()
    } catch (error) {
      const status =
        error && typeof error === "object" && "status" in error
          ? (error as { status?: number }).status
          : undefined
      if (!today && status === 409) {
        try {
          await updateLog({ date, data: payload }).unwrap()
          toast.success("Today's health log is updated")
          refetch()
          return
        } catch (updateError) {
          toast.error(errorMessage(updateError))
          return
        }
      }
      toast.error(errorMessage(error))
    }
  }

  const activity = useMemo(() => {
    return {
      sample: false,
      steps: today?.steps ?? 0,
      stepsGoal: today?.stepsGoal ?? 10000,
      water: today?.waterIntakeMl ?? 0,
      waterGoal: today?.waterGoalMl ?? 2000,
      sleep: today?.sleepHours ?? 0,
      sleepGoal: today?.sleepGoalHours ?? 8,
      activeMinutes: today?.activeMinutes ?? 0,
      calories: today?.caloriesBurned ?? 0,
      mood: today?.mood ? pretty(today.mood) : "—",
      heart: 0,
    }
  }, [today])

  if (soft) {
    return <SoftToday {...activity} />
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-heading text-xl font-bold text-brand-dark">
          Activity
        </h2>
        <p className="text-sm text-muted-foreground">
          {dateLabel(todayKey())} · steps, water, sleep & vitals like Apple /
          Google Health
        </p>
      </div>

      {isError && (
        <p className="text-sm text-muted-foreground">
          Today's log could not be loaded. You can still save a new one.
        </p>
      )}

      <ActivityBoard {...activity} />

      {today && <LogDetails log={today} />}

      <Card className="border-blue-100 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <h3 className="text-base font-semibold text-brand-dark">
            {today ? "Update today's log" : "Add today's log"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Fill in what you know. Empty fields can stay blank.
          </p>
          <form onSubmit={onSubmit} className="mt-5 space-y-6">
            <fieldset className="space-y-3">
              <legend className="text-xs font-semibold uppercase tracking-wide text-primary">
                How you feel
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Mood">
                  <Select value={mood} onChange={setMood} options={MOODS} />
                </Field>
                <Field label="Sleep quality">
                  <Select value={sleepQuality} onChange={setSleepQuality} options={SLEEP} />
                </Field>
                <Field label="Energy">
                  <Select value={energyLevel} onChange={setEnergyLevel} options={ENERGY} />
                </Field>
                <Field label="Stress">
                  <Select value={stressLevel} onChange={setStressLevel} options={STRESS} />
                </Field>
                <Field label="Activity">
                  <Select value={activityLevel} onChange={setActivityLevel} options={ACTIVITY} />
                </Field>
                <Field label="Pain">
                  <Select value={painLevel} onChange={setPainLevel} options={PAIN} />
                </Field>
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-xs font-semibold uppercase tracking-wide text-primary">
                Today's numbers
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Steps" hint="Example: 8000">
                  <Input inputMode="numeric" value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="8000" />
                </Field>
                <Field label="Water" hint="Millilitres, example: 2000">
                  <Input inputMode="numeric" value={water} onChange={(e) => setWater(e.target.value)} placeholder="2000" />
                </Field>
                <Field label="Sleep" hint="Hours, example: 7.5">
                  <Input inputMode="decimal" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} placeholder="7.5" />
                </Field>
                <Field label="Active minutes" hint="Example: 30">
                  <Input inputMode="numeric" value={activeMinutes} onChange={(e) => setActiveMinutes(e.target.value)} placeholder="30" />
                </Field>
                <Field label="Calories eaten" hint="Example: 1800">
                  <Input inputMode="numeric" value={caloriesIntake} onChange={(e) => setCaloriesIntake(e.target.value)} placeholder="1800" />
                </Field>
                <Field label="Calories burned" hint="Example: 400">
                  <Input inputMode="numeric" value={caloriesBurned} onChange={(e) => setCaloriesBurned(e.target.value)} placeholder="400" />
                </Field>
                <Field label="Weight" hint="Kilograms, example: 70">
                  <Input inputMode="decimal" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="70" />
                </Field>
                <Field label="Notes" hint="Optional">
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How the day felt" />
                </Field>
              </div>
            </fieldset>

            <Button type="submit" disabled={creating || updating} className="h-11 w-full sm:w-auto">
              {creating || updating ? "Saving…" : today ? "Update log" : "Save log"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {(history ?? []).length > 0 && (
        <Card className="border-blue-100 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-brand-dark">Recent days</h3>
            <ul className="mt-3 divide-y divide-blue-50">
              {(history ?? []).map((log) => (
                <li key={log.dailyhealthlogid} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-medium text-brand-dark">{dateLabel(log.date)}</span>
                  <span className="text-muted-foreground">
                    {pretty(log.mood)} · {log.steps ?? 0} steps · {log.waterIntakeMl ?? 0} ml
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </section>
  )
}

type ActivityProps = {
  sample: boolean
  steps: number
  stepsGoal: number
  water: number
  waterGoal: number
  sleep: number
  sleepGoal: number
  activeMinutes: number
  calories: number
  mood: string
  heart: number
}

function SoftToday(props: ActivityProps) {
  const navigate = useNavigate()
  return (
    <Card className="overflow-hidden border-blue-100 bg-white shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-heading text-base font-bold text-brand-dark">
              Activity
            </p>
            <p className="text-xs text-muted-foreground">
              {dateLabel(todayKey())}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="h-8 rounded-full"
            onClick={() => navigate("/dashboard?section=health")}
          >
            <Plus className="h-3.5 w-3.5" />
            Open
          </Button>
        </div>
        <ActivityBoard {...props} compact />
      </CardContent>
    </Card>
  )
}

function ActivityBoard({
  steps,
  stepsGoal,
  water,
  waterGoal,
  sleep,
  activeMinutes,
  calories,
  heart,
  mood,
  compact = false,
}: ActivityProps & { compact?: boolean }) {
  const stepPct = percent(steps, stepsGoal)
  const calPct = percent(calories, 500)
  const waterPct = percent(water, waterGoal)

  return (
    <div
      className={`grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}
    >
      <div
        className={`relative overflow-hidden rounded-3xl bg-primary p-5 text-white shadow-sm ${compact ? "" : "sm:row-span-2"}`}
      >
        <div className="mb-4 flex items-center gap-2">
          <Footprints className="h-5 w-5" />
          <span className="font-heading font-semibold">Walk</span>
        </div>
        <div className="relative mx-auto h-36 w-36">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(#ffffff ${stepPct}%, rgba(255,255,255,0.25) 0)`,
              mask: "radial-gradient(farthest-side, transparent calc(100% - 12px), #000 calc(100% - 11px))",
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 12px), #000 calc(100% - 11px))",
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Footprints className="mb-1 h-5 w-5" />
            <p className="font-heading text-2xl font-bold">
              {steps.toLocaleString()}
            </p>
            <p className="text-xs text-white/80">Steps</p>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-white/85">
          Goal {stepsGoal.toLocaleString()} · {stepPct}%
        </p>
        <p className="mt-1 text-center text-[11px] text-white/70">
          Phone auto-tracks steps in the mobile app
        </p>
      </div>

      <ActivityTile
        icon={Moon}
        title="Sleep"
        value={sleep.toFixed(1)}
        unit="Hours"
        accent="text-orange-500"
        bubble="bg-orange-50 text-orange-500"
      />
      <ActivityTile
        icon={Heart}
        title="Heart"
        value={String(heart)}
        unit="bpm"
        accent="text-red-500"
        bubble="bg-red-50 text-red-500"
        spark
      />
      <ActivityTile
        icon={Activity}
        title="Exercise"
        value={String(Math.max(1, Math.round(activeMinutes / 60) || activeMinutes))}
        unit={activeMinutes >= 60 ? "Hours" : "Min"}
        accent="text-sky-600"
        bubble="bg-sky-50 text-sky-600"
        bars
      />
      <ActivityTile
        icon={Flame}
        title="Calories"
        value={String(Math.round(calories))}
        unit="Kcal"
        accent="text-emerald-600"
        bubble="bg-emerald-50 text-emerald-600"
        ring={calPct}
      />
      <ActivityTile
        icon={Droplets}
        title="Water"
        value={String(water)}
        unit="ml"
        accent="text-cyan-600"
        bubble="bg-cyan-50 text-cyan-600"
        ring={waterPct}
      />
      {!compact ? (
        <>
          <ActivityTile
            icon={Bike}
            title="Active"
            value={String(activeMinutes)}
            unit="Minutes"
            accent="text-violet-600"
            bubble="bg-violet-50 text-violet-600"
          />
          <ActivityTile
            icon={Smile}
            title="Mood"
            value={mood}
            unit="Today"
            accent="text-primary"
            bubble="bg-blue-50 text-primary"
          />
        </>
      ) : null}
    </div>
  )
}

function ActivityTile({
  icon: Icon,
  title,
  value,
  unit,
  accent,
  bubble,
  spark,
  bars,
  ring,
}: {
  icon: typeof Footprints
  title: string
  value: string
  unit: string
  accent: string
  bubble: string
  spark?: boolean
  bars?: boolean
  ring?: number
}) {
  return (
    <div className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${bubble}`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-sm font-semibold text-brand-dark">{title}</p>
      </div>
      {spark ? (
        <div className="mb-2 flex h-5 items-end gap-1">
          {[8, 14, 10, 16, 12, 18, 11].map((h, i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-red-400/70"
              style={{ height: h }}
            />
          ))}
        </div>
      ) : null}
      {bars ? (
        <div className="mb-2 flex h-5 items-end gap-1">
          {[10, 16, 12, 20, 14, 18].map((h, i) => (
            <span
              key={i}
              className="w-1.5 rounded-full bg-sky-400/70"
              style={{ height: h }}
            />
          ))}
        </div>
      ) : null}
      {typeof ring === "number" ? (
        <div className="relative mx-auto mb-1 flex h-16 w-16 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(var(--color-primary, #146AFB) ${ring}%, #E2E8F0 0)`,
              mask: "radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 6px))",
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 6px))",
            }}
          />
          <div className="text-center">
            <p className={`font-heading text-sm font-bold ${accent}`}>{value}</p>
          </div>
        </div>
      ) : (
        <p className={`font-heading text-2xl font-bold ${accent}`}>{value}</p>
      )}
      <p className="text-xs text-muted-foreground">{unit}</p>
    </div>
  )
}

function LogDetails({ log }: { log: DailyHealthLog }) {
  const rows = [
    ["Mood", pretty(log.mood)],
    ["Sleep quality", pretty(log.sleepQuality)],
    ["Stress", pretty(log.stressLevel)],
    ["Energy", pretty(log.energyLevel)],
    ["Activity", pretty(log.activityLevel)],
    ["Pain", pretty(log.painLevel)],
    ["Distance", log.distanceKm ? `${log.distanceKm} km` : "—"],
    ["Active minutes", String(log.activeMinutes ?? 0)],
    ["Calories eaten", String(log.caloriesIntake ?? 0)],
    ["Calories burned", String(log.caloriesBurned ?? 0)],
    ["Weight", log.weightKg ? `${log.weightKg} kg` : "—"],
    ["Hydration", pretty(log.hydrationStatus)],
    ["Steps goal", pretty(log.stepsGoalStatus)],
    ["Water goal", pretty(log.waterGoalStatus)],
    ["Sleep goal", pretty(log.sleepGoalStatus)],
    ["Source", pretty(log.source)],
  ]

  return (
    <Card className="border-blue-100 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-brand-dark">Today's record</h3>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-sm font-medium text-brand-dark">{value}</dd>
            </div>
          ))}
        </dl>
        {log.notes && (
          <p className="mt-3 text-sm text-muted-foreground">{log.notes}</p>
        )}
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-blue-50 bg-blue-50/40 p-3">
      <p className="text-sm font-medium text-brand-dark">{label}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
      <div className="mt-2">{children}</div>
    </div>
  )
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="flex h-10 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <option value="">Select</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {pretty(option)}
        </option>
      ))}
    </select>
  )
}
