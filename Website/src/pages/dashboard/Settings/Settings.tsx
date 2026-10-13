// import type React from "react"
// import { useEffect, useMemo, useState } from "react"
// import { useSelector } from "react-redux"
// import { toast } from "sonner"
// import {
//   Activity,
//   Building2,
//   Calendar,
//   CreditCard,
//   Edit3,
//   GraduationCap,
//   Mail,
//   MapPin,
//   MessageSquare,
//   Phone,
//   Save,
//   Settings as SettingsIcon,
//   UserCheck,
//   Users,
// } from "lucide-react"
// import type { RootState } from "@/store/store"
// import { useGetOneCompanyQuery, useUpdateCompanyMutation } from "@/service/Setting/Setting"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Separator } from "@/components/ui/separator"
// import { Skeleton } from "@/components/ui/skeleton"
// import { Switch } from "@/components/ui/switch"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// function getInitials(name: string) {
//   return name
//     .split(" ")
//     .map((w) => w.charAt(0))
//     .join("")
//     .toUpperCase()
//     .slice(0, 2)
// }

// function resolveTenantId(tenant: Record<string, unknown> | null | undefined): number {
//   if (!tenant) return 0
//   return Number(tenant.Tenantid ?? tenant.tenantId ?? 0) || 0
// }

// function SettingsLoading() {
//   return (
//     <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
//       <Skeleton className="h-40 w-full rounded-2xl" />
//       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//         {Array.from({ length: 4 }).map((_, i) => (
//           <Skeleton key={i} className="h-28 rounded-xl" />
//         ))}
//       </div>
//       <Skeleton className="h-72 w-full rounded-2xl" />
//     </div>
//   )
// }

// export default function Settings() {
//   const tenantId = useSelector((state: RootState) => state.userInfo?.tenantId)
//   const [editing, setEditing] = useState(false)
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     address: "",
//     logoUrl: "",
//     billingEmail: "",
//     description: "",
//     city: "",
//     country: "",
//     website: "",
//     contactPerson: "",
//     registrationNumber: "",
//   })

//   const { data: tenant, isLoading, isError, error, refetch } = useGetOneCompanyQuery(
//     String(tenantId ?? ""),
//     { skip: !tenantId }
//   )
//   const [updateCompany, { isLoading: isUpdating }] = useUpdateCompanyMutation()

//   useEffect(() => {
//     if (!tenant) return
//     setFormData({
//       name: tenant.name || "",
//       email: tenant.email || "",
//       phone: (tenant as any).phone || "",
//       address: (tenant as any).address || "",
//       logoUrl: (tenant as any).logoUrl || "",
//       billingEmail: (tenant as any).billingEmail || "",
//       description: (tenant as any).description || "",
//       city: (tenant as any).city || "",
//       country: (tenant as any).country || "",
//       website: (tenant as any).website || "",
//       contactPerson: (tenant as any).contactPerson || "",
//       registrationNumber: (tenant as any).registrationNumber || "",
//     })
//   }, [tenant])

//   const stats = useMemo(() => {
//     if (!tenant) return null
//     const t = tenant as any
//     const membersCount = Number(t.membersCount ?? t.members?.length ?? 0)
//     const trainersCount = Number(t.trainersCount ?? t.trainers?.length ?? 0)
//     const usersCount = Array.isArray(t.users) ? t.users.length : Number(t.usersCount ?? 0)
//     const activeUsers = Array.isArray(t.users)
//       ? t.users.filter((u: any) => u.isActive).length
//       : usersCount
//     const paymentsCount = Number(t.paymentsCount ?? t.Payments?.length ?? t.payments?.length ?? 0)
//     const invoicesCount = Number(t.invoicesCount ?? t.invoices?.length ?? 0)

