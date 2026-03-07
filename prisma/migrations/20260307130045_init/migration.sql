-- CreateTable
CREATE TABLE `company_info` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `companyName` VARCHAR(100) NOT NULL,
    `representative` VARCHAR(50) NOT NULL,
    `address` VARCHAR(200) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `fax` VARCHAR(30) NULL,
    `businessNumber` VARCHAR(20) NOT NULL,
    `businessType` VARCHAR(50) NULL,
    `businessItem` VARCHAR(50) NULL,
    `logoUrl` VARCHAR(500) NULL,
    `sealUrl` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bankName` VARCHAR(30) NOT NULL,
    `accountNumber` VARCHAR(50) NOT NULL,
    `accountHolder` VARCHAR(50) NOT NULL,
    `memo` VARCHAR(200) NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_options` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category` VARCHAR(50) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `value` VARCHAR(100) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `system_options_category_isActive_idx`(`category`, `isActive`),
    UNIQUE INDEX `system_options_category_value_key`(`category`, `value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clients` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `companyName` VARCHAR(100) NOT NULL,
    `contactName` VARCHAR(50) NULL,
    `phone` VARCHAR(30) NULL,
    `fax` VARCHAR(30) NULL,
    `email` VARCHAR(100) NULL,
    `address` VARCHAR(200) NULL,
    `businessNumber` VARCHAR(20) NULL,
    `businessType` VARCHAR(50) NULL,
    `businessItem` VARCHAR(50) NULL,
    `memo` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `clients_companyName_idx`(`companyName`),
    INDEX `clients_contactName_idx`(`contactName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productName` VARCHAR(200) NOT NULL,
    `spec` VARCHAR(100) NULL,
    `printType` VARCHAR(50) NULL,
    `material` VARCHAR(50) NULL,
    `unitPrice` DECIMAL(12, 0) NULL,
    `memo` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `products_productName_idx`(`productName`),
    INDEX `products_spec_idx`(`spec`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderNumber` VARCHAR(20) NOT NULL,
    `clientId` INTEGER NOT NULL,
    `orderDate` DATE NOT NULL,
    `dueDate` DATE NULL,
    `orderer` VARCHAR(50) NULL,
    `packagingType` VARCHAR(20) NULL,
    `deliveryType` VARCHAR(20) NULL,
    `courierType` VARCHAR(20) NULL,
    `deliveryAddress` VARCHAR(200) NULL,
    `receiverName` VARCHAR(50) NULL,
    `receiverPhone` VARCHAR(30) NULL,
    `note` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_orderNumber_key`(`orderNumber`),
    INDEX `orders_clientId_idx`(`clientId`),
    INDEX `orders_orderDate_idx`(`orderDate`),
    INDEX `orders_dueDate_idx`(`dueDate`),
    INDEX `orders_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `productId` INTEGER NULL,
    `productName` VARCHAR(200) NOT NULL,
    `printType` VARCHAR(50) NULL,
    `printPrice` DECIMAL(12, 0) NULL,
    `sheets` INTEGER NULL,
    `sheetsPerRoll` INTEGER NULL,
    `unitPrice` DECIMAL(12, 0) NULL,
    `material` VARCHAR(50) NULL,
    `materialWidth` DECIMAL(6, 1) NULL,
    `perforation` BOOLEAN NOT NULL DEFAULT false,
    `sizeWidth` DECIMAL(6, 1) NULL,
    `sizeHeight` DECIMAL(6, 1) NULL,
    `shape` VARCHAR(20) NULL,
    `okkuri` DECIMAL(6, 1) NULL,
    `lamination` VARCHAR(20) NULL,
    `foil` VARCHAR(20) NULL,
    `cuttingMethod` VARCHAR(20) NULL,
    `rollDirection` VARCHAR(10) NULL,
    `slit` BOOLEAN NOT NULL DEFAULT false,
    `dataType` VARCHAR(20) NULL,
    `lastDataDate` DATE NULL,
    `designFileStatus` VARCHAR(20) NULL,
    `designImageUrl` VARCHAR(500) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `order_items_orderId_idx`(`orderId`),
    INDEX `order_items_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estimates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `estimateNumber` VARCHAR(20) NOT NULL,
    `estimateDate` DATE NOT NULL,
    `clientId` INTEGER NOT NULL,
    `clientContactName` VARCHAR(50) NULL,
    `stage` VARCHAR(30) NOT NULL DEFAULT '1차제안',
    `totalSupplyAmount` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `estimates_estimateNumber_key`(`estimateNumber`),
    INDEX `estimates_clientId_idx`(`clientId`),
    INDEX `estimates_estimateDate_idx`(`estimateDate`),
    INDEX `estimates_stage_idx`(`stage`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estimate_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `estimateId` INTEGER NOT NULL,
    `productId` INTEGER NULL,
    `productName` VARCHAR(200) NOT NULL,
    `spec` VARCHAR(100) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `unitPrice` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `supplyAmount` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `note` VARCHAR(200) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `estimate_items_estimateId_idx`(`estimateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionNumber` VARCHAR(20) NOT NULL,
    `clientId` INTEGER NOT NULL,
    `bankAccountId` INTEGER NULL,
    `totalQuantity` INTEGER NOT NULL DEFAULT 0,
    `totalSupplyAmount` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `totalVat` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `totalAmount` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `transactions_transactionNumber_key`(`transactionNumber`),
    INDEX `transactions_clientId_idx`(`clientId`),
    INDEX `transactions_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaction_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionId` INTEGER NOT NULL,
    `productId` INTEGER NULL,
    `itemDate` DATE NOT NULL,
    `productName` VARCHAR(200) NOT NULL,
    `spec` VARCHAR(100) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `unit` VARCHAR(20) NULL,
    `unitPrice` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `supplyAmount` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `vat` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `transaction_items_transactionId_idx`(`transactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `year` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `orderReceivedDate` DATE NULL,
    `clientId` INTEGER NOT NULL,
    `printType` VARCHAR(50) NULL,
    `productName` VARCHAR(200) NULL,
    `sheets` INTEGER NULL,
    `unitPrice` DECIMAL(12, 0) NULL,
    `supplyAmount` DECIMAL(12, 0) NULL,
    `taxIncludedAmount` DECIMAL(12, 0) NULL,
    `requestedDueDate` DATE NULL,
    `transactionDate` DATE NULL,
    `taxInvoiceDate` DATE NULL,
    `paymentDate` DATE NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `sales_records_clientId_idx`(`clientId`),
    INDEX `sales_records_year_month_idx`(`year`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales_targets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `year` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `targetAmount` DECIMAL(12, 0) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sales_targets_year_month_key`(`year`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `file_uploads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fileName` VARCHAR(200) NOT NULL,
    `fileUrl` VARCHAR(500) NOT NULL,
    `fileSize` INTEGER NULL,
    `mimeType` VARCHAR(50) NULL,
    `entityType` VARCHAR(30) NOT NULL,
    `entityId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `file_uploads_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estimates` ADD CONSTRAINT `estimates_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estimate_items` ADD CONSTRAINT `estimate_items_estimateId_fkey` FOREIGN KEY (`estimateId`) REFERENCES `estimates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estimate_items` ADD CONSTRAINT `estimate_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_bankAccountId_fkey` FOREIGN KEY (`bankAccountId`) REFERENCES `bank_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction_items` ADD CONSTRAINT `transaction_items_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction_items` ADD CONSTRAINT `transaction_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_records` ADD CONSTRAINT `sales_records_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
