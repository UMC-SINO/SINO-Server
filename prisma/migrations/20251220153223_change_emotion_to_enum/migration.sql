/*
  Warnings:

  - You are about to alter the column `emotion_name` on the `aiAnalyzedEmotion` table. The data in that column could be lost. The data in that column will be cast from `VarChar(15)` to `Enum(EnumId(2))`.

*/
-- AlterTable
ALTER TABLE `aiAnalyzedEmotion` MODIFY `emotion_name` ENUM('Boredom', 'Worried', 'Smile', 'Joyful', 'Happy', 'Angry', 'Shameful', 'Unrest', 'Afraid', 'Sad') NOT NULL;
