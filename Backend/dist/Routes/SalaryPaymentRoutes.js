"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SalaryPaymentControllers_1 = require("../Controllers/SalaryPaymentControllers");
const Jwt_1 = require("../helpers/secure/Jwt");
const router = (0, express_1.Router)();
// Routes
router.post('/create', Jwt_1.decodeToken, SalaryPaymentControllers_1.createSalaryPayment);
router.get('/all', Jwt_1.decodeToken, SalaryPaymentControllers_1.getAllSalaryPayments);
router.get('/one/:id', Jwt_1.decodeToken, SalaryPaymentControllers_1.getSalaryPaymentById);
router.put('/update/:id', Jwt_1.decodeToken, SalaryPaymentControllers_1.updateSalaryPayment);
router.delete('/delete/:id', Jwt_1.decodeToken, SalaryPaymentControllers_1.deleteSalaryPayment);
exports.default = router;
