import { z } from "zod";

export const bankAccountSchema = z.object({
  bankName: z.string().min(1, "은행명은 필수입니다").max(30),
  accountNumber: z.string().min(1, "계좌번호는 필수입니다").max(50),
  accountHolder: z.string().min(1, "예금주는 필수입니다").max(50),
  memo: z.string().max(200).optional().or(z.literal("")),
  isDefault: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export type BankAccountFormValues = z.infer<typeof bankAccountSchema>;
