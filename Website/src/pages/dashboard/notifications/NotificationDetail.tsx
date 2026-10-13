// "use client"

// import { useMemo } from "react"
// import { useParams } from "react-router-dom"
// import { Badge } from "@/components/ui/badge"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Separator } from "@/components/ui/separator"
// import { useGetNotificationHistoryQuery } from "@/service/notifications/NotificationsApi"
// import DetailShell, { formatDateTime } from "../shared/DetailShell"

// export default function NotificationDetail() {
//   const { id } = useParams<{ id: string }>()
//   const notificationId = Number(id || 0)
//   const { data, isLoading, error, refetch } = useGetNotificationHistoryQuery({
//     limit: 200,
//   })

//   const notification = useMemo(() => {
//     const rows = data?.data ?? []
//     return rows.find(
//       (n) => n.Notificationid === notificationId || (n as any).notificationId === notificationId
//     )
//   }, [data, notificationId])

//   return (
//     <DetailShell
//       title="Notification details"
//       subtitle={notification ? `#${notification.Notificationid}` : undefined}
//       backTo="/dashboard/notifications"
//       loading={isLoading}
//       error={error || (!isLoading && !notification) ? "Notification not found" : null}
//       onRetry={refetch}
//     >
//       {notification && (
//         <>
//           <div className="grid gap-4 md:grid-cols-3">
//             <Card className="border-emerald-500/15 md:col-span-2">
//               <CardHeader>
//                 <CardTitle className="text-base">Overview</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-3 text-sm">
//                 <Row label="Title" value={notification.title} />
//                 <Separator />
//                 <Row label="Type" value={String(notification.type || "—")} />
//                 <Separator />
//                 <Row label="User ID" value={notification.userId} />
//                 <Separator />
//                 <Row label="Created" value={formatDateTime(notification.createdAt)} />
//               </CardContent>
//             </Card>
//             <Card className="border-emerald-500/15 bg-[#0b1210] text-white">
//               <CardHeader>
//                 <CardTitle className="text-base text-emerald-400">Read status</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <Badge className={notification.isRead ? "bg-zinc-500" : "bg-emerald-500"}>
//                   {notification.isRead ? "Read" : "Unread"}
//                 </Badge>
//               </CardContent>
//             </Card>
//           </div>
//           <Card className="border-emerald-500/15">
//             <CardHeader>
//               <CardTitle className="text-base">Message</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3 text-sm whitespace-pre-wrap">
//                 {notification.message || "—"}
//               </p>
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
