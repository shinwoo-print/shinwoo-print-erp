import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST!,
  port: Number(process.env.DATABASE_PORT!),
  user: process.env.DATABASE_USER!,
  password: process.env.DATABASE_PASSWORD!,
  database: process.env.DATABASE_NAME!,
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.companyInfo.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      companyName: "신우씨링",
      representative: "남정숙",
      address: "부산광역시 중구 대청로 95-2",
      phone: "",
      businessNumber: "602-36-62290",
      businessType: "제조업",
      businessItem: "라벨/스티커 인쇄",
    },
  });

  const options = [
    { category: "PRINT_TYPE", label: "로터리", value: "로터리", sortOrder: 1 },
    { category: "PRINT_TYPE", label: "디지털", value: "디지털", sortOrder: 2 },
    { category: "PRINT_TYPE", label: "평압", value: "평압", sortOrder: 3 },
    { category: "PRINT_TYPE", label: "플렉소", value: "플렉소", sortOrder: 4 },
    { category: "PRINT_TYPE", label: "외주", value: "외주", sortOrder: 5 },
    { category: "MATERIAL", label: "합성지", value: "합성지", sortOrder: 1 },
    { category: "MATERIAL", label: "유포지", value: "유포지", sortOrder: 2 },
    { category: "MATERIAL", label: "WB", value: "WB", sortOrder: 3 },
    { category: "MATERIAL", label: "그라신지", value: "그라신지", sortOrder: 4 },
    { category: "LAMI", label: "투명", value: "투명", sortOrder: 1 },
    { category: "LAMI", label: "무광", value: "무광", sortOrder: 2 },
    { category: "LAMI", label: "유광", value: "유광", sortOrder: 3 },
    { category: "FOIL", label: "금박", value: "금박", sortOrder: 1 },
    { category: "FOIL", label: "은박", value: "은박", sortOrder: 2 },
    { category: "FOIL", label: "청박", value: "청박", sortOrder: 3 },
    { category: "FOIL", label: "적박", value: "적박", sortOrder: 4 },
    { category: "ESTIMATE_STAGE", label: "1차제안", value: "1차제안", sortOrder: 1 },
    { category: "ESTIMATE_STAGE", label: "2차제안", value: "2차제안", sortOrder: 2 },
    { category: "ESTIMATE_STAGE", label: "LOST", value: "LOST", sortOrder: 3 },
    { category: "ESTIMATE_STAGE", label: "계약체결", value: "계약체결", sortOrder: 4 },
    { category: "CUTTING", label: "롤", value: "롤", sortOrder: 1 },
    { category: "CUTTING", label: "시트", value: "시트", sortOrder: 2 },
    { category: "SHAPE", label: "원형", value: "원형", sortOrder: 1 },
    { category: "SHAPE", label: "사각", value: "사각", sortOrder: 2 },
    { category: "SHAPE", label: "타원", value: "타원", sortOrder: 3 },
    { category: "PACKAGING", label: "비닐", value: "비닐", sortOrder: 1 },
    { category: "PACKAGING", label: "박스", value: "박스", sortOrder: 2 },
    { category: "DELIVERY", label: "직송", value: "직송", sortOrder: 1 },
    { category: "DELIVERY", label: "택배", value: "택배", sortOrder: 2 },
    { category: "COURIER", label: "CJ대한통운", value: "CJ", sortOrder: 1 },
    { category: "COURIER", label: "경동택배", value: "경동", sortOrder: 2 },
    { category: "COURIER", label: "우체국택배", value: "우체국", sortOrder: 3 },
    { category: "DATA_TYPE", label: "기존", value: "기존", sortOrder: 1 },
    { category: "DATA_TYPE", label: "수정", value: "수정", sortOrder: 2 },
    { category: "DATA_TYPE", label: "신규", value: "신규", sortOrder: 3 },
    { category: "ROLL_DIR", label: "위", value: "위", sortOrder: 1 },
    { category: "ROLL_DIR", label: "아래", value: "아래", sortOrder: 2 },
    { category: "ROLL_DIR", label: "좌", value: "좌", sortOrder: 3 },
    { category: "ROLL_DIR", label: "우", value: "우", sortOrder: 4 },
    { category: "UNIT", label: "매", value: "매", sortOrder: 1 },
    { category: "UNIT", label: "롤", value: "롤", sortOrder: 2 },
    { category: "UNIT", label: "장", value: "장", sortOrder: 3 },
    { category: "UNIT", label: "EA", value: "EA", sortOrder: 4 },
    { category: "DESIGN_STATUS", label: "폐기", value: "폐기", sortOrder: 1 },
    { category: "DESIGN_STATUS", label: "보유", value: "보유", sortOrder: 2 },
  ];

  for (const opt of options) {
    await prisma.systemOption.upsert({
      where: {
        category_value: {
          category: opt.category,
          value: opt.value,
        },
      },
      update: { label: opt.label, sortOrder: opt.sortOrder },
      create: opt,
    });
  }

  console.log("Seed completed");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