//     return [
//       {
//         label: "Members",
//         value: membersCount,
//         sub: `${Number(t.activeMembersCount ?? membersCount)} total`,
//         icon: Users,
//         tone: "from-sky-500/15 to-sky-500/5 text-sky-700",
//       },
//       {
//         label: "Trainers",
//         value: trainersCount,
//         sub: `${Number(t.activeTrainersCount ?? trainersCount)} total`,
//         icon: GraduationCap,
//         tone: "from-violet-500/15 to-violet-500/5 text-violet-700",
//       },
//       {
//         label: "Staff Users",
//         value: usersCount,
//         sub: `${activeUsers} active`,
//         icon: UserCheck,
//         tone: "from-emerald-500/15 to-emerald-500/5 text-emerald-700",
//       },
//       {
//         label: "Payments",
//         value: paymentsCount,
//         sub: `${invoicesCount} invoices`,
//         icon: CreditCard,
//         tone: "from-amber-500/15 to-amber-500/5 text-amber-700",
//       },
//     ]
//   }, [tenant])

//   const handleSave = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!formData.name.trim() || !formData.email.trim()) {
//       toast.error("Company name and email are required")
//       return
//     }
//     const id = resolveTenantId(tenant as any)
//     if (!id) {
//       toast.error("Company ID missing")
//       return
//     }
//     try {
//       await updateCompany({
//         id,
//         data: {
//           name: formData.name.trim(),
//           email: formData.email.trim(),
//           phone: formData.phone.trim() || undefined,
//           address: formData.address.trim() || undefined,
//           logoUrl: formData.logoUrl.trim() || undefined,
//           billingEmail: formData.billingEmail.trim() || undefined,
//           description: formData.description.trim() || undefined,
//           city: formData.city.trim() || undefined,
//           country: formData.country.trim() || undefined,
//           website: formData.website.trim() || undefined,
//           contactPerson: formData.contactPerson.trim() || undefined,
//           registrationNumber: formData.registrationNumber.trim() || undefined,
//         },
//       }).unwrap()
//       toast.success("Company profile updated")
//       setEditing(false)
//       refetch()
//     } catch (err: any) {
//       toast.error(err?.data?.message || "Failed to update profile")
//     }
//   }

//   if (!tenantId) {
//     return (
//       <div className="flex min-h-[50vh] items-center justify-center p-8">
//         <div className="text-center">
//           <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
//           <h2 className="text-lg font-semibold">Tenant ID missing</h2>
//           <p className="text-sm text-muted-foreground">Sign in again to load company settings.</p>
//         </div>
//       </div>
//     )
//   }

//   if (isLoading) return <SettingsLoading />

//   if (isError || !tenant) {
//     return (
//       <div className="flex min-h-[50vh] items-center justify-center p-8">
//         <div className="text-center">
//           <Activity className="mx-auto mb-3 h-10 w-10 text-destructive" />
//           <h2 className="text-lg font-semibold">Could not load settings</h2>
//           <p className="mb-4 text-sm text-muted-foreground">
//             {(error as any)?.data?.message || (error as any)?.message || "Company data unavailable"}
//           </p>
//           <Button onClick={() => refetch()}>Retry</Button>
//         </div>
//       </div>
//     )
//   }

//   const company = tenant as any

