import { z } from "zod";

const orderItemSchema = z.object({
  productId: z.union([z.number(), z.null()]).optional().default(null),
  productName: z
    .string()
    .min(1, "품목명은 필수입니다")
    .max(200, "품목명은 200자 이내로 입력하세요"),
  printType: z.string().max(50).optional().or(z.literal("")),
  printPrice: z.string().optional().or(z.literal("")),
  sheets: z
    .union([z.number(), z.null(), z.string()])
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || val === "") return null;
      const n = Number(val);
      if (isNaN(n)) return null;
      return n < 0 ? 0 : n;
    }),
  sheetsPerRoll: z
    .union([z.number(), z.null(), z.string()])
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || val === "") return null;
      const n = Number(val);
      if (isNaN(n)) return null;
      return n < 0 ? 0 : n;
    }),
  unitPrice: z.string().optional().or(z.literal("")),
  supplyAmount: z.string().optional().or(z.literal("")),
  material: z.string().max(50).optional().or(z.literal("")),
  materialWidth: z.string().optional().or(z.literal("")),
  perforation: z.boolean().optional().default(false),
  sizeWidth: z.string().optional().or(z.literal("")),
  sizeHeight: z.string().optional().or(z.literal("")),
  shape: z.string().max(20).optional().or(z.literal("")),
  okkuri: z.string().optional().or(z.literal("")),
  lamination: z.string().max(20).optional().or(z.literal("")),
  foil: z.string().max(20).optional().or(z.literal("")),
  cuttingMethod: z.string().max(20).optional().or(z.literal("")),
  cuttingType: z.string().max(20).optional().or(z.literal("")),
  sheetsPerSheet: z.string().max(30).optional().or(z.literal("")),
  labelGap: z.string().optional().or(z.literal("")),
  dieCutter: z.string().max(20).optional().or(z.literal("")),
  resinPlate: z.string().max(20).optional().or(z.literal("")),
  rollDirection: z.string().max(10).optional().or(z.literal("")),
  slit: z.boolean().optional().default(false),
  dataType: z.string().max(20).optional().or(z.literal("")),
  lastDataDate: z.string().optional().or(z.literal("")),
  designFileStatus: z.string().max(20).optional().or(z.literal("")),
  designImageUrl: z.string().max(500).optional().or(z.literal("")),
  sortOrder: z.number().optional().default(0),
});

export const orderFormSchema = z.object({
  clientId: z
    .number({ error: "거래처는 필수입니다" })
    .min(1, "거래처를 선택하세요"),
  orderDate: z.string().min(1, "발주일은 필수입니다"),
  dueDate: z.string().optional().or(z.literal("")),
  orderer: z.string().max(50).optional().or(z.literal("")),
  status: z.string().max(20).optional().default("DRAFT"),
  packagingType: z.string().max(20).optional().or(z.literal("")),
  deliveryType: z.string().max(20).optional().or(z.literal("")),
  courierType: z.string().max(20).optional().or(z.literal("")),
  deliveryAddress: z.string().max(200).optional().or(z.literal("")),
  receiverName: z.string().max(50).optional().or(z.literal("")),
  receiverPhone: z.string().max(30).optional().or(z.literal("")),
  note: z.string().optional().or(z.literal("")),
  items: z.array(orderItemSchema).min(1, "최소 1개의 품목을 추가하세요"),
  worker: z.string().max(50).optional().or(z.literal("")),
  clientContact: z.string().max(50).optional().or(z.literal("")),
  clientPhone: z.string().max(30).optional().or(z.literal("")),
  deliveryMethod: z.string().max(20).optional().or(z.literal("")),
  deliveryRegion: z.string().max(50).optional().or(z.literal("")),
  photoInspection: z.boolean().optional().default(false),
  sampleShipping: z.boolean().optional().default(false),
  tightRoll: z.boolean().optional().default(false),
});

export type OrderFormValues = z.infer<typeof orderFormSchema>;
export type OrderItemFormValues = z.infer<typeof orderItemSchema>;
