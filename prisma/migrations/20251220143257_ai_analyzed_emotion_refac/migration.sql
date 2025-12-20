/*
  Warnings:

  - You are about to drop the column `emotion_id` on the `aiAnalyzedEmotion` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[analysis_id,emotion_name]` on the table `aiAnalyzedEmotion` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `emotion_name` to the `aiAnalyzedEmotion` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `aiAnalyzedEmotion` DROP FOREIGN KEY `fk_aie_emotion`;

-- DropIndex
DROP INDEX `uq_aie_analysis_emotion` ON `aiAnalyzedEmotion`;

-- AlterTable
ALTER TABLE `aiAnalyzedEmotion` DROP COLUMN `emotion_id`,
    ADD COLUMN `emotion_name` VARCHAR(15) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `uq_aie_analysis_emotion_name` ON `aiAnalyzedEmotion`(`analysis_id`, `emotion_name`);
