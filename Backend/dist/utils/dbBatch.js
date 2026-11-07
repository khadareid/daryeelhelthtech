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
exports.runInBatches = runInBatches;
/**
 * Run async DB tasks in small batches so Prisma/Neon connection pools
 * are not exhausted by large Promise.all fan-outs.
 */
function runInBatches(tasks_1) {
    return __awaiter(this, arguments, void 0, function* (tasks, batchSize = 4) {
        const results = [];
        for (let i = 0; i < tasks.length; i += batchSize) {
            const slice = tasks.slice(i, i + batchSize);
            const batch = yield Promise.all(slice.map((fn) => fn()));
            results.push(...batch);
        }
        return results;
    });
}
