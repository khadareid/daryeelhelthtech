"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDonor = exports.updateDonor = exports.getDonorById = exports.getAllDonors = exports.createDonor = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Create Donor
const createDonor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { organization, contactName, email, phone, address, notes, } = req.body;
        const newDonor = yield prisma.donor.create({
            data: {
                organization,
                contactName,
                email,
                phone,
                address,
                notes,
                userUserid: req.body.Userid,
            },
        });
        res.status(201).json({ message: 'Donor created successfully', data: newDonor });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create donor', error });
    }
});
exports.createDonor = createDonor;
// Get All Donors
const getAllDonors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const donors = yield prisma.donor.findMany({
            where: { isdeleted: false },
            include: { User: true },
        });
        res.status(200).json({ data: donors });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch donors', error });
    }
});
exports.getAllDonors = getAllDonors;
// Get Donor by ID
const getDonorById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const donorId = parseInt(req.params.id);
        const donor = yield prisma.donor.findUnique({
            where: { id: donorId },
            include: { User: true, },
        });
        if (!donor || donor.isdeleted) {
            return res.status(404).json({ message: 'Donor not found' });
        }
        res.status(200).json({ data: donor });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch donor', error });
    }
});
exports.getDonorById = getDonorById;
// Update Donor
const updateDonor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const donorId = parseInt(req.params.id);
        const updates = req.body;
        const updatedDonor = yield prisma.donor.update({
            where: { id: donorId },
            data: Object.assign(Object.assign({}, updates), { updatedAt: new Date() }),
        });
        res.status(200).json({ message: 'Donor updated successfully', data: updatedDonor });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update donor', error });
    }
});
exports.updateDonor = updateDonor;
// Soft Delete Donor
const deleteDonor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const donorId = parseInt(req.params.id);
        const deleted = yield prisma.donor.update({
            where: { id: donorId },
            data: { isdeleted: true, isactive: false },
        });
        res.status(200).json({ message: 'Donor soft-deleted successfully', data: deleted });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete donor', error });
    }
});
exports.deleteDonor = deleteDonor;
