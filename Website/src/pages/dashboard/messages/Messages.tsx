// import {
//   Calendar,
//   Download,
//   Edit,
//   Eye,
//   Filter,
//   Loader2,
//   MessageSquare,
//   MoreHorizontal,
//   Phone,
//   Search,
//   Trash2,
//   User,
// } from "lucide-react";
// import { useMemo, useState } from "react";
// import { Link } from "react-router-dom";
// import { Badge } from "../../../components/ui/badge";
// import { Button } from "../../../components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "../../../components/ui/card";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "../../../components/ui/dialog";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "../../../components/ui/dropdown-menu";
// import { Input } from "../../../components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../../../components/ui/select";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "../../../components/ui/table";

// import { useGetMessagesQuery } from "../../../service/messages/MessagesApi";
// import type { Message } from "../../../service/types/Types";
// import { CreateMessage } from "./CreateMessage";

// interface MessagesProps {
//   title?: string;
//   description?: string;
// }

// export default function Messages({
//   title = "All Messages",
//   description = "Manage your messages here.",
// }: MessagesProps) {
//   const { data, isLoading, error } = useGetMessagesQuery();
//   const [searchTerm, setSearchTerm] = useState("");
//   const [viaFilter, setViaFilter] = useState<string>("all");
//   const [statusFilter, setStatusFilter] = useState<string>("all");
//   const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
//   const [showMessageDetails, setShowMessageDetails] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;

//   // Safely handle the data - provide empty array if data is undefined
//   const messages: Message[] = data || [];

//   // Filter and search logic
//   const filteredMessages = useMemo(() => {
//     if (!messages.length) return [];

//     return messages.filter((message) => {
//       const matchesSearch =
//         message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         message.phone?.includes(searchTerm) ||
//         message.memberId?.toString().includes(searchTerm);

//       const matchesVia = viaFilter === "all" || message.via === viaFilter;

//       const matchesStatus =
//         statusFilter === "all" ||
//         (statusFilter === "active" && message.isActive && !message.isDeleted) ||
//         (statusFilter === "inactive" && !message.isActive) ||
//         (statusFilter === "deleted" && message.isDeleted);

//       return matchesSearch && matchesVia && matchesStatus;
//     });
//   }, [messages, searchTerm, viaFilter, statusFilter]);

//   // Pagination logic
//   const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const paginatedMessages = filteredMessages.slice(
//     startIndex,
//     startIndex + itemsPerPage
//   );

//   const getStatusBadge = (message: Message) => {
//     if (message.isDeleted) {
//       return "bg-red-100 text-red-800 hover:bg-red-200";
//     }
//     if (message.isActive) {
//       return "bg-green-100 text-green-800 hover:bg-green-200";
//     }
//     return "bg-gray-100 text-gray-800 hover:bg-gray-200";
//   };

//   const getViaBadge = (via: string) => {
//     const variants = {
//       SMS: "bg-blue-100 text-blue-800",
//       EMAIL: "bg-purple-100 text-purple-800",
//       WHATSAPP: "bg-green-100 text-green-800",
//       PUSH: "bg-orange-100 text-orange-800",
//     };
//     return variants[via as keyof typeof variants] || variants.SMS;
//   };

//   const getStatusText = (message: Message) => {
//     if (message.isDeleted) return "DELETED";
//     if (message.isActive) return "ACTIVE";
//     return "INACTIVE";
//   };

//   const handleViewMessage = (message: Message) => {
//     setSelectedMessage(message);
//     setShowMessageDetails(true);
//   };

//   const clearFilters = () => {
//     setSearchTerm("");
//     setViaFilter("all");
//     setStatusFilter("all");
//     setCurrentPage(1);
//   };

//   // Loading state
//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <div className="flex items-center space-x-2">
//           <Loader2 className="h-6 w-6 animate-spin" />
//           <span>Loading messages...</span>
//         </div>
//       </div>
//     );
//   }