//   return (
//     <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-8">
//       {/* Hero */}
//       <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white shadow-lg">
//         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.25),transparent_45%)]" />
//         <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
//           <div className="flex items-start gap-4">
//             <Avatar className="h-20 w-20 border-4 border-white/20 shadow-xl">
//               <AvatarImage src={company.logoUrl || undefined} alt={company.name} />
//               <AvatarFallback className="bg-emerald-500 text-xl font-bold text-white">
//                 {getInitials(company.name || "GY")}
//               </AvatarFallback>
//             </Avatar>
//             <div>
//               <div className="mb-2 flex flex-wrap items-center gap-2">
//                 <h1 className="text-3xl font-semibold tracking-tight">{company.name}</h1>
//                 <Badge className={company.isActive ? "bg-emerald-500 hover:bg-emerald-500" : "bg-slate-500"}>
//                   {company.isActive ? "Active" : "Inactive"}
//                 </Badge>
//               </div>
//               <div className="grid gap-1.5 text-sm text-white/80 sm:grid-cols-2">
//                 <p className="flex items-center gap-2">
//                   <Mail className="h-4 w-4" /> {company.email || "—"}
//                 </p>
//                 <p className="flex items-center gap-2">
//                   <Phone className="h-4 w-4" /> {company.phone || "No phone"}
//                 </p>
//                 <p className="flex items-center gap-2">
//                   <MapPin className="h-4 w-4" /> {company.address || "No address"}
//                 </p>
//                 <p className="flex items-center gap-2">
//                   <Calendar className="h-4 w-4" /> Since{" "}
//                   {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : "—"}
//                 </p>
//               </div>
//             </div>
//           </div>
//           <Button
//             variant="secondary"
//             className="gap-2 self-start"
//             onClick={() => setEditing((v) => !v)}
//           >
//             <Edit3 className="h-4 w-4" />
//             {editing ? "Close editor" : "Edit profile"}
//           </Button>
//         </div>
//       </section>

//       {/* Stats */}
//       <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//         {stats?.map((item) => (
//           <Card key={item.label} className="overflow-hidden border-0 shadow-sm ring-1 ring-border/60">
//             <CardContent className={`bg-gradient-to-br p-5 ${item.tone}`}>
//               <div className="mb-3 flex items-center justify-between">
//                 <p className="text-sm font-medium opacity-80">{item.label}</p>
//                 <item.icon className="h-5 w-5 opacity-70" />
//               </div>
//               <p className="text-3xl font-semibold tracking-tight">{item.value}</p>
//               <p className="mt-1 text-xs opacity-70">{item.sub}</p>
//             </CardContent>
//           </Card>
//         ))}
//       </section>

//       <Tabs defaultValue="profile" className="space-y-6">
//         <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
//           <TabsTrigger value="profile">Company Profile</TabsTrigger>
//           <TabsTrigger value="overview">Overview</TabsTrigger>
//           <TabsTrigger value="notifications">Notifications</TabsTrigger>
//         </TabsList>

//         <TabsContent value="profile">
//           <Card className="border-0 shadow-sm ring-1 ring-border/60">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <SettingsIcon className="h-5 w-5" />
//                 Gym company details
//               </CardTitle>
//               <CardDescription>
//                 Keep contact information up to date so invoices, messages, and reports stay accurate.
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <form onSubmit={handleSave} className="space-y-5">
//                 <div className="grid gap-4 sm:grid-cols-2">
//                   <div className="space-y-2">
//                     <Label htmlFor="name">Company name</Label>
//                     <Input
//                       id="name"
//                       value={formData.name}
//                       disabled={!editing}
//                       required
//                       onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="email">Email</Label>
//                     <Input
//                       id="email"
//                       type="email"
//                       value={formData.email}
//                       disabled={!editing}
//                       required
//                       onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="phone">Phone</Label>
//                     <Input
//                       id="phone"
//                       value={formData.phone}
//                       disabled={!editing}
//                       onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="address">Address</Label>
//                     <Input
//                       id="address"
//                       value={formData.address}
//                       disabled={!editing}
//                       onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="logoUrl">Logo URL</Label>
//                     <Input id="logoUrl" type="url" value={formData.logoUrl} disabled={!editing} onChange={(e) => setFormData((p) => ({ ...p, logoUrl: e.target.value }))} />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="billingEmail">Billing email</Label>
//                     <Input id="billingEmail" type="email" value={formData.billingEmail} disabled={!editing} onChange={(e) => setFormData((p) => ({ ...p, billingEmail: e.target.value }))} />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="contactPerson">Contact person</Label>
//                     <Input id="contactPerson" value={formData.contactPerson} disabled={!editing} onChange={(e) => setFormData((p) => ({ ...p, contactPerson: e.target.value }))} />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="registrationNumber">Registration number</Label>
//                     <Input id="registrationNumber" value={formData.registrationNumber} disabled={!editing} onChange={(e) => setFormData((p) => ({ ...p, registrationNumber: e.target.value }))} />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="city">City</Label>
//                     <Input id="city" value={formData.city} disabled={!editing} onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))} />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="country">Country</Label>
//                     <Input id="country" value={formData.country} disabled={!editing} onChange={(e) => setFormData((p) => ({ ...p, country: e.target.value }))} />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="website">Website</Label>
//                     <Input id="website" type="url" value={formData.website} disabled={!editing} onChange={(e) => setFormData((p) => ({ ...p, website: e.target.value }))} />
//                   </div>
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="description">Description</Label>
//                   <textarea
//                     id="description"
//                     value={formData.description}
//                     disabled={!editing}
//                     onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
//                     className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors focus-visible:border-emerald-500 focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
//                   />
//                 </div>

