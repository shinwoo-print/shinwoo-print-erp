// lib/utils/generate-number.ts
import { prisma } from "@/lib/prisma";

/**
 * 문서번호 생성: 거래처명-YYMMDD-01
 * 같은 날 같은 거래처 2건째 -> -02
 */
async function generateDocNumber(
  clientName: string,
  model: "order" | "estimate" | "transaction"
): Promise<string> {
  const kstNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
  const yy = String(kstNow.getFullYear()).slice(2);
  const mm = String(kstNow.getMonth() + 1).padStart(2, "0");
  const dd = String(kstNow.getDate()).padStart(2, "0");
  const dateStr = `${yy}${mm}${dd}`;
  const base = `${clientName}-${dateStr}-`;

  let lastNumber: string | null = null;

  if (model === "order") {
    const last = await prisma.order.findFirst({
      where: { orderNumber: { startsWith: base } },
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    });
    lastNumber = last?.orderNumber ?? null;
  } else if (model === "estimate") {
    const last = await prisma.estimate.findFirst({
      where: { estimateNumber: { startsWith: base } },
      orderBy: { estimateNumber: "desc" },
      select: { estimateNumber: true },
    });
    lastNumber = last?.estimateNumber ?? null;
  } else {
    const last = await prisma.transaction.findFirst({
      where: { transactionNumber: { startsWith: base } },
      orderBy: { transactionNumber: "desc" },
      select: { transactionNumber: true },
    });
    lastNumber = last?.transactionNumber ?? null;
  }

  let seq = 1;
  if (lastNumber) {
    const lastSeq = parseInt(lastNumber.split("-").pop() || "0", 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${base}${String(seq).padStart(2, "0")}`;
}

export async function generateOrderNumber(clientName: string) {
  return generateDocNumber(clientName, "order");
}
export async function generateEstimateNumber(clientName: string) {
  return generateDocNumber(clientName, "estimate");
}
export async function generateTransactionNumber(clientName: string) {
  return generateDocNumber(clientName, "transaction");
}
