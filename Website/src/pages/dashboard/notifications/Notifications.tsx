// import {
//   Bell,
//   BellOff,
//   CheckCheck,
//   Eye,
//   Filter,
//   Info,
//   Mail,
//   Search,
//   Shield,
// } from "lucide-react";
// import { useMemo, useState } from "react";
// import { Link } from "react-router-dom";
// import { toast } from "sonner";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Skeleton } from "@/components/ui/skeleton";
// import {
//   useGetUnreadCountQuery,
//   useListNotificationsQuery,
//   useMarkAllAsReadMutation,
//   useMarkAsReadMutation,
//   type Notification,
// } from "@/service/notifications/NotificationsApi";

// const getNotificationId = (n: Notification) => n.Notificationid;

// const typeIcon = (type: string) => {
//   switch (type) {
//     case "SYSTEM":
//       return <Shield className="h-4 w-4" />;
//     case "EMAIL":
//       return <Mail className="h-4 w-4" />;
//     default:
//       return <Info className="h-4 w-4" />;
//   }
// };

// const typeBadge = (type: string) => {
//   const map: Record<string, string> = {
//     SYSTEM: "bg-blue-100 text-blue-800",
//     EMAIL: "bg-purple-100 text-purple-800",
//     REMINDER: "bg-orange-100 text-orange-800",
//     ALERT: "bg-red-100 text-red-800",
//   };
//   return map[type] ?? "bg-gray-100 text-gray-800";
// };

// export default function Notifications() {
//   const [page, setPage] = useState(1);
//   const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
//   const [typeFilter, setTypeFilter] = useState("all");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

//   const { data: unreadData } = useGetUnreadCountQuery();
//   const { data: listResponse, isLoading, error, refetch } = useListNotificationsQuery({
//     page,
//     limit: 20,
//     ...(readFilter === "unread" && { isRead: false }),
//     ...(readFilter === "read" && { isRead: true }),
//     ...(typeFilter !== "all" && { type: typeFilter as any }),
//   });
//   const [markAsRead] = useMarkAsReadMutation();
//   const [markAllAsRead, { isLoading: markingAll }] = useMarkAllAsReadMutation();

//   const notifications: Notification[] = listResponse?.data ?? [];
//   const pagination = listResponse?.pagination;
//   const unreadCount = unreadData?.unreadCount ?? 0;

//   const filtered = useMemo(() => {
//     if (!searchTerm) return notifications;
//     const term = searchTerm.toLowerCase();
//     return notifications.filter(
//       (n) =>
//         n.title?.toLowerCase().includes(term) ||
//         n.message?.toLowerCase().includes(term)
//     );
//   }, [notifications, searchTerm]);

//   const handleMarkRead = async (notification: Notification) => {
//     if (notification.isRead) {
//       setSelectedNotification(notification);
//       return;
//     }
//     try {
//       await markAsRead(getNotificationId(notification)).unwrap();
//       refetch();
//       setSelectedNotification({ ...notification, isRead: true });
//     } catch (err: any) {
//       toast.error(err?.data?.message || "Failed to mark as read");
//     }
//   };

//   const handleMarkAllRead = async () => {
//     try {
//       const res = await markAllAsRead().unwrap();
//       toast.success(res.message || "All notifications marked as read");
//       refetch();
//     } catch (err: any) {
//       toast.error(err?.data?.message || "Failed to mark all as read");
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="container mx-auto p-6 space-y-6">
//         <Skeleton className="h-8 w-48" />
//         <Skeleton className="h-96" />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <Card className="m-6">
//         <CardContent className="py-12 text-center">
//           <Bell className="h-12 w-12 mx-auto text-red-500 mb-4" />
//           <h3 className="text-lg font-semibold">Error Loading Notifications</h3>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col px-10 sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div>
//           <h2 className="text-2xl font-bold">Notification Center</h2>
//           <p className="text-muted-foreground mt-1">
//             {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
//           </p>
//         </div>
//         {unreadCount > 0 && (
//           <Button onClick={handleMarkAllRead} disabled={markingAll} variant="outline">
//             <CheckCheck className="mr-2 h-4 w-4" />
//             Mark All Read
//           </Button>
//         )}
//       </div>

