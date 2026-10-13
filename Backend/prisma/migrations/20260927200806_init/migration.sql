/*
  Warnings:

  - You are about to drop the column `distanceMeters` on the `DailyHealthLog` table. All the data in the column will be lost.
  - You are about to drop the column `stepsGoalMet` on the `DailyHealthLog` table. All the data in the column will be lost.
  - You are about to drop the column `weightLbs` on the `DailyHealthLog` table. All the data in the column will be lost.
  - The `sleepQuality` column on the `DailyHealthLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `mood` column on the `DailyHealthLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `stressLevel` column on the `DailyHealthLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `energyLevel` column on the `DailyHealthLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `source` column on the `DailyHealthLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `HealthGoal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StepHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WeightHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MoodLevel" AS ENUM ('VERY_BAD', 'BAD', 'NEUTRAL', 'GOOD', 'VERY_GOOD');

-- CreateEnum
CREATE TYPE "SleepQuality" AS ENUM ('VERY_POOR', 'POOR', 'FAIR', 'GOOD', 'EXCELLENT');

-- CreateEnum
CREATE TYPE "StressLevel" AS ENUM ('NONE', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "EnergyLevel" AS ENUM ('VERY_LOW', 'LOW', 'NORMAL', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE');

-- CreateEnum
CREATE TYPE "PainLevel" AS ENUM ('NONE', 'MILD', 'MODERATE', 'SEVERE', 'VERY_SEVERE');

-- CreateEnum
CREATE TYPE "HydrationStatus" AS ENUM ('NOT_MET', 'PARTIAL', 'MET', 'EXCEEDED');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DailyLogSource" AS ENUM ('MANUAL', 'DEVICE', 'HEALTH_APP', 'MIXED');

-- DropForeignKey
ALTER TABLE "HealthGoal" DROP CONSTRAINT "HealthGoal_userId_fkey";

-- DropForeignKey
ALTER TABLE "StepHistory" DROP CONSTRAINT "StepHistory_userId_fkey";

-- DropForeignKey
ALTER TABLE "WeightHistory" DROP CONSTRAINT "WeightHistory_userId_fkey";

-- AlterTable
ALTER TABLE "DailyHealthLog" DROP COLUMN "distanceMeters",
DROP COLUMN "stepsGoalMet",
DROP COLUMN "weightLbs",
ADD COLUMN     "activeGoalStatus" "GoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "activeMinutesGoal" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "activityLevel" "ActivityLevel",
ADD COLUMN     "calorieGoalStatus" "GoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "fiberG" DOUBLE PRECISION,
ADD COLUMN     "hydrationStatus" "HydrationStatus" NOT NULL DEFAULT 'NOT_MET',
ADD COLUMN     "measurementRecordedAt" TIMESTAMP(3),
ADD COLUMN     "meditationMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "painAreas" TEXT,
ADD COLUMN     "painLevel" "PainLevel",
ADD COLUMN     "relaxationMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sleepEnd" TIMESTAMP(3),
ADD COLUMN     "sleepGoalHours" DOUBLE PRECISION NOT NULL DEFAULT 8,
ADD COLUMN     "sleepGoalStatus" "GoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "sleepStart" TIMESTAMP(3),
ADD COLUMN     "stepsGoalStatus" "GoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "sugarG" DOUBLE PRECISION,
ADD COLUMN     "waterGoalMlTarget" INTEGER NOT NULL DEFAULT 2000,
ADD COLUMN     "waterGoalStatus" "GoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
DROP COLUMN "sleepQuality",
ADD COLUMN     "sleepQuality" "SleepQuality",
DROP COLUMN "mood",
ADD COLUMN     "mood" "MoodLevel",
DROP COLUMN "stressLevel",
ADD COLUMN     "stressLevel" "StressLevel",
DROP COLUMN "energyLevel",
ADD COLUMN     "energyLevel" "EnergyLevel",
DROP COLUMN "source",
ADD COLUMN     "source" "DailyLogSource" NOT NULL DEFAULT 'MANUAL',
ALTER COLUMN "caloriesGoal" DROP NOT NULL,
ALTER COLUMN "caloriesGoal" DROP DEFAULT;

-- DropTable
DROP TABLE "HealthGoal";

-- DropTable
DROP TABLE "StepHistory";

-- DropTable
DROP TABLE "WeightHistory";
