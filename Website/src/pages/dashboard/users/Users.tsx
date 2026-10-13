// // src/features/users/components/Users.tsx
// import {
//   Calendar,
//   Download,
//   Edit,
//   Eye,
//   Filter,
//   Loader2,
//   Mail,
//   MoreHorizontal,
//   Search,
//   Shield,
//   Trash2,
//   User,
//   UserRoundCheck,
//   Users2,
// } from "lucide-react";
// import { useMemo, useState } from "react";
// import { Link } from "react-router-dom";
// import { toast } from "sonner";
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
// import {
//   useActivateUserMutation,
//   useChangeUserRoleMutation,
//   useDeactivateUserMutation,
//   useDeleteUserMutation,
//   useGetUsersQuery,
//   useUpdateUserMutation,
// } from "../../../service/users/UsersApi";
// import AddUser from "./AddUser";

// // Define the User type based on your actual API response
// export interface User {
//   userid: number;        // Note: lowercase 'id'
//   name: string;
//   email: string;
//   role: string;
//   isActive: boolean;
//   isDeleted: boolean;
//   tenantId: number;
//   googleId?: string | null;
//   picture?: string | null;
//   password?: string;
//   lastLogin?: string | null;
//   createdAt: string;
//   updatedAt: string;
// }

// interface UsersProps {
//   title?: string;
//   description?: string;
// }

// export default function Users({
//   title = "All Users Data",
//   description = "Manage your users here.",
// }: UsersProps) {
//   const { data, isLoading, error, refetch } = useGetUsersQuery();

//   const [searchTerm, setSearchTerm] = useState("");
//   const [roleFilter, setRoleFilter] = useState<string>("all");
//   const [statusFilter, setStatusFilter] = useState<string>("all");
//   const [selectedUser, setSelectedUser] = useState<User | null>(null);
//   const [showUserDetails, setShowUserDetails] = useState(false);
//   const [showEditDialog, setShowEditDialog] = useState(false);
//   const [userToEdit, setUserToEdit] = useState<User | null>(null);
//   const [editForm, setEditForm] = useState({ name: "", email: "", role: "STAFF" });
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;

//   // Safely handle the data - API returns { isSuccess: true, users: [...] }
//   // @ts-ignore
//   const users: User[] = data || [];

//   const [activateUser] = useActivateUserMutation();
//   const [deactivateUser] = useDeactivateUserMutation();
//   const [updateUser] = useUpdateUserMutation();
//   const [deleteUser] = useDeleteUserMutation();
//   const [changeUserRole] = useChangeUserRoleMutation();
//   const toastId: string = "activate";

//   const handleActivate = async (userId: number) => {
//     try {
//       const res = await activateUser(userId).unwrap();
//       toast.success(res.message || "User activated successfully!", { id: toastId });
//       refetch();
//     } catch (error: any) {
//       toast.error(error?.data?.message || "Failed to activate user", { id: toastId });
//     }
//   };

//   const handleEditUser = (user: User) => {
//     setUserToEdit(user);
//     setEditForm({ name: user.name, email: user.email, role: user.role });
//     setShowEditDialog(true);
//   };

//   const handleSaveEdit = async () => {
//     if (!userToEdit) return;
//     try {
//       await updateUser({
//         id: userToEdit.userid,
//         data: { name: editForm.name, email: editForm.email },
//       }).unwrap();
//       if (editForm.role !== userToEdit.role) {
//         await changeUserRole({ userId: userToEdit.userid, role: editForm.role }).unwrap();
//       }
//       toast.success("User updated successfully");
//       setShowEditDialog(false);
//       refetch();
//     } catch (error: any) {
//       toast.error(error?.data?.message || "Failed to update user");
//     }
//   };

//   const handleDeactivate = async (userId: number) => {
//     try {
//       const res = await deactivateUser(userId).unwrap();
//       toast.success(res.message || "User deactivated");
//       refetch();
//     } catch (error: any) {
//       toast.error(error?.data?.message || "Failed to deactivate user");
//     }
//   };

