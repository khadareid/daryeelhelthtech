// import {
//   Eye,
//   FileText,
//   Filter,
//   Search,
//   Shield,
// } from "lucide-react";
// import { useMemo, useState } from "react";
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
// import { Label } from "@/components/ui/label";
// import { Skeleton } from "@/components/ui/skeleton";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   useGetAllAuditLogsQuery,
//   type AuditLog,
// } from "@/service/auditLogs/AuditLogsApi";

// const getAuditId = (log: AuditLog) => log.AuditLogid;

// const actionBadge = (action: string) => {
//   const upper = action.toUpperCase();
//   if (upper.includes("CREATE")) return "bg-green-100 text-green-800";
//   if (upper.includes("UPDATE")) return "bg-blue-100 text-blue-800";
//   if (upper.includes("DELETE")) return "bg-red-100 text-red-800";
//   return "bg-gray-100 text-gray-800";
// };

// export default function AuditLogs() {
//   const [page, setPage] = useState(1);
//   const [actionFilter, setActionFilter] = useState("");
//   const [entityTypeFilter, setEntityTypeFilter] = useState("");
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

//   const { data: logsResponse, isLoading, error } = useGetAllAuditLogsQuery({
//     page,
//     limit: 20,
//     ...(actionFilter && { action: actionFilter }),
//     ...(entityTypeFilter && { entityType: entityTypeFilter }),
//     ...(fromDate && { fromDate }),
//     ...(toDate && { toDate }),
//   });

//   const logs = logsResponse?.data ?? [];
//   const pagination = logsResponse?.pagination;

//   const entityTypes = useMemo(() => {
//     const types = new Set(logs.map((l) => l.entityType));
//     return Array.from(types).sort();
//   }, [logs]);

//   const actions = useMemo(() => {
//     const acts = new Set(logs.map((l) => l.action));
//     return Array.from(acts).sort();
//   }, [logs]);

//   const stats = useMemo(() => {
//     const creates = logs.filter((l) => l.action.toUpperCase().includes("CREATE")).length;
//     const updates = logs.filter((l) => l.action.toUpperCase().includes("UPDATE")).length;
//     const deletes = logs.filter((l) => l.action.toUpperCase().includes("DELETE")).length;
//     return {
//       total: pagination?.total ?? logs.length,
//       creates,
//       updates,
//       deletes,
//     };
//   }, [logs, pagination]);

//   const clearFilters = () => {
//     setActionFilter("");
//     setEntityTypeFilter("");
//     setFromDate("");
//     setToDate("");
//     setPage(1);
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
//           <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
//           <h3 className="text-lg font-semibold">Error Loading Audit Logs</h3>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="px-10">
//         <h2 className="text-2xl font-bold">Audit Logs</h2>
//         <p className="text-muted-foreground mt-1">
//           Track system activity and changes ({stats.total} total records)
//         </p>
//       </div>

//       <div className="grid gap-4 md:grid-cols-4 px-1">
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium">Total Events</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.total}</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium">Creates</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-green-600">{stats.creates}</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium">Updates</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-blue-600">{stats.updates}</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium">Deletes</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-red-600">{stats.deletes}</div>
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
//         <CardContent className="space-y-4">
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//             <div className="space-y-2">
//               <Label>Action</Label>
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   placeholder="e.g. CREATE"
//                   value={actionFilter}
//                   onChange={(e) => {
//                     setActionFilter(e.target.value);
//                     setPage(1);
//                   }}
//                   className="pl-10"
//                   list="action-suggestions"
//                 />
//                 <datalist id="action-suggestions">
//                   {actions.map((a) => (
//                     <option key={a} value={a} />
//                   ))}
//                 </datalist>
//               </div>
//             </div>
//             <div className="space-y-2">
//               <Label>Entity Type</Label>
//               <Input
//                 placeholder="e.g. Member"
//                 value={entityTypeFilter}
//                 onChange={(e) => {
//                   setEntityTypeFilter(e.target.value);
//                   setPage(1);
//                 }}
//                 list="entity-suggestions"
//               />
//               <datalist id="entity-suggestions">
//                 {entityTypes.map((t) => (
//                   <option key={t} value={t} />
//                 ))}
//               </datalist>
//             </div>
//             <div className="space-y-2">
//               <Label>From Date</Label>
//               <Input
//                 type="date"
//                 value={fromDate}
//                 onChange={(e) => {
//                   setFromDate(e.target.value);
//                   setPage(1);
//                 }}
//               />
//             </div>
//             <div className="space-y-2">
//               <Label>To Date</Label>
//               <Input
//                 type="date"
//                 value={toDate}
//                 onChange={(e) => {
//                   setToDate(e.target.value);
//                   setPage(1);
//                 }}
//               />
//             </div>
//           </div>
//           <Button variant="outline" onClick={clearFilters} className="bg-transparent">
//             Clear Filters
//           </Button>
//         </CardContent>
//       </Card>

