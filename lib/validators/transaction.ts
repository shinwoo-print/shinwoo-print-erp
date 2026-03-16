import { z } from "zod";

const transactionItemSchema = z.object({
  itemDate: z.string().min(1, "일자는 필수입니다"),
  productId: z.number().optional(),
  productName: z.string().min(1, "품명은 필수입니다").max(200),
  spec: z.string().max(100).optional().or(z.literal("")),
  quantity: z.union([z.number(), z.string()]).transform((v) => {
    const n = Number(v);
    return isNaN(n) || n < 0 ? 0 : n;
  }),
  unit: z.string().max(20).optional().or(z.literal("")),
  unitPrice: z.union([z.number(), z.string()]).transform((v) => {
    const n = Number(v);
    return isNaN(n) || n < 0 ? 0 : n;
  }),
  supplyAmount: z.union([z.number(), z.string()]).transform((v) => {
    const n = Number(v);
    return isNaN(n) || n < 0 ? 0 : n;
  }),
  vat: z.union([z.number(), z.string()]).transform((v) => {
    const n = Number(v);
    return isNaN(n) || n < 0 ? 0 : n;
  }),
  sortOrder: z.number().optional().default(0),
});

export const transactionFormSchema = z.object({
  transactionDate: z.string().min(1, "거래일은 필수입니다"),
  clientId: z
    .number({ error: "거래처는 필수입니다" })
    .min(1, "거래처를 선택하세요"),
  bankAccountId: z.number().optional(),
  note: z.string().optional().or(z.literal("")),
  items: z.array(transactionItemSchema).min(1, "최소 1개의 품목을 추가하세요"),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
export type TransactionItemFormValues = z.infer<typeof transactionItemSchema>;