//   const handleDeleteUser = async (userId: number) => {
//     try {
//       const res = await deleteUser(userId).unwrap();
//       toast.success(res.message || "User deleted");
//       refetch();
//     } catch (error: any) {
//       toast.error(error?.data?.message || "Failed to delete user");
//     }
//   };

//   // Filter and search logic
//   const filteredUsers = useMemo(() => {
//     if (!users.length) return [];

//     return users.filter((user) => {
//       const matchesSearch =
//         user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         user.email?.toLowerCase().includes(searchTerm.toLowerCase());

//       const matchesRole = roleFilter === "all" || user.role === roleFilter;

//       const matchesStatus =
//         statusFilter === "all" ||
//         (statusFilter === "ACTIVE" && user.isActive && !user.isDeleted) ||
//         (statusFilter === "INACTIVE" && (!user.isActive || user.isDeleted));

//       return matchesSearch && matchesRole && matchesStatus;
//     });
//   }, [users, searchTerm, roleFilter, statusFilter]);

//   // Pagination logic
//   const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const paginatedUsers = filteredUsers.slice(
//     startIndex,
//     startIndex + itemsPerPage
//   );

//   const getStatusBadge = (user: User) => {
//     if (user.isDeleted) {
//       return "bg-red-100 text-red-800 hover:bg-red-200";
//     }
//     return user.isActive
//       ? "bg-green-100 text-green-800 hover:bg-green-200"
//       : "bg-gray-100 text-gray-800 hover:bg-gray-200";
//   };

//   const getStatusText = (user: User) => {
//     if (user.isDeleted) return "DELETED";
//     return user.isActive ? "ACTIVE" : "INACTIVE";
//   };

//   const getRoleBadge = (role: string) => {
//     const variants: Record<string, string> = {
//       SUPER_ADMIN: "bg-purple-100 text-purple-800",
//       ADMIN: "bg-red-100 text-red-800",
//       MANAGER: "bg-orange-100 text-orange-800",
//       TRAINER: "bg-green-100 text-green-800",
//       STAFF: "bg-blue-100 text-blue-800",
//       ACCOUNTANT: "bg-yellow-100 text-yellow-800",
//       RECEPTIONIST: "bg-indigo-100 text-indigo-800",
//     };
//     return variants[role] || "bg-gray-100 text-gray-800";
//   };

//   const handleViewUser = (user: User) => {
//     setSelectedUser(user);
//     setShowUserDetails(true);
//   };

//   const clearFilters = () => {
//     setSearchTerm("");
//     setRoleFilter("all");
//     setStatusFilter("all");
//     setCurrentPage(1);
//   };

//   // Get unique roles from users data
//   const roles = useMemo(() => {
//     if (!Array.isArray(users)) return [];
//     return [...new Set(users.map((user) => user.role).filter(Boolean))];
//   }, [users]);

//   // Loading state
//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <div className="flex items-center space-x-2">
//           <Loader2 className="h-6 w-6 animate-spin" />
//           <span>Loading users...</span>
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
//               <Users2 className="h-12 w-12" />
//             </div>
//             <h3 className="text-lg font-semibold mb-2">Error Loading Users</h3>
//             <p className="text-muted-foreground text-center">
//               Failed to load user data. Please try again later.
//             </p>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div>
//         <div className="mb-6">
//           <div className="flex flex-col px-10 sm:flex-row sm:items-center sm:justify-between gap-4">
//             <div>
//               <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
//                 {title}
//               </h2>
//               <p className="text-gray-600 dark:text-gray-400 mt-1">
//                 {description} ({users.length} total)
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
//               <AddUser />
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
//               placeholder="Search by name or email..."
//               value={searchTerm}
//               onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
//               className="pl-10"
//             />
//           </div>

