// import type React from "react";
// import { Send, Check, ChevronsUpDown } from "lucide-react";
// import { useEffect, useState, useCallback } from "react";
// import { toast } from "sonner";
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
// import { Textarea } from "../../../components/ui/textarea";
// import { Badge } from "../../../components/ui/badge";
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from "../../../components/ui/command";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "../../../components/ui/popover";
// import { User, Phone, Mail, Loader2 } from "lucide-react";
// import { cn } from "../../../lib/utils";
// import { resolveMemberId } from "../../../lib/memberUtils";

// // Import your real API hooks
// import { useGetMembersQuery } from "../../../service/MembersApi";
// import {
//   useCreateMessagesMutation,
//   useGetMessagesQuery,
// } from "../../../service/messages/MessagesApi";
// import Loading from "../../../lib/Loading";
// import type { MessageCreate } from "../../../service/types/Types";

// const initialFormData: MessageCreate = {
//   memberId: 0,
//   content: "",
//   phone: "",
// };

// export function CreateMessage() {
//   const [createMessage, { isLoading, error, data, isError, isSuccess, reset }] =
//     useCreateMessagesMutation();
//   const {
//     data: members,
//     isLoading: membersLoading,
//     error: membersError,
//   } = useGetMembersQuery();
//   const { refetch } = useGetMessagesQuery();

//   const [formData, setFormData] = useState<MessageCreate>(initialFormData);
//   const [open, setOpen] = useState(false);
//   const [formErrors, setFormErrors] = useState<Record<string, string>>({});
//   const [selectedMember, setSelectedMember] = useState<any>(null);
//   const [memberSelectOpen, setMemberSelectOpen] = useState(false);

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
//   ) => {
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

//   const handleMemberSelect = (member: any) => {
//     setSelectedMember(member);
//     setFormData((prev) => ({
//       ...prev,
//       memberId: resolveMemberId(member),
//       phone: member.phone,
//     }));
//     setMemberSelectOpen(false);
//     // Clear member selection error
//     if (formErrors.memberId) {
//       setFormErrors((prev) => ({ ...prev, memberId: "" }));
//     }
//   };

//   const validateForm = (): boolean => {
//     const errors: Record<string, string> = {};

//     if (!formData.memberId || formData.memberId === 0) {
//       errors.memberId = "Please select a member";
//     }

//     if (!formData.content.trim()) {
//       errors.content = "Message content is required";
//     } else if (formData.content.trim().length < 10) {
//       errors.content = "Message must be at least 10 characters long";
//     }

//     if (!formData.phone.trim()) {
//       errors.phone = "Phone number is required";
//     }

//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const toastId = "createMessage";

//   const handleSendMessage = async () => {
//     if (!validateForm()) {
//       toast.error("Please fill in all required fields", { id: toastId });
//       return;
//     }

//     try {
//       await createMessage(formData).unwrap();
//     } catch (error: any) {
//       console.error("Failed to send message:", error);
//     }
//   };

//   const resetForm = useCallback(() => {
//     setFormData(initialFormData);
//     setSelectedMember(null);
//     setFormErrors({});
//     setMemberSelectOpen(false);
//     reset();
//   }, [reset]);

//   // Handle success
//   useEffect(() => {
//     if (isSuccess && data?.message) {
//       toast.success(data.message, { id: toastId });
//       setOpen(false);
//       resetForm();
//       refetch();
//     }
//   }, [isSuccess, data?.message, resetForm, refetch]);

//   // Handle error
//   useEffect(() => {
//     if (isError && error) {
//       //@ts-ignore
//       toast.error(error?.data?.message || "Failed to send message", {
//         id: toastId,
//       });
//     }
//   }, [isError, error]);

//   // Filter active members
//   const activeMembers = members?.filter((member: any) => member.isActive) || [];

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         <Button className="flex cursor-pointer items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105">
//           <Send size={16} />
//           <span>Send Message</span>
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="text-xl font-semibold">
//             Send Message to Member
//           </DialogTitle>
//           <DialogDescription>
//             Select a member and compose your message. All fields are required.
//           </DialogDescription>
//         </DialogHeader>

