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
exports.deleteEmployee = exports.updateEmployee = exports.getEmployeeById = exports.getAllEmployees = exports.createEmployee = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Create Employee
const createEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { fullName, email, phone, position, baseSalary, } = req.body;
        const newEmployee = yield prisma.employee.create({
            data: {
                fullName,
                email,
                phone,
                position,
                baseSalary,
                userUserid: (_a = req.user) === null || _a === void 0 ? void 0 : _a.Userid,
            },
        });
        res.status(201).json({ message: 'Employee created successfully', data: newEmployee });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create employee', error });
    }
});
exports.createEmployee = createEmployee;
// Get All Employees
const getAllEmployees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const employees = yield prisma.employee.findMany({
            where: { isdeleted: false },
            include: { User: true },
        });
        res.status(200).json({ data: employees });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch employees', error });
    }
});
exports.getAllEmployees = getAllEmployees;
// Get Employee by ID
const getEmployeeById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const employeeId = parseInt(req.params.id);
        const employee = yield prisma.employee.findUnique({
            where: { SalerOrEmployeeid: employeeId },
            include: { User: true },
        });
        if (!employee || employee.isdeleted) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.status(200).json({ data: employee });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch employee', error });
    }
});
exports.getEmployeeById = getEmployeeById;
// Update Employee
const updateEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const employeeId = parseInt(req.params.id);
        const updates = req.body;
        const updatedEmployee = yield prisma.employee.update({
            where: { SalerOrEmployeeid: employeeId },
            data: Object.assign(Object.assign({}, updates), { updatedAt: new Date() }),
        });
        res.status(200).json({ message: 'Employee updated successfully', data: updatedEmployee });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update employee', error });
    }
});
exports.updateEmployee = updateEmployee;
// Soft Delete Employee
const deleteEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const employeeId = parseInt(req.params.id);
        const deleted = yield prisma.employee.update({
            where: { SalerOrEmployeeid: employeeId },
            data: { isdeleted: true, isactive: false },
        });
        res.status(200).json({ message: 'Employee soft-deleted successfully', data: deleted });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete employee', error });
    }
});
exports.deleteEmployee = deleteEmployee;