//           {/* Filter Controls */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//             <div className="space-y-2">
//               <label className="text-sm font-medium">Role</label>
//               <Select value={roleFilter} onValueChange={setRoleFilter}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select role" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Roles</SelectItem>
//                   {roles.map((role) => (
//                     <SelectItem key={role} value={role}>
//                       {role.replace('_', ' ')}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="space-y-2">
//               <label className="text-sm font-medium">Status</label>
//               <Select value={statusFilter} onValueChange={setStatusFilter}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select status" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Status</SelectItem>
//                   <SelectItem value="ACTIVE">Active</SelectItem>
//                   <SelectItem value="INACTIVE">Inactive</SelectItem>
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
//       <Card className="hidden lg:block">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>User</TableHead>
//               <TableHead>Email</TableHead>
//               <TableHead>Role</TableHead>
//               <TableHead>Status</TableHead>
//               <TableHead>Auth Method</TableHead>
//               <TableHead className="text-right">Actions</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {paginatedUsers.map((user) => (
//               <TableRow key={user.userid}>
//                 <TableCell>
//                   <div className="flex items-center space-x-3">
//                     {user.picture ? (
//                       <img
//                         src={user.picture}
//                         alt={user.name}
//                         className="h-8 w-8 rounded-full object-cover"
//                       />
//                     ) : (
//                       <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
//                         <User className="h-4 w-4 text-gray-500" />
//                       </div>
//                     )}
//                     <div>
//                       <div className="font-medium">{user.name}</div>
//                       <div className="text-sm text-muted-foreground">
//                         ID: {user.userid}
//                       </div>
//                     </div>
//                   </div>
//                 </TableCell>
//                 <TableCell>
//                   <div className="text-sm">{user.email}</div>
//                 </TableCell>
//                 <TableCell>
//                   <Badge className={getRoleBadge(user.role)}>
//                     {user.role.replace('_', ' ')}
//                   </Badge>
//                 </TableCell>
//                 <TableCell>
//                   <Badge className={getStatusBadge(user)}>
//                     {getStatusText(user)}
//                   </Badge>
//                 </TableCell>
//                 <TableCell>
//                   <div className="flex items-center space-x-2">
//                     {user.googleId ? (
//                       <Badge variant="outline" className="text-xs">
//                         Google
//                       </Badge>
//                     ) : (
//                       <Badge variant="outline" className="text-xs">
//                         Email
//                       </Badge>
//                     )}
//                   </div>
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
//                       <DropdownMenuItem asChild className="cursor-pointer">
//                         <Link to={`/dashboard/users/${user.userid}`}>
//                           <Eye className="mr-2 h-4 w-4" />
//                           View Details
//                         </Link>
//                       </DropdownMenuItem>
//                       <DropdownMenuItem onClick={() => handleEditUser(user)}>
//                         <Edit className="mr-2 h-4 w-4" />
//                         Edit User
//                       </DropdownMenuItem>
//                       <DropdownMenuSeparator />
//                       <DropdownMenuItem
//                         onClick={() => handleActivate(user.userid)}
//                         className="text-green-600"
//                       >
//                         <UserRoundCheck className="mr-2 h-4 w-4" />
//                         Toggle Active
//                       </DropdownMenuItem>
//                       <DropdownMenuItem
//                         onClick={() => handleDeactivate(user.userid)}
//                         className="text-orange-600"
//                       >
//                         Deactivate
//                       </DropdownMenuItem>
//                       <DropdownMenuItem
//                         onClick={() => handleDeleteUser(user.userid)}
//                         className="text-red-600"
//                       >
//                         <Trash2 className="mr-2 h-4 w-4" />
//                         Delete
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
//         {paginatedUsers.map((user) => (
//           <Card key={user.userid}>
//             <CardContent className="p-4">
//               <div className="flex justify-between items-start mb-3">
//                 <div className="flex items-center space-x-3">
//                   {user.picture ? (
//                     <img
//                       src={user.picture}
//                       alt={user.name}
//                       className="h-10 w-10 rounded-full object-cover"
//                     />
//                   ) : (
//                     <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
//                       <User className="h-5 w-5 text-gray-500" />
//                     </div>
//                   )}
//                   <div>
//                     <h3 className="font-semibold text-lg">{user.name}</h3>
//                     <div className="flex gap-2 mt-1">
//                       <Badge className={getStatusBadge(user)}>
//                         {getStatusText(user)}
//                       </Badge>
//                       <Badge className={getRoleBadge(user.role)}>
//                         {user.role.replace('_', ' ')}
//                       </Badge>
//                     </div>
//                   </div>
//                 </div>
//                 <DropdownMenu>
//                   <DropdownMenuTrigger asChild>
//                     <Button variant="ghost" size="sm">
//                       <MoreHorizontal className="h-4 w-4" />
//                     </Button>
//                   </DropdownMenuTrigger>
//                   <DropdownMenuContent align="end">
//                     <DropdownMenuItem asChild className="cursor-pointer">
//                       <Link to={`/dashboard/users/${user.userid}`}>
//                         <Eye className="mr-2 h-4 w-4" />
//                         View Details
//                       </Link>
//                     </DropdownMenuItem>
//                     <DropdownMenuItem onClick={() => handleEditUser(user)}>
//                       <Edit className="mr-2 h-4 w-4" />
//                       Edit
//                     </DropdownMenuItem>
//                     <DropdownMenuItem
//                       onClick={() => handleActivate(user.userid)}
//                       className="text-green-600"
//                     >
//                       <UserRoundCheck className="mr-2 h-4 w-4" />
//                       Toggle Active
//                     </DropdownMenuItem>
//                     <DropdownMenuItem
//                       onClick={() => handleDeleteUser(user.userid)}
//                       className="text-red-600"
//                     >
//                       <Trash2 className="mr-2 h-4 w-4" />
//                       Delete
//                     </DropdownMenuItem>
//                   </DropdownMenuContent>
//                 </DropdownMenu>
//               </div>