//       <Card className="mx-1">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Timestamp</TableHead>
//               <TableHead>Action</TableHead>
//               <TableHead>Entity</TableHead>
//               <TableHead>User</TableHead>
//               <TableHead>IP Address</TableHead>
//               <TableHead className="text-right">Details</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {logs.length > 0 ? (
//               logs.map((log) => (
//                 <TableRow key={getAuditId(log)}>
//                   <TableCell className="text-sm">
//                     {new Date(log.createdAt).toLocaleString()}
//                   </TableCell>
//                   <TableCell>
//                     <Badge className={actionBadge(log.action)}>{log.action}</Badge>
//                   </TableCell>
//                   <TableCell>
//                     <div className="font-medium">{log.entityType}</div>
//                     {log.entityId && (
//                       <div className="text-xs text-muted-foreground">ID: {log.entityId}</div>
//                     )}
//                   </TableCell>
//                   <TableCell>{log.user?.name ?? "System"}</TableCell>
//                   <TableCell className="text-sm text-muted-foreground">
//                     {log.ipAddress ?? "—"}
//                   </TableCell>
//                   <TableCell className="text-right">
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => setSelectedLog(log)}
//                     >
//                       <Eye className="h-4 w-4" />
//                     </Button>
//                   </TableCell>
//                 </TableRow>
//               ))
//             ) : (
//               <TableRow>
//                 <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
//                   <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
//                   No audit logs found
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </Card>

//       {pagination && pagination.totalPages > 1 && (
//         <div className="flex justify-between items-center px-1">
//           <span className="text-sm text-muted-foreground">
//             Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
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

//       <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
//         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Audit Log Details</DialogTitle>
//             <DialogDescription>
//               {selectedLog && new Date(selectedLog.createdAt).toLocaleString()}
//             </DialogDescription>
//           </DialogHeader>
//           {selectedLog && (
//             <div className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label className="text-muted-foreground">Action</Label>
//                   <Badge className={actionBadge(selectedLog.action)}>
//                     {selectedLog.action}
//                   </Badge>
//                 </div>
//                 <div>
//                   <Label className="text-muted-foreground">Entity</Label>
//                   <p>
//                     {selectedLog.entityType}
//                     {selectedLog.entityId ? ` #${selectedLog.entityId}` : ""}
//                   </p>
//                 </div>
//                 <div>
//                   <Label className="text-muted-foreground">User</Label>
//                   <p>{selectedLog.user?.name ?? "System"}</p>
//                   {selectedLog.user?.email && (
//                     <p className="text-sm text-muted-foreground">
//                       {selectedLog.user.email}
//                     </p>
//                   )}
//                 </div>
//                 <div>
//                   <Label className="text-muted-foreground">IP / Agent</Label>
//                   <p className="text-sm">{selectedLog.ipAddress ?? "—"}</p>
//                   <p className="text-xs text-muted-foreground truncate">
//                     {selectedLog.userAgent ?? "—"}
//                   </p>
//                 </div>
//               </div>
//               {selectedLog.oldValue != null && (
//                 <div>
//                   <Label className="text-muted-foreground">Old Value</Label>
//                   <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-40">
//                     {JSON.stringify(selectedLog.oldValue, null, 2)}
//                   </pre>
//                 </div>
//               )}
//               {selectedLog.newValue != null && (
//                 <div>
//                   <Label className="text-muted-foreground">New Value</Label>
//                   <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-40">
//                     {JSON.stringify(selectedLog.newValue, null, 2)}
//                   </pre>
//                 </div>
//               )}
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