//       <div className="grid gap-4 md:grid-cols-3 px-1">
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium">Unread</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium">Total (page)</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{pagination?.total ?? notifications.length}</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium">Read</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-green-600">
//               {(pagination?.total ?? 0) - unreadCount}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <Card className="mx-1">
//         <CardHeader className="pb-4">
//           <CardTitle className="text-lg flex items-center gap-2">
//             <Filter className="h-5 w-5" />
//             Filters
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="flex flex-col sm:flex-row gap-4">
//           <div className="relative flex-1">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//             <Input
//               placeholder="Search notifications..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-10"
//             />
//           </div>
//           <Select
//             value={readFilter}
//             onValueChange={(v) => {
//               setReadFilter(v as typeof readFilter);
//               setPage(1);
//             }}
//           >
//             <SelectTrigger className="w-40">
//               <SelectValue />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All</SelectItem>
//               <SelectItem value="unread">Unread</SelectItem>
//               <SelectItem value="read">Read</SelectItem>
//             </SelectContent>
//           </Select>
//           <Select
//             value={typeFilter}
//             onValueChange={(v) => {
//               setTypeFilter(v);
//               setPage(1);
//             }}
//           >
//             <SelectTrigger className="w-40">
//               <SelectValue />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All Types</SelectItem>
//               <SelectItem value="SYSTEM">System</SelectItem>
//               <SelectItem value="EMAIL">Email</SelectItem>
//               <SelectItem value="REMINDER">Reminder</SelectItem>
//               <SelectItem value="ALERT">Alert</SelectItem>
//             </SelectContent>
//           </Select>
//         </CardContent>
//       </Card>

//       <div className="space-y-2 px-1">
//         {filtered.length > 0 ? (
//           filtered.map((notification) => (
//             <Card
//               key={getNotificationId(notification)}
//               className={`cursor-pointer transition-colors hover:bg-muted/50 ${
//                 !notification.isRead ? "border-l-4 border-l-blue-500" : ""
//               }`}
//               onClick={() => handleMarkRead(notification)}
//             >
//               <CardContent className="flex items-start gap-4 p-4">
//                 <div
//                   className={`p-2 rounded-full ${
//                     notification.isRead ? "bg-muted" : "bg-blue-100"
//                   }`}
//                 >
//                   {notification.isRead ? (
//                     <BellOff className="h-4 w-4 text-muted-foreground" />
//                   ) : (
//                     <Bell className="h-4 w-4 text-blue-600" />
//                   )}
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-2 mb-1">
//                     <h3
//                       className={`font-medium truncate ${
//                         !notification.isRead ? "text-foreground" : "text-muted-foreground"
//                       }`}
//                     >
//                       {notification.title}
//                     </h3>
//                     <Badge className={typeBadge(notification.type)} variant="outline">
//                       {typeIcon(notification.type)}
//                       <span className="ml-1">{notification.type}</span>
//                     </Badge>
//                   </div>
//                   <p className="text-sm text-muted-foreground line-clamp-2">
//                     {notification.message}
//                   </p>
//                   <p className="text-xs text-muted-foreground mt-1">
//                     {new Date(notification.createdAt).toLocaleString()}
//                   </p>
//                 </div>
//                 {!notification.isRead && (
//                   <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
//                 )}
//                 <Button
//                   variant="ghost"
//                   size="icon"
//                   className="flex-shrink-0"
//                   asChild
//                   onClick={(e) => e.stopPropagation()}
//                 >
//                   <Link to={`/dashboard/notifications/${getNotificationId(notification)}`}>
//                     <Eye className="h-4 w-4" />
//                   </Link>
//                 </Button>
//               </CardContent>
//             </Card>
//           ))
//         ) : (
//           <Card>
//             <CardContent className="py-12 text-center">
//               <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
//               <h3 className="text-lg font-semibold">No notifications</h3>
//               <p className="text-muted-foreground">You're all caught up!</p>
//             </CardContent>
//           </Card>
//         )}
//       </div>

//       {pagination && pagination.totalPages > 1 && (
//         <div className="flex justify-between items-center">
//           <span className="text-sm text-muted-foreground">
//             Page {pagination.page} of {pagination.totalPages}
//           </span>
//           <div className="space-x-2">
//             <Button
//               variant="outline"
//               size="sm"
//               disabled={page === 1}
//               onClick={() => setPage((p) => p - 1)}
//             >
//               Previous
//             </Button>
//             <Button
//               variant="outline"
//               size="sm"
//               disabled={page >= pagination.totalPages}
//               onClick={() => setPage((p) => p + 1)}
//             >
//               Next
//             </Button>
//           </div>
//         </div>
//       )}

//       <Dialog
//         open={!!selectedNotification}
//         onOpenChange={() => setSelectedNotification(null)}
//       >
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>{selectedNotification?.title}</DialogTitle>
//             <DialogDescription>
//               {selectedNotification &&
//                 new Date(selectedNotification.createdAt).toLocaleString()}
//             </DialogDescription>
//           </DialogHeader>
//           {selectedNotification && (
//             <div className="space-y-4">
//               <Badge className={typeBadge(selectedNotification.type)}>
//                 {selectedNotification.type}
//               </Badge>
//               <p className="text-sm leading-relaxed">{selectedNotification.message}</p>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