//               <div className="space-y-2 text-sm">
//                 <div className="flex items-center gap-2">
//                   <Mail className="h-4 w-4 text-muted-foreground" />
//                   <span>{user.email}</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Shield className="h-4 w-4 text-muted-foreground" />
//                   <span>Role: {user.role.replace('_', ' ')}</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Calendar className="h-4 w-4 text-muted-foreground" />
//                   <span>User ID: {user.userid}</span>
//                 </div>
//               </div>

//               <div className="flex justify-between items-center mt-3 pt-3 border-t">
//                 <div className="flex items-center gap-2">
//                   {user.googleId ? (
//                     <Badge variant="outline" className="text-xs">
//                       Google Auth
//                     </Badge>
//                   ) : (
//                     <Badge variant="outline" className="text-xs">
//                       Email Auth
//                     </Badge>
//                   )}
//                   {user.tenantId && (
//                     <Badge variant="outline" className="text-xs">
//                       Tenant: {user.tenantId}
//                     </Badge>
//                   )}
//                 </div>
//                 <Button size="sm" variant="outline" asChild>
//                   <Link to={`/dashboard/users/${user.userid}`}>View Details</Link>
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
//             {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of{" "}
//             {filteredUsers.length} users
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
//       {filteredUsers.length === 0 && !isLoading && (
//         <Card>
//           <CardContent className="flex flex-col items-center justify-center py-12">
//             <Users2 className="h-12 w-12 text-muted-foreground mb-4" />
//             <h3 className="text-lg font-semibold mb-2">No users found</h3>
//             <p className="text-muted-foreground text-center mb-4">
//               {searchTerm || roleFilter !== "all" || statusFilter !== "all"
//                 ? "Try adjusting your search or filters"
//                 : "No users available in the system"}
//             </p>
//             {(searchTerm || roleFilter !== "all" || statusFilter !== "all") && (
//               <Button variant="outline" onClick={clearFilters}>
//                 Clear Filters
//               </Button>
//             )}
//           </CardContent>
//         </Card>
//       )}

//       {/* User Details Modal */}
//       <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
//         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>User Details</DialogTitle>
//             <DialogDescription>
//               Complete information for {selectedUser?.name}
//             </DialogDescription>
//           </DialogHeader>

