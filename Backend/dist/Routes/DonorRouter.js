"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DonorController_1 = require("../Controllers/DonorController");
const Jwt_1 = require("../helpers/secure/Jwt");
const router = (0, express_1.Router)();
// Routes
router.post('/create', Jwt_1.decodeToken, DonorController_1.createDonor);
router.get('/all', Jwt_1.decodeToken, DonorController_1.getAllDonors);
router.get('/one/:id', Jwt_1.decodeToken, DonorController_1.getDonorById);
router.put('/update/:id', Jwt_1.decodeToken, DonorController_1.updateDonor);
router.delete('/delete/:id', Jwt_1.decodeToken, DonorController_1.deleteDonor);
exports.default = router;
