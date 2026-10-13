"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const EmployeeControllers_1 = require("../Controllers/EmployeeControllers");
const Jwt_1 = require("../helpers/secure/Jwt");
const router = (0, express_1.Router)();
// Routes
router.post('/create', Jwt_1.decodeToken, EmployeeControllers_1.createEmployee);
router.get('/all', Jwt_1.decodeToken, EmployeeControllers_1.getAllEmployees);
router.get('/one/:id', Jwt_1.decodeToken, EmployeeControllers_1.getEmployeeById);
router.put('/update/:id', Jwt_1.decodeToken, EmployeeControllers_1.updateEmployee);
router.delete('/delete/:id', Jwt_1.decodeToken, EmployeeControllers_1.deleteEmployee);
exports.default = router;
