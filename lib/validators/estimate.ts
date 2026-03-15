// lib/validators/estimate.ts
import { z } from "zod";

const estimateItemSchema = z.object({
  productId: z.union([z.number(), z.null()]).optional().default(null),
  productName: z.string().min(1, "품목명은 필수입니다").max(200),
  spec: z.string().max(100).optional().or(z.literal("")),
  quantity: z.union([z.number(), z.string()]).transform((v) => {
    const n = Number(v);
    return isNaN(n) || n < 0 ? 0 : n;
  }),
  unitPrice: z.string().optional().or(z.literal("")),
  supplyAmount: z.string().optional().or(z.literal("")),
  note: z.string().max(200).optional().or(z.literal("")),
  sortOrder: z.number().optional().default(0),
});

export const estimateFormSchema = z.object({
  clientId: z
    .number({ error: "거래처는 필수입니다" })
    .min(1, "거래처를 선택하세요"),
  estimateDate: z.string().min(1, "견적일은 필수입니다"),
  clientContactName: z.string().max(50).optional().or(z.literal("")),
  stage: z.string().max(30).optional().default("1차제안"),
  validDays: z.union([z.number(), z.string()]).transform((v) => {
    const n = Number(v);
    return isNaN(n) || n < 1 ? 10 : n;
  }),
  note: z.string().optional().or(z.literal("")),
  items: z.array(estimateItemSchema).min(1, "최소 1개의 품목을 추가하세요"),
});

export type EstimateFormValues = z.infer<typeof estimateFormSchema>;
export type EstimateItemFormValues = z.infer<typeof estimateItemSchema>;
