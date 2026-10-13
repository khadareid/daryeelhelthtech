// "use client"

// import { useParams } from "react-router-dom"
// import { Badge } from "@/components/ui/badge"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Separator } from "@/components/ui/separator"
// import { useGetOneUserQuery } from "@/service/users/UsersApi"
// import DetailShell, { formatDateTime } from "../shared/DetailShell"

// export default function UserDetail() {
//   const { id } = useParams<{ id: string }>()
//   const userId = Number(id || 0)
//   const { data: user, isLoading, error, refetch } = useGetOneUserQuery(userId, {
//     skip: !userId,
//   })
//   const uid = (user as any)?.userid ?? user?.userId

//   return (
//     <DetailShell
//       title="User details"
//       subtitle={user ? `#${uid} · ${user.name}` : undefined}
//       backTo="/dashboard/users"
//       loading={isLoading}
//       error={error || !user ? "User not found" : null}
//       onRetry={refetch}
//     >
//       {user && (
//         <>
//           <div className="grid gap-4 md:grid-cols-3">
//             <Card className="border-emerald-500/15 md:col-span-2">
//               <CardHeader>
//                 <CardTitle className="text-base">Profile</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-3 text-sm">
//                 <Row label="Name" value={user.name} />
//                 <Separator />
//                 <Row label="Email" value={user.email || "—"} />
//                 <Separator />
//                 <Row label="Role" value={String(user.role || "—")} />
//                 <Separator />
//                 <Row label="Last login" value={formatDateTime(user.lastLogin)} />
//               </CardContent>
//             </Card>
//             <Card className="border-emerald-500/15 bg-[#0b1210] text-white">
//               <CardHeader>
//                 <CardTitle className="text-base text-emerald-400">Status</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <Badge className={user.isActive ? "bg-emerald-500" : "bg-zinc-500"}>
//                   {user.isActive ? "Active" : "Inactive"}
//                 </Badge>
//               </CardContent>
//             </Card>
//           </div>
//           <Card className="border-emerald-500/15">
//             <CardHeader>
//               <CardTitle className="text-base">Timestamps</CardTitle>
//             </CardHeader>
//             <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
//               <Row label="Created" value={formatDateTime(user.createdAt)} />
//               <Row label="Updated" value={formatDateTime(user.updatedAt)} />
//             </CardContent>
//           </Card>
//         </>
//       )}
//     </DetailShell>
//   )
// }

// function Row({ label, value }: { label: string; value: React.ReactNode }) {
//   return (
//     <div className="flex justify-between gap-4">
//       <span className="text-muted-foreground">{label}</span>
//       <span className="text-right font-medium text-[#0b1210]">{value}</span>
//     </div>
//   )
// }
