import { z } from "zod";

export const companyInfoSchema = z.object({
  companyName: z.string().min(1, "회사명은 필수입니다").max(100),
  representative: z.string().min(1, "대표자는 필수입니다").max(50),
  address: z.string().min(1, "주소는 필수입니다").max(200),
  phone: z.string().min(1, "연락처는 필수입니다").max(30),
  fax: z.string().max(30).optional().or(z.literal("")),
  businessNumber: z.string().min(1, "사업자번호는 필수입니다").max(20),
  businessType: z.string().max(50).optional().or(z.literal("")),
  businessItem: z.string().max(50).optional().or(z.literal("")),
  logoUrl: z.string().max(500).optional().or(z.literal("")),
  sealUrl: z.string().max(500).optional().or(z.literal("")),
});

export type CompanyInfoFormValues = z.infer<typeof companyInfoSchema>;