//   // Error state
//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <Card className="w-full max-w-md">
//           <CardContent className="flex flex-col items-center justify-center py-12">
//             <div className="text-red-500 mb-4">
//               <MessageSquare className="h-12 w-12" />
//             </div>
//             <h3 className="text-lg font-semibold mb-2">
//               Error Loading Messages
//             </h3>
//             <p className="text-muted-foreground text-center">
//               Failed to load message data. Please try again later.
//             </p>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6 px-2">
//       {/* Header */}
//       <div>
//         <div className="mb-6">
//           <div className="flex flex-col px-10 sm:flex-row sm:items-center sm:justify-between gap-4">
//             <div>
//               <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
//                 {title}
//               </h2>
//               <p className="text-gray-600 dark:text-gray-400 mt-1">
//                 {description} ({messages.length} total)
//               </p>
//             </div>
//             <div className="flex items-center space-x-3">
//               <Button
//                 variant="outline"
//                 className="flex items-center space-x-2 bg-transparent"
//                 disabled={isLoading}
//               >
//                 <Download size={16} />
//                 <span>{isLoading ? "Exporting..." : "Export"}</span>
//               </Button>
//               <CreateMessage />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Filters */}
//       <Card>
//         <CardHeader className="pb-4">
//           <CardTitle className="text-lg flex items-center gap-2">
//             <Filter className="h-5 w-5" />
//             Filters & Search
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {/* Search */}
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//             <Input
//               placeholder="Search by content, phone, or member ID..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-10"
//             />
//           </div>

//           {/* Filter Controls */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//             <div className="space-y-2">
//               <label className="text-sm font-medium">Via</label>
//               <Select value={viaFilter} onValueChange={setViaFilter}>
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Channels</SelectItem>
//                   <SelectItem value="SMS">SMS</SelectItem>
//                   <SelectItem value="EMAIL">Email</SelectItem>
//                   <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="space-y-2">
//               <label className="text-sm font-medium">Status</label>
//               <Select value={statusFilter} onValueChange={setStatusFilter}>
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Status</SelectItem>
//                   <SelectItem value="active">Active</SelectItem>
//                   <SelectItem value="inactive">Inactive</SelectItem>
//                   <SelectItem value="deleted">Deleted</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="flex items-end">
//               <Button
//                 variant="outline"
//                 onClick={clearFilters}
//                 className="w-full bg-transparent"
//               >
//                 Clear Filters
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Desktop Table */}
//       <Card className="hidden lg:block px-2">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Messages</TableHead>
//               <TableHead>Members</TableHead>
//               <TableHead>Phones</TableHead>
//               <TableHead>Via</TableHead>
//               <TableHead>Status</TableHead>
//               <TableHead>Sent At</TableHead>
//               <TableHead>Created</TableHead>
//               <TableHead className="text-right">Actions</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {paginatedMessages.map((message) => (
//               <TableRow key={message.messageId}>
//                 <TableCell>
//                   <div className="max-w-[300px]">
//                     <div className="font-medium truncate">
//                       {message.content}
//                     </div>
//                     <div className="text-sm text-muted-foreground">
//                       ID: {message.messageId}
//                     </div>
//                   </div>
//                 </TableCell>
//                 <TableCell>
//                   <div className="flex items-center gap-2">
//                     <User className="h-4 w-4 text-muted-foreground" />
//                     <span>{message.member.fullName}</span>
//                   </div>
//                 </TableCell>
//                 <TableCell>
//                   <div className="flex items-center gap-2">
//                     <Phone className="h-4 w-4 text-muted-foreground" />
//                     <span className="font-mono text-sm">{message.phone}</span>
//                   </div>
//                 </TableCell>
//                 <TableCell>
//                   <Badge className={getViaBadge(message.via)}>
//                     {message.via}
//                   </Badge>
//                 </TableCell>
//                 <TableCell>
//                   <Badge className={getStatusBadge(message)}>
//                     {getStatusText(message)}
//                   </Badge>
//                 </TableCell>
//                 <TableCell>
//                   <div className="text-sm">
//                     {new Date(message.sentAt).toLocaleDateString()}
//                   </div>
//                   <div className="text-xs text-muted-foreground">
//                     {new Date(message.sentAt).toLocaleTimeString()}
//                   </div>
//                 </TableCell>
//                 <TableCell>
//                   {new Date(message.createdAt).toLocaleDateString()}
//                 </TableCell>
//                 <TableCell className="text-right">
//                   <DropdownMenu>
//                     <DropdownMenuTrigger asChild>
//                       <Button variant="ghost" className="h-8 w-8 p-0">
//                         <MoreHorizontal className="h-4 w-4" />
//                       </Button>
//                     </DropdownMenuTrigger>
//                     <DropdownMenuContent align="end">
//                       <DropdownMenuLabel>Actions</DropdownMenuLabel>
//                       <DropdownMenuItem asChild>
//                         <Link to={`/dashboard/messages/${message.messageId}`}>
//                           <Eye className="mr-2 h-4 w-4" />
//                           View Details
//                         </Link>
//                       </DropdownMenuItem>
//                       <DropdownMenuItem>
//                         <Edit className="mr-2 h-4 w-4" />
//                         Edit Message
//                       </DropdownMenuItem>
//                       <DropdownMenuSeparator />
//                       <DropdownMenuItem className="text-red-600">
//                         <Trash2 className="mr-2 h-4 w-4" />
//                         Delete Message
//                       </DropdownMenuItem>
//                     </DropdownMenuContent>
//                   </DropdownMenu>
//                 </TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </Card>

