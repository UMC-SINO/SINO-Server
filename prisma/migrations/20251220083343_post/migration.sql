-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(15) NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_user_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aiAnalysis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `signal_noise_result` ENUM('Signal', 'Noise') NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_aiAnalysis_post`(`post_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aiAnalyzedEmotion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `analysis_id` INTEGER NOT NULL,
    `emotion_id` INTEGER NOT NULL,
    `percentage` DECIMAL(5, 2) NOT NULL,

    INDEX `idx_aie_analysis_id`(`analysis_id`),
    INDEX `idx_aie_emotion_id`(`emotion_id`),
    UNIQUE INDEX `uq_aie_analysis_emotion`(`analysis_id`, `emotion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emotion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `emotion_name` VARCHAR(20) NOT NULL,

    UNIQUE INDEX `uq_emotion_name`(`emotion_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oneLine` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `content` VARCHAR(50) NOT NULL,

    INDEX `fk_oneLine_post`(`post_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `photo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `url` VARCHAR(300) NOT NULL,
    `is_picked` BOOLEAN NOT NULL DEFAULT false,
    `upload_order` INTEGER NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_photo_post_id`(`post_id`),
    INDEX `idx_photo_post_order`(`post_id`, `upload_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `month` INTEGER NULL,
    `title` VARCHAR(100) NULL,
    `content` VARCHAR(500) NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `book_mark` BOOLEAN NOT NULL DEFAULT false,

    INDEX `idx_post_user_id`(`user_id`),
    INDEX `idx_post_year_month`(`year`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `userPhoto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `url` VARCHAR(300) NOT NULL,

    UNIQUE INDEX `uq_userPhoto_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `userSelectedEmotion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `emotion_id` INTEGER NOT NULL,
    `is_saved` BOOLEAN NOT NULL DEFAULT false,
    `percentage` DECIMAL(5, 2) NOT NULL,

    INDEX `idx_use_emotion_id`(`emotion_id`),
    INDEX `idx_use_post_id`(`post_id`),
    UNIQUE INDEX `uq_use_post_emotion`(`post_id`, `emotion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `aiAnalysis` ADD CONSTRAINT `fk_aiAnalysis_post` FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aiAnalyzedEmotion` ADD CONSTRAINT `fk_aie_analysis` FOREIGN KEY (`analysis_id`) REFERENCES `aiAnalysis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aiAnalyzedEmotion` ADD CONSTRAINT `fk_aie_emotion` FOREIGN KEY (`emotion_id`) REFERENCES `emotion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oneLine` ADD CONSTRAINT `fk_oneLine_post` FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `photo` ADD CONSTRAINT `fk_photo_post` FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post` ADD CONSTRAINT `fk_post_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userPhoto` ADD CONSTRAINT `fk_userPhoto_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userSelectedEmotion` ADD CONSTRAINT `fk_use_emotion` FOREIGN KEY (`emotion_id`) REFERENCES `emotion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userSelectedEmotion` ADD CONSTRAINT `fk_use_post` FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