//           {selectedUser && (
//             <div className="space-y-6">
//               {/* Personal Information */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-semibold border-b pb-2">
//                   Personal Information
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="text-sm font-medium text-muted-foreground">
//                       Full Name
//                     </label>
//                     <p className="text-sm">{selectedUser.name}</p>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-muted-foreground">
//                       Email
//                     </label>
//                     <p className="text-sm">{selectedUser.email}</p>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-muted-foreground">
//                       User ID
//                     </label>
//                     <p className="text-sm font-mono">{selectedUser.userid}</p>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-muted-foreground">
//                       Role
//                     </label>
//                     <div className="mt-1">
//                       <Badge className={getRoleBadge(selectedUser.role)}>
//                         {selectedUser.role.replace('_', ' ')}
//                       </Badge>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Account Information */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-semibold border-b pb-2">
//                   Account Information
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="text-sm font-medium text-muted-foreground">
//                       Status
//                     </label>
//                     <div className="mt-1">
//                       <Badge className={getStatusBadge(selectedUser)}>
//                         {getStatusText(selectedUser)}
//                       </Badge>
//                     </div>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-muted-foreground">
//                       Authentication Method
//                     </label>
//                     <p className="text-sm">
//                       {selectedUser.googleId
//                         ? "Google OAuth"
//                         : "Email & Password"}
//                     </p>
//                   </div>
//                   {selectedUser.tenantId && (
//                     <div>
//                       <label className="text-sm font-medium text-muted-foreground">
//                         Company 
//                       </label>
//                       <p className="text-sm font-mono">
//                         {selectedUser.tenantId}
//                       </p>
//                     </div>
//                   )}
//                   {selectedUser.googleId && (
//                     <div>
//                       <label className="text-sm font-medium text-muted-foreground">
//                         Google ID
//                       </label>
//                       <p className="text-sm font-mono truncate">
//                         {selectedUser.googleId}
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Timestamps */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-semibold border-b pb-2">
//                   Activity Information
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {selectedUser.createdAt && (
//                     <div>
//                       <label className="text-sm font-medium text-muted-foreground">
//                         Created At
//                       </label>
//                       <p className="text-sm">
//                         {new Date(selectedUser.createdAt).toLocaleString()}
//                       </p>
//                     </div>
//                   )}
//                   {selectedUser.updatedAt && (
//                     <div>
//                       <label className="text-sm font-medium text-muted-foreground">
//                         Updated At
//                       </label>
//                       <p className="text-sm">
//                         {new Date(selectedUser.updatedAt).toLocaleString()}
//                       </p>
//                     </div>
//                   )}
//                   {selectedUser.lastLogin && (
//                     <div>
//                       <label className="text-sm font-medium text-muted-foreground">
//                         Last Login
//                       </label>
//                       <p className="text-sm">
//                         {new Date(selectedUser.lastLogin).toLocaleString()}
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Profile Picture */}
//               {selectedUser.picture && (
//                 <div className="space-y-4">
//                   <h3 className="text-lg font-semibold border-b pb-2">
//                     Profile Picture
//                   </h3>
//                   <div className="flex items-center space-x-4">
//                     <img
//                       src={selectedUser.picture}
//                       alt={selectedUser.name}
//                       className="h-16 w-16 rounded-full border object-cover"
//                     />
//                     <div>
//                       <p className="text-sm text-muted-foreground">
//                         Profile image from Google account
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>

//       <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Edit User</DialogTitle>
//             <DialogDescription>Update user details and role</DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div>
//               <label className="text-sm font-medium">Name</label>
//               <Input
//                 value={editForm.name}
//                 onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
//               />
//             </div>
//             <div>
//               <label className="text-sm font-medium">Email</label>
//               <Input
//                 value={editForm.email}
//                 onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
//               />
//             </div>
//             <div>
//               <label className="text-sm font-medium">Role</label>
//               <Select
//                 value={editForm.role}
//                 onValueChange={(v) => setEditForm({ ...editForm, role: v })}
//               >
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {["ADMIN", "MANAGER", "TRAINER", "STAFF", "ACCOUNTANT", "RECEPTIONIST"].map((r) => (
//                     <SelectItem key={r} value={r}>{r}</SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <Button onClick={handleSaveEdit} className="w-full">Save Changes</Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }