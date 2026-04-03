-- AlterTable
ALTER TABLE `clients` ADD COLUMN `clientType` VARCHAR(10) NOT NULL DEFAULT '매출',
    ADD COLUMN `representative` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `company_info` ADD COLUMN `passwordHash` VARCHAR(200) NULL;

-- AlterTable
ALTER TABLE `estimates` ADD COLUMN `managerEmail` VARCHAR(100) NULL,
    ADD COLUMN `managerId` INTEGER NULL,
    ADD COLUMN `managerName` VARCHAR(50) NULL,
    ADD COLUMN `managerPhone` VARCHAR(30) NULL,
    ADD COLUMN `managerTitle` VARCHAR(50) NULL;

-- CreateTable
CREATE TABLE `estimate_managers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `title` VARCHAR(50) NULL,
    `phone` VARCHAR(30) NULL,
    `email` VARCHAR(100) NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `clients_clientType_idx` ON `clients`(`clientType`);
