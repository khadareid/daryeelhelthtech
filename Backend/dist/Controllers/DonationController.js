"use strict";
// import { PrismaClient } from '@prisma/client'
// import { CustomUserRequest } from '../helpers/secure/Jwt'
// const prisma = new PrismaClient()
// // Create Donation
// export const createDonation = async (req: CustomUserRequest, res: any) => {
//   try {
//     const {
//       amount,
//       note,
//       status,
//       userId,
//     } = req.body
//     const newDonation = await prisma.donation.create({
//       data: {
//         donorId:req.body.donorId ,
//         studentId:req.body.studentId ,
//         amount,
//         note,
//         status,
//         userUserid: userId ?? req.user?.Userid,
//       },
//     })
//     res.status(201).json({ message: 'Donation created successfully', data: newDonation })
//   } catch (error) {
//     console.error(error)
//     res.status(500).json({ message: 'Failed to create donation', error })
//   }
// }
// // Get All Donations
// export const getAllDonations = async (req: CustomUserRequest, res: any) => {
//   try {
//     const donations = await prisma.donation.findMany({
//       where: { isdeleted: false },
//       include: {
//         donor: true,
//         student: true,
//         payments: true,
//         User: true,
//       },
//     })
//     res.status(200).json({ data: donations })
//   } catch (error) {
//     console.error(error)
//     res.status(500).json({ message: 'Failed to fetch donations', error })
//   }
// }
// // Get Donation by ID
// export const getDonationById = async (req: CustomUserRequest, res: any) => {
//   try {
//     const donationId = parseInt(req.params.id)
//     const donation = await prisma.donation.findUnique({
//       where: { id: donationId },
//       include: {
//         donor: true,
//         student: true,
//         payments: true,
//         User: true,
//       },
//     })
//     if (!donation || donation.isdeleted) {
//       return res.status(404).json({ message: 'Donation not found' })
//     }
//     res.status(200).json({ data: donation })
//   } catch (error) {
//     console.error(error)
//     res.status(500).json({ message: 'Failed to fetch donation', error })
//   }
// }
// // Update Donation
// export const updateDonation = async (req: CustomUserRequest, res: any) => {
//   try {
//     const donationId = parseInt(req.params.id)
//     const updates = req.body
//     const updatedDonation = await prisma.donation.update({
//       where: { id: donationId },
//       data: {
//         ...updates,
//         updatedAt: new Date(),
//       },
//     })
//     res.status(200).json({ message: 'Donation updated successfully', data: updatedDonation })
//   } catch (error) {
//     console.error(error)
//     res.status(500).json({ message: 'Failed to update donation', error })
//   }
// }
// // Soft Delete Donation
// export const deleteDonation = async (req: CustomUserRequest, res: any) => {
//   try {
//     const donationId = parseInt(req.params.id)
//     const deleted = await prisma.donation.update({
//       where: { id: donationId },
//       data: {
//         isdeleted: true,
//         isactive: false,
//       },
//     })
//     res.status(200).json({ message: 'Donation soft-deleted successfully', data: deleted })
//   } catch (error) {
//     console.error(error)
//     res.status(500).json({ message: 'Failed to delete donation', error })
//   }
// }