//       {/* Mobile Cards */}
//       <div className="lg:hidden space-y-4">
//         {paginatedMessages.map((message) => (
//           <Card key={message.messageId}>
//             <CardContent className="p-4">
//               <div className="flex justify-between items-start mb-3">
//                 <div className="flex-1">
//                   <div className="flex gap-2 mb-2">
//                     <Badge className={getStatusBadge(message)}>
//                       {getStatusText(message)}
//                     </Badge>
//                     <Badge className={getViaBadge(message.via)}>
//                       {message.via}
//                     </Badge>
//                   </div>
//                   <p className="text-sm font-medium line-clamp-2 mb-2">
//                     {message.content}
//                   </p>
//                 </div>
//                 <DropdownMenu>
//                   <DropdownMenuTrigger asChild>
//                     <Button variant="ghost" size="sm">
//                       <MoreHorizontal className="h-4 w-4" />
//                     </Button>
//                   </DropdownMenuTrigger>
//                   <DropdownMenuContent align="end">
//                     <DropdownMenuItem asChild>
//                       <Link to={`/dashboard/messages/${message.messageId}`}>
//                         <Eye className="mr-2 h-4 w-4" />
//                         View Details
//                       </Link>
//                     </DropdownMenuItem>
//                     <DropdownMenuItem>
//                       <Edit className="mr-2 h-4 w-4" />
//                       Edit
//                     </DropdownMenuItem>
//                     <DropdownMenuItem className="text-red-600">
//                       <Trash2 className="mr-2 h-4 w-4" />
//                       Delete
//                     </DropdownMenuItem>
//                   </DropdownMenuContent>
//                 </DropdownMenu>
//               </div>

//               <div className="space-y-2 text-sm">
//                 <div className="flex items-center gap-2">
//                   <User className="h-4 w-4 text-muted-foreground" />
//                   <span>Member ID: {message.memberId}</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Phone className="h-4 w-4 text-muted-foreground" />
//                   <span className="font-mono">{message.phone}</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Calendar className="h-4 w-4 text-muted-foreground" />
//                   <span>
//                     Sent: {new Date(message.sentAt).toLocaleDateString()} at{" "}
//                     {new Date(message.sentAt).toLocaleTimeString()}
//                   </span>
//                 </div>
//               </div>

//               <div className="flex justify-between items-center mt-3 pt-3 border-t">
//                 <div className="text-xs text-muted-foreground">
//                   ID: {message.messageId}
//                 </div>
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   onClick={() => handleViewMessage(message)}
//                 >
//                   View Details
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       {/* Pagination */}
//       {totalPages > 1 && (
//         <div className="flex items-center justify-between">
//           <div className="text-sm text-muted-foreground">
//             Showing {startIndex + 1} to{" "}
//             {Math.min(startIndex + itemsPerPage, filteredMessages.length)} of{" "}
//             {filteredMessages.length} messages
//           </div>
//           <div className="flex items-center space-x-2">
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
//               disabled={currentPage === 1}
//             >
//               Previous
//             </Button>
//             <div className="flex items-center space-x-1">
//               {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//                 const pageNum = i + 1;
//                 return (
//                   <Button
//                     key={pageNum}
//                     variant={currentPage === pageNum ? "default" : "outline"}
//                     size="sm"
//                     onClick={() => setCurrentPage(pageNum)}
//                   >
//                     {pageNum}
//                   </Button>
//                 );
//               })}
//             </div>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() =>
//                 setCurrentPage(Math.min(totalPages, currentPage + 1))
//               }
//               disabled={currentPage === totalPages}
//             >
//               Next
//             </Button>
//           </div>
//         </div>
//       )}

