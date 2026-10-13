// "use client"

// import { useParams } from "react-router-dom"
// import { Badge } from "@/components/ui/badge"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Separator } from "@/components/ui/separator"
// import { useGetOneMessageQuery } from "@/service/messages/MessagesApi"
// import DetailShell, { formatDateTime } from "../shared/DetailShell"

// export default function MessageDetail() {
//   const { id } = useParams<{ id: string }>()
//   const messageId = Number(id || 0)
//   const { data: message, isLoading, error, refetch } = useGetOneMessageQuery(messageId, {
//     skip: !messageId,
//   })
//   const mid = (message as any)?.Messageid ?? message?.messageId

//   return (
//     <DetailShell
//       title="Message details"
//       subtitle={message ? `#${mid}` : undefined}
//       backTo="/dashboard/messages"
//       loading={isLoading}
//       error={error || !message ? "Message not found" : null}
//       onRetry={refetch}
//     >
//       {message && (
//         <>
//           <div className="grid gap-4 md:grid-cols-3">
//             <Card className="border-emerald-500/15 md:col-span-2">
//               <CardHeader>
//                 <CardTitle className="text-base">Recipient</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-3 text-sm">
//                 <Row
//                   label="Member"
//                   value={(message.member as any)?.fullName || `Member #${message.memberId}`}
//                 />
//                 <Separator />
//                 <Row label="Phone" value={message.phone || "—"} />
//                 <Separator />
//                 <Row label="Channel" value={String(message.via || "—")} />
//                 <Separator />
//                 <Row label="Sent at" value={formatDateTime(message.sentAt)} />
//               </CardContent>
//             </Card>
//             <Card className="border-emerald-500/15 bg-[#0b1210] text-white">
//               <CardHeader>
//                 <CardTitle className="text-base text-emerald-400">Status</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <Badge className="bg-emerald-500">{String(message.status || "—")}</Badge>
//               </CardContent>
//             </Card>
//           </div>
//           <Card className="border-emerald-500/15">
//             <CardHeader>
//               <CardTitle className="text-base">Content</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4 text-sm">
//               <p className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3 whitespace-pre-wrap">
//                 {message.content || "—"}
//               </p>
//               <Row label="Created" value={formatDateTime(message.createdAt)} />
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