//         <div className="grid gap-6 py-4">
//           {/* Member Selection Section */}
//           <div className="space-y-4">
//             <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
//               Select Member
//             </h3>

//             <div className="space-y-2">
//               <Label htmlFor="member" className="text-sm font-medium">
//                 Choose Member *
//               </Label>

//               {membersError ? (
//                 <div className="p-3 bg-red-50 border border-red-200 rounded-md">
//                   <p className="text-sm text-red-600">
//                     Failed to load members. Please try again.
//                   </p>
//                 </div>
//               ) : (
//                 <Popover
//                   open={memberSelectOpen}
//                   onOpenChange={setMemberSelectOpen}
//                 >
//                   <PopoverTrigger asChild>
//                     <Button
//                       variant="outline"
//                       role="combobox"
//                       aria-expanded={memberSelectOpen}
//                       className={cn(
//                         "w-full justify-between",
//                         formErrors.memberId && "border-red-500",
//                         !selectedMember && "text-muted-foreground"
//                       )}
//                       disabled={membersLoading || activeMembers.length === 0}
//                     >
//                       {selectedMember ? (
//                         <div className="flex items-center space-x-2">
//                           <User className="h-4 w-4" />
//                           <span>{selectedMember.fullName}</span>
//                           <span className="text-muted-foreground">
//                             ({selectedMember.phone})
//                           </span>
//                         </div>
//                       ) : membersLoading ? (
//                         "Loading members..."
//                       ) : activeMembers.length === 0 ? (
//                         "No active members found"
//                       ) : (
//                         "Select a member..."
//                       )}
//                       <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                     </Button>
//                   </PopoverTrigger>
//                   <PopoverContent className="w-full p-0" align="start">
//                     <Command>
//                       <CommandInput placeholder="Search members by name, email, or phone..." />
//                       <CommandList>
//                         <CommandEmpty>
//                           {membersLoading ? (
//                             <div className="flex items-center justify-center py-6">
//                               <Loader2 className="h-4 w-4 animate-spin mr-2" />
//                               <span>Loading members...</span>
//                             </div>
//                           ) : (
//                             "No members found."
//                           )}
//                         </CommandEmpty>
//                         <CommandGroup>
//                           {activeMembers.map((member: any) => (
//                             <CommandItem
//                               key={member.memberId}
//                               value={`${member.fullName} ${member.email} ${member.phone}`}
//                               onSelect={() => handleMemberSelect(member)}
//                               className="flex items-center space-x-2 cursor-pointer"
//                             >
//                               <Check
//                                 className={cn(
//                                   "mr-2 h-4 w-4",
//                                   selectedMember?.memberId === member.memberId
//                                     ? "opacity-100"
//                                     : "opacity-0"
//                                 )}
//                               />
//                               <div className="flex-1">
//                                 <div className="flex items-center space-x-2">
//                                   <User className="h-4 w-4 text-muted-foreground" />
//                                   <span className="font-medium">
//                                     {member.fullName}
//                                   </span>
//                                   <Badge variant="outline" className="text-xs">
//                                     ID: {member.memberId}
//                                   </Badge>
//                                 </div>
//                                 <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
//                                   <div className="flex items-center space-x-1">
//                                     <Mail className="h-3 w-3" />
//                                     <span>{member.email}</span>
//                                   </div>
//                                   <div className="flex items-center space-x-1">
//                                     <Phone className="h-3 w-3" />
//                                     <span className="font-mono">
//                                       {member.phone}
//                                     </span>
//                                   </div>
//                                 </div>
//                               </div>
//                             </CommandItem>
//                           ))}
//                         </CommandGroup>
//                       </CommandList>
//                     </Command>
//                   </PopoverContent>
//                 </Popover>
//               )}

