import { z } from "zod";

export const clientFormSchema = z.object({
  companyName: z
    .string()
    .min(1, "업체명은 필수입니다.")
    .max(100, "업체명은 100자 이내로 입력하세요."),
  clientType: z
    .enum(["매입", "매출", "매입매출"], {
      error: "거래 구분을 선택하세요.",
    }),
  representative: z
    .string()
    .max(50, "대표자명은 50자 이내로 입력하세요.")
    .optional()
    .or(z.literal("")),
  contactName: z
    .string()
    .max(50, "담당자명은 50자 이내로 입력하세요.")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(30, "연락처는 30자 이내로 입력하세요.")
    .optional()
    .or(z.literal("")),
  fax: z
    .string()
    .max(30, "팩스는 30자 이내로 입력하세요.")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .max(100, "이메일은 100자 이내로 입력하세요.")
    .email("올바른 이메일 형식이 아닙니다.")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(200, "주소는 200자 이내로 입력하세요.")
    .optional()
    .or(z.literal("")),
  businessNumber: z
    .string()
    .max(20, "사업자번호는 20자 이내로 입력하세요.")
    .optional()
    .or(z.literal("")),
  businessType: z
    .string()
    .max(50, "업태는 50자 이내로 입력하세요.")
    .optional()
    .or(z.literal("")),
  businessItem: z
    .string()
    .max(50, "종목은 50자 이내로 입력하세요.")
    .optional()
    .or(z.literal("")),
  memo: z.string().optional().or(z.literal("")),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;
