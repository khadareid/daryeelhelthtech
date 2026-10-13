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
exports.deleteStudent = exports.updateStudent = exports.getStudentById = exports.getAllStudents = exports.createStudent = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Create Student
const createStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fullName, studentId, faculty, address, department, } = req.body;
        const newStudent = yield prisma.student.create({
            data: {
                fullName,
                studentId,
                department,
                faculty,
                userUserid: req.body.Userid,
            },
        });
        res.status(201).json({ message: 'Student created successfully', data: newStudent });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create student', error });
    }
});
exports.createStudent = createStudent;
// Get All Students
// Get All Students
const getAllStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const students = yield prisma.student.findMany({
            where: { isdeleted: false },
        });
        res.status(200).json({ data: students });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch students', error });
    }
});
exports.getAllStudents = getAllStudents;
// Get Student by ID
const getStudentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const studentId = parseInt(req.params.id);
        const student = yield prisma.student.findUnique({
            where: { id: studentId },
            include: {
                User: true,
                payments: true,
                _count: true,
            },
        });
        if (!student || student.isdeleted) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.status(200).json({ data: student });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch student', error });
    }
});
exports.getStudentById = getStudentById;
// Update Student
const updateStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const studentId = parseInt(req.params.id);
        const updates = req.body;
        const updatedStudent = yield prisma.student.update({
            where: { id: studentId },
            data: Object.assign(Object.assign({}, updates), { updatedAt: new Date() }),
        });
        res.status(200).json({ message: 'Student updated successfully', data: updatedStudent });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update student', error });
    }
});
exports.updateStudent = updateStudent;
// Soft Delete Student
const deleteStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const studentId = parseInt(req.params.id);
        const deleted = yield prisma.student.update({
            where: { id: studentId },
            data: {
                isdeleted: true,
                isactive: false,
            },
        });
        res.status(200).json({ message: 'Student soft-deleted successfully', data: deleted });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete student', error });
    }
});
exports.deleteStudent = deleteStudent;