//       {/* Empty State */}
//       {filteredMessages.length === 0 && !isLoading && (
//         <Card>
//           <CardContent className="flex flex-col items-center justify-center py-12">
//             <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
//             <h3 className="text-lg font-semibold mb-2">No messages found</h3>
//             <p className="text-muted-foreground text-center mb-4">
//               {searchTerm || viaFilter !== "all" || statusFilter !== "all"
//                 ? "Try adjusting your search or filters"
//                 : "Get started by sending your first message"}
//             </p>
//             {(searchTerm || viaFilter !== "all" || statusFilter !== "all") && (
//               <Button variant="outline" onClick={clearFilters}>
//                 Clear Filters
//               </Button>
//             )}
//           </CardContent>
//         </Card>
//       )}

//       {/* Message Details Modal */}
//       <Dialog open={showMessageDetails} onOpenChange={setShowMessageDetails}>
//         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Message Details</DialogTitle>
//             <DialogDescription>
//               Complete information for message ID {selectedMessage?.messageId}
//             </DialogDescription>
//           </DialogHeader>
//           {selectedMessage && (
//             <div className="space-y-6">
//               {/* Message Information */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-semibold border-b pb-2">
//                   Message Information
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="text-sm font-medium text-muted-foreground">
//                       Message ID
//                     </label>
//                     <p className="text-sm">{selectedMessage.messageId}</p>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-muted-foreground">
//                       Member ID
//                     </label>
//                     <p className="text-sm">{selectedMessage.memberId}</p>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-muted-foreground">
//                       Phone Number
//                     </label>
//                     <p className="text-sm font-mono">{selectedMessage.phone}</p>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-muted-foreground">
//                       Via
//                     </label>
//                     <div className="mt-1">
//                       <Badge className={getViaBadge(selectedMessage.via)}>
//                         {selectedMessage.via}
//                       </Badge>
//                     </div>
//                   </div>
//                   <div className="md:col-span-2">
//                     <label className="text-sm font-medium text-muted-foreground">
//                       Message Content
//                     </label>
//                     <div className="mt-1 p-3 bg-muted rounded-md">
//                       <p className="text-sm whitespace-pre-wrap">
//                         {selectedMessage.content}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Status Information */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-semibold border-b pb-2">
//                   Status Information
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="text-sm font-medium text-muted-foreground">
//                       Status
//                     </label>
//                     <div className="mt-1">
//                       <Badge className={getStatusBadge(selectedMessage)}>
//                         {getStatusText(selectedMessage)}
//                       </Badge>
//                     </div>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-muted-foreground">
//                       Sent At
//                     </label>
//                     <p className="text-sm">
//                       {new Date(selectedMessage.sentAt).toLocaleString()}
//                     </p>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-muted-foreground">
//                       Created At
//                     </label>
//                     <p className="text-sm">
//                       {new Date(selectedMessage.createdAt).toLocaleString()}
//                     </p>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-muted-foreground">
//                       Updated At
//                     </label>
//                     <p className="text-sm">
//                       {new Date(selectedMessage.updatedAt).toLocaleString()}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* System Information */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-semibold border-b pb-2">
//                   System Information
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="text-sm font-medium text-muted-foreground">
//                       Tenant ID
//                     </label>
//                     <p className="text-sm">
//                       {selectedMessage.tenantId || "Not specified"}
//                     </p>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-muted-foreground">
//                       User ID
//                     </label>
//                     <p className="text-sm">
//                       {selectedMessage.userId || "Not specified"}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
