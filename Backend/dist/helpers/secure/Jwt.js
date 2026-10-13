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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = (user) => {
    const payload = user;
    return jsonwebtoken_1.default.sign(payload, process.env.secretKey || "secretKey@@", {
        expiresIn: "1d"
    });
};
exports.generateToken = generateToken;
//BearerToken Bearer Token 
//decodetoken
const decodeToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const token = ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.startsWith("Bearer")) && ((_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.split(' ')[1]);
        if (!token) {
            return res.status(405).json({
                message: "u don't have Token",
                isSuccess: false
            });
        }
        //decode
        const decode = jsonwebtoken_1.default.verify(token, process.env.secretKey || "secretKey@@");
        req.user = Object.assign({}, decode);
        next();
    }
    catch (error) {
        res.json("u don't have Token ");
    }
});
exports.decodeToken = decodeToken;