//               {formErrors.memberId && (
//                 <p className="text-sm text-red-500">{formErrors.memberId}</p>
//               )}

//               {membersLoading && (
//                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                   <span>Loading members...</span>
//                 </div>
//               )}
//             </div>

//             {/* Selected Member Info */}
//             {selectedMember && (
//               <div className="p-4 bg-muted rounded-lg">
//                 <h4 className="font-medium mb-2">Selected Member:</h4>
//                 <div className="space-y-2">
//                   <div className="flex items-center gap-2">
//                     <User className="h-4 w-4 text-muted-foreground" />
//                     <span className="font-medium">
//                       {selectedMember.fullName}
//                     </span>
//                     <Badge
//                       variant={
//                         selectedMember.isActive ? "default" : "secondary"
//                       }
//                     >
//                       {selectedMember.isActive ? "Active" : "Inactive"}
//                     </Badge>
//                     <Badge variant="outline" className="text-xs">
//                       ID: {selectedMember.memberId}
//                     </Badge>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Mail className="h-4 w-4 text-muted-foreground" />
//                     <span className="text-sm">{selectedMember.email}</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Phone className="h-4 w-4 text-muted-foreground" />
//                     <span className="text-sm font-mono">
//                       {selectedMember.phone}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Message Content Section */}
//           <div className="space-y-4">
//             <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
//               Message Details
//             </h3>

//             <div className="space-y-2">
//               <Label htmlFor="phone" className="text-sm font-medium">
//                 Phone Number *
//               </Label>
//               <Input
//                 id="phone"
//                 name="phone"
//                 value={formData.phone}
//                 onChange={handleChange}
//                 placeholder="Phone number will be auto-filled"
//                 className={`font-mono ${
//                   formErrors.phone ? "border-red-500" : ""
//                 }`}
//                 readOnly={!!selectedMember}
//               />
//               {formErrors.phone && (
//                 <p className="text-sm text-red-500">{formErrors.phone}</p>
//               )}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="content" className="text-sm font-medium">
//                 Message Content *
//               </Label>
//               <Textarea
//                 id="content"
//                 name="content"
//                 value={formData.content}
//                 onChange={handleChange}
//                 placeholder="Type your message here... (minimum 10 characters)"
//                 className={`min-h-[120px] ${
//                   formErrors.content ? "border-red-500" : ""
//                 }`}
//                 maxLength={500}
//               />
//               <div className="flex justify-between items-center">
//                 {formErrors.content && (
//                   <p className="text-sm text-red-500">{formErrors.content}</p>
//                 )}
//                 <p className="text-sm text-muted-foreground ml-auto">
//                   {formData.content.length}/500 characters
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Message Preview */}
//           {formData.content && selectedMember && (
//             <div className="space-y-4">
//               <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
//                 Message Preview
//               </h3>
//               <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
//                 <div className="flex items-center gap-2 mb-2">
//                   <span className="text-sm font-medium">
//                     To: {selectedMember.fullName}
//                   </span>
//                   <span className="text-sm text-muted-foreground">
//                     ({formData.phone})
//                   </span>
//                 </div>
//                 <p className="text-sm whitespace-pre-wrap">
//                   {formData.content}
//                 </p>
//               </div>
//             </div>
//           )}
//         </div>

//         <DialogFooter className="gap-2">
//           <DialogClose asChild>
//             <Button variant="outline" onClick={resetForm}>
//               Cancel
//             </Button>
//           </DialogClose>
//           <Button
//             disabled={
//               isLoading || !selectedMember || activeMembers.length === 0
//             }
//             onClick={handleSendMessage}
//             className="bg-blue-600 hover:bg-blue-700"
//           >
//             {isLoading ? (
//               <>
//                 <Loading color="#fff" size={15} />
//                 <span className="ml-2">Sending...</span>
//               </>
//             ) : (
//               <>
//                 <Send className="h-4 w-4 mr-2" />
//                 Send Message
//               </>
//             )}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }
