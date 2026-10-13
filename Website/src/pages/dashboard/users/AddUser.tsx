// // src/features/users/components/AddUser.tsx
// import type React from "react";
// import { Plus } from "lucide-react";
// import { Button } from "../../../components/ui/button";
// import {
//   Dialog,
//   DialogClose,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "../../../components/ui/dialog";
// import { Input } from "../../../components/ui/input";
// import { Label } from "../../../components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../../../components/ui/select";
// import {
//   useCreateUserMutation,
//   useGetUsersQuery,
// } from "../../../service/users/UsersApi";
// import type { UserInput } from "../../../service/types/Types";
// import Loading from "../../../lib/Loading";
// import { toast } from "sonner";
// import { useEffect, useState } from "react";
// import { useSelector } from "react-redux";
// import type { RootState } from "../../../../store/store";
// import type { UserRole } from "@/service/types/Enoms";

// // Initial form data
// const initialFormData: UserInput = {
//   name: "",
//   email: "",
//   password: "",
//   role: "STAFF" as UserRole,
//   picture: "",
//   tenantId: 0,
// };

// export default function AddUser() {
//   const [createUser, { isLoading, error, data, isError, isSuccess, reset }] =
//     useCreateUserMutation(); // Changed from useCreateUsersMutation
//   const { refetch } = useGetUsersQuery();

//   const [formData, setFormData] = useState<UserInput>(initialFormData);
//   const tenant = useSelector((state: RootState) => state.userInfo);
//   const [open, setOpen] = useState(false);
//   const [formErrors, setFormErrors] = useState<Record<string, string>>({});

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//     // Clear error when user starts typing
//     if (formErrors[name]) {
//       setFormErrors((prev) => ({ ...prev, [name]: "" }));
//     }
//   };

//   const handleSelectChange = (name: string, value: UserRole) => {
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//     if (formErrors[name]) {
//       setFormErrors((prev) => ({ ...prev, [name]: "" }));
//     }
//   };

//   const validateForm = (): boolean => {
//     const errors: Record<string, string> = {};

//     if (!formData.name?.trim()) {
//       errors.name = "Name is required";
//     }

//     if (!formData.email?.trim()) {
//       errors.email = "Email is required";
//     } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
//       errors.email = "Please enter a valid email";
//     }

//     if (!formData.role) {
//       errors.role = "Role is required";
//     }

//     // Password validation (if provided)
//     if (formData.password && formData.password.length < 6) {
//       errors.password = "Password must be at least 6 characters";
//     }

//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const toastId = "createUser";

//   const handleAddUser = async () => {
//     if (!validateForm()) {
//       toast.error("Please fill in all required fields", { id: toastId });
//       return;
//     }

//     try {
//       // Remove empty optional fields
//       const userData = { 
//         ...formData, 
//         tenantId: tenant?.tenantId || 0,
//         isActive: true 
//       };
      
//       // Remove password if empty (backend will generate)
//       if (!userData.password) {
//         delete userData.password;
//       }
      
//       // Remove picture if empty
//       if (!userData.picture) {
//         delete userData.picture;
//       }

//       await createUser(userData).unwrap();
//     } catch (error: any) {
//       console.error("Failed to create user:", error);
//     }
//   };

//   const resetForm = () => {
//     setFormData(initialFormData);
//     setFormErrors({});
//     reset();
//   };

//   useEffect(() => {
//     if (isSuccess) {
//       toast.success(data?.message || "User created successfully!", {
//         id: toastId,
//       });
//       setOpen(false);
//       resetForm();
//       refetch();
//     }
//     if (isError) {
//       const errorMessage = 
//         // @ts-ignore
//         error?.data?.message || 
//         // @ts-ignore
//         error?.message || 
//         "Failed to create user";
//       toast.error(errorMessage, { id: toastId });
//     }
//   }, [isSuccess, isError, data, error, refetch]);

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         <Button className="flex cursor-pointer items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105">
//           <Plus size={16} />
//           <span>Add User</span>
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="sm:max-w-[500px]">
//         <DialogHeader>
//           <DialogTitle className="text-xl font-semibold">
//             Create New User
//           </DialogTitle>
//           <DialogDescription>
//             Fill in the user details below. Fields marked with * are required.
//           </DialogDescription>
//         </DialogHeader>

//         <div className="grid gap-4 py-4">
//           <div className="space-y-2">
//             <Label htmlFor="name" className="text-sm font-medium">
//               Name *
//             </Label>
//             <Input
//               id="name"
//               name="name"
//               value={formData.name || ""}
//               onChange={handleChange}
//               placeholder="Enter full name"
//               className={formErrors.name ? "border-red-500" : ""}
//             />
//             {formErrors.name && (
//               <p className="text-sm text-red-500">{formErrors.name}</p>
//             )}
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="email" className="text-sm font-medium">
//               Email *
//             </Label>
//             <Input
//               id="email"
//               name="email"
//               type="email"
//               value={formData.email || ""}
//               onChange={handleChange}
//               placeholder="example@email.com"
//               className={formErrors.email ? "border-red-500" : ""}
//             />
//             {formErrors.email && (
//               <p className="text-sm text-red-500">{formErrors.email}</p>
//             )}
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="password" className="text-sm font-medium">
//               Password
//             </Label>
//             <Input
//               id="password"
//               name="password"
//               type="password"
//               value={formData.password || ""}
//               onChange={handleChange}
//               placeholder="Enter password (optional)"
//               className={formErrors.password ? "border-red-500" : ""}
//             />
//             {formErrors.password && (
//               <p className="text-sm text-red-500">{formErrors.password}</p>
//             )}
//             <p className="text-xs text-gray-500">
//               Leave empty to generate automatically
//             </p>
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="role" className="text-sm font-medium">
//               Role *
//             </Label>
//             <Select
//               value={formData.role || ""}
//               onValueChange={(value) => handleSelectChange("role", value as UserRole)}
//             >
//               <SelectTrigger
//                 className={formErrors.role ? "border-red-500" : ""}
//               >
//                 <SelectValue placeholder="Select user role" />
//               </SelectTrigger>
//               <SelectContent> 
//                 <SelectItem value="ADMIN">Admin</SelectItem>
//                 <SelectItem value="MANAGER">Manager</SelectItem>
//                 <SelectItem value="TRAINER">Trainer</SelectItem>
//                 <SelectItem value="STAFF">Staff</SelectItem>
//                 <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
//                 <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
//               </SelectContent>
//             </Select>
//             {formErrors.role && (
//               <p className="text-sm text-red-500">{formErrors.role}</p>
//             )}
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="picture" className="text-sm font-medium">
//               Profile Picture URL
//             </Label>
//             <Input
//               id="picture"
//               name="picture"
//               type="url"
//               value={formData.picture || ""}
//               onChange={handleChange}
//               placeholder="https://example.com/profile.jpg"
//             />
//             <p className="text-xs text-gray-500">
//               Optional: URL to user's profile picture
//             </p>
//           </div>
//         </div>

//         <DialogFooter className="gap-2">
//           <DialogClose asChild>
//             <Button variant="outline" onClick={resetForm}>
//               Cancel
//             </Button>
//           </DialogClose>
//           <Button
//             disabled={isLoading}
//             onClick={handleAddUser}
//             className="bg-blue-600 hover:bg-blue-700"
//           >
//             {isLoading ? (
//               <>
//                 <Loading color="#fff" size={15} />
//                 <span className="ml-2">Creating...</span>
//               </>
//             ) : (
//               "Create User"
//             )}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }