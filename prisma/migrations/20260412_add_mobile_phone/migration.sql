-- AlterTable: Add mobilePhone to clients
ALTER TABLE `clients` ADD COLUMN `mobilePhone` VARCHAR(30) NULL AFTER `phone`;
