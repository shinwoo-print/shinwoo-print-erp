import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "dotenv/config";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT) || 3306,
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "shinwoo_erp",
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

// 랜덤 유틸
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randDate(startStr: string, endStr: string): Date {
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  return new Date(start + Math.random() * (end - start));
}
function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

const STAGES = ["1차제안", "2차제안", "최종제안", "확정", "보류"];
const UNITS = ["EA", "롤", "박스", "매"];
const ESTIMATE_COUNT = 30;
const TRANSACTION_COUNT = 30;

async function main() {
  const clients = await prisma.client.findMany({
    where: { isActive: true },
    select: { id: true, companyName: true },
  });
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, productName: true, spec: true },
  });
  const bank = await prisma.bankAccount.findFirst({
    where: { isDefault: true },
  });

  if (clients.length < 5 || products.length < 5 || !bank) {
    console.error("거래처 5건 이상 + 품목 5건 이상 + 기본계좌 필요");
    process.exit(1);
  }

  // 기존 더미 삭제 (note로 구분)
  const delEst = await prisma.estimate.deleteMany({
    where: { note: { contains: "시연용" } },
  });
  const delTx = await prisma.transaction.deleteMany({
    where: { note: { contains: "시연용" } },
  });
  console.log(`기존 더미 삭제: 견적서 ${delEst.count}건 / 거래명세서 ${delTx.count}건\n`);

  // ===== 견적서 30건 =====
  console.log(`=== 견적서 ${ESTIMATE_COUNT}건 생성 ===`);
  for (let i = 0; i < ESTIMATE_COUNT; i++) {
    const client = pick(clients);
    const date = randDate("2026-01-01", "2026-03-17");
    const dateStr = toDateStr(date).replace(/-/g, "").slice(2);

    // 유니크 번호: 거래처-YYMMDD-밀리초끝4자리
    const uid = String(Date.now()).slice(-4) + String(i).padStart(2, "0");
    const estimateNumber = `${client.companyName}-${dateStr}-${uid}`;

    const itemCount = randInt(1, 5);
    const items = Array.from({ length: itemCount }, (_, idx) => {
      const prod = pick(products);
      const qty = randInt(500, 30000);
      const price = randInt(10, 150);
      const supplyAmount = qty * price;
      const vat = Math.round(supplyAmount * 0.1);
      return {
        productId: prod.id,
        productName: prod.productName,
        spec: prod.spec || "",
        quantity: qty,
        unitPrice: price,
        supplyAmount,
        vat,
        note: "",
        sortOrder: idx,
      };
    });

    const totalSupply = items.reduce((s, it) => s + it.supplyAmount, 0);
    const totalVat = items.reduce((s, it) => s + it.vat, 0);

    await prisma.estimate.create({
      data: {
        estimateNumber,
        estimateDate: date,
        clientId: client.id,
        clientContactName: "담당자",
        recipientText: `${client.companyName} 귀 하`,
        stage: pick(STAGES),
        validDays: pick([7, 10, 14, 30]),
        totalSupplyAmount: totalSupply,
        totalVat: totalVat,
        totalAmount: totalSupply + totalVat,
        note: "시연용 더미 데이터",
        items: { create: items },
      },
    });
    console.log(`  [${i + 1}/${ESTIMATE_COUNT}] ${estimateNumber}`);
  }

  // ===== 거래명세서 30건 =====
  console.log(`\n=== 거래명세서 ${TRANSACTION_COUNT}건 생성 ===`);
  for (let i = 0; i < TRANSACTION_COUNT; i++) {
    const client = pick(clients);
    const date = randDate("2026-01-01", "2026-03-17");
    const dateStr = toDateStr(date).replace(/-/g, "").slice(2);

    const uid = String(Date.now()).slice(-4) + String(i).padStart(2, "0");
    const transactionNumber = `${client.companyName}-${dateStr}-${uid}`;

    const itemCount = randInt(1, 6);
    const items = Array.from({ length: itemCount }, (_, idx) => {
      const prod = pick(products);
      const qty = randInt(500, 30000);
      const price = randInt(10, 150);
      const supplyAmount = qty * price;
      const vat = Math.round(supplyAmount * 0.1);
      const itemDate = new Date(date);
      itemDate.setDate(itemDate.getDate() - randInt(0, 3));
      return {
        productId: prod.id,
        itemDate,
        productName: prod.productName,
        spec: prod.spec || "",
        quantity: qty,
        unit: pick(UNITS),
        unitPrice: price,
        supplyAmount,
        vat,
        sortOrder: idx,
      };
    });

    const totalQuantity = items.reduce((s, it) => s + it.quantity, 0);
    const totalSupply = items.reduce((s, it) => s + it.supplyAmount, 0);
    const totalVat = items.reduce((s, it) => s + it.vat, 0);

    await prisma.transaction.create({
      data: {
        transactionNumber,
        transactionDate: date,
        clientId: client.id,
        bankAccountId: bank.id,
        totalQuantity,
        totalSupplyAmount: totalSupply,
        totalVat: totalVat,
        totalAmount: totalSupply + totalVat,
        note: "시연용 더미 데이터",
        items: { create: items },
      },
    });
    console.log(`  [${i + 1}/${TRANSACTION_COUNT}] ${transactionNumber}`);
  }

  console.log(`\n=== 완료! 견적서 ${ESTIMATE_COUNT}건 + 거래명세서 ${TRANSACTION_COUNT}건 ===`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