//                 {editing && (
//                   <div className="flex justify-end gap-2 pt-2">
//                     <Button type="button" variant="outline" onClick={() => setEditing(false)}>
//                       Cancel
//                     </Button>
//                     <Button type="submit" disabled={isUpdating} className="gap-2">
//                       <Save className="h-4 w-4" />
//                       {isUpdating ? "Saving..." : "Save changes"}
//                     </Button>
//                   </div>
//                 )}
//               </form>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="overview">
//           <div className="grid gap-4 lg:grid-cols-2">
//             <Card className="border-0 shadow-sm ring-1 ring-border/60">
//               <CardHeader>
//                 <CardTitle>Operations snapshot</CardTitle>
//                 <CardDescription>Quick counts from this gym</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-3 text-sm">
//                 <div className="flex justify-between">
//                   <span className="text-muted-foreground">Classes</span>
//                   <span className="font-medium">{(company as any).classesCount ?? company.classes?.length ?? 0}</span>
//                 </div>
//                 <Separator />
//                 <div className="flex justify-between">
//                   <span className="text-muted-foreground">Messages</span>
//                   <span className="font-medium">{(company as any).messagesCount ?? company.messages?.length ?? 0}</span>
//                 </div>
//                 <Separator />
//                 <div className="flex justify-between">
//                   <span className="text-muted-foreground">Reminders</span>
//                   <span className="font-medium">{(company as any).remindersCount ?? company.reminders?.length ?? 0}</span>
//                 </div>
//                 <Separator />
//                 <div className="flex justify-between">
//                   <span className="text-muted-foreground">Attendance records</span>
//                   <span className="font-medium">{(company as any).attendancesCount ?? company.attendances?.length ?? 0}</span>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="border-0 shadow-sm ring-1 ring-border/60">
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <MessageSquare className="h-5 w-5" />
//                   Communication
//                 </CardTitle>
//                 <CardDescription>Channels used for member outreach</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-3 text-sm text-muted-foreground">
//                 <p>Use Messages and Reminders from Gym Management to contact members about payments, renewals, and class updates.</p>
//                 <p>Company email/phone above appear on invoices and member communications where configured.</p>
//               </CardContent>
//             </Card>
//           </div>
//         </TabsContent>

//         <TabsContent value="notifications">
//           <Card className="border-0 shadow-sm ring-1 ring-border/60">
//             <CardHeader>
//               <CardTitle>Notification preferences</CardTitle>
//               <CardDescription>Choose what this gym should highlight for staff</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               {[
//                 ["Payment alerts", "Notify when payments are received or overdue", true],
//                 ["Member activity", "New members and check-ins", true],
//                 ["Security alerts", "Login and permission changes", true],
//                 ["Marketing emails", "Product tips and feature updates", false],
//               ].map(([title, desc, checked]) => (
//                 <div key={title as string} className="flex items-center justify-between gap-4 rounded-xl border p-4">
//                   <div>
//                     <p className="font-medium">{title as string}</p>
//                     <p className="text-sm text-muted-foreground">{desc as string}</p>
//                   </div>
//                   <Switch defaultChecked={checked as boolean} />
//                 </div>
//               ))}
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>
//     </div>
//   )
// }
