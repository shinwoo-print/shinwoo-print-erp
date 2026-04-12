import { formatDateKorean, formatNumber } from "@/lib/pdf/format-utils";
import { COLORS, FONT_FAMILY, PAGE_PADDING } from "@/lib/pdf/pdf-styles";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

/* ────────── 타입 ────────── */
interface EstimateItemData {
  productName: string;
  spec: string | null;
  quantity: number;
  quantityText: string | null;
  unitPrice: string;
  unitPriceText: string | null;
  supplyAmount: string;
  vat: string;
  note: string | null;
}

interface CompanyData {
  companyName: string;
  representative: string;
  address: string;
  phone: string;
  fax: string | null;
  businessNumber: string;
  businessType: string | null;
  businessItem: string | null;
  logoUrl: string | null;
  sealUrl: string | null;
}

interface BankData {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface EstimatePdfData {
  manager: {
    name: string;
    title: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  estimateNumber: string;
  estimateDate: string;
  clientCompanyName: string;
  clientContactName: string | null;
  recipientText: string | null;
  validDays: number;
  totalSupplyAmount: string;
  totalVat: string;
  totalAmount: string;
  note: string | null;
  items: EstimateItemData[];
  company: CompanyData;
  bank: BankData;
}

/* ────────── 컬럼 폭 상수 ────────── */
const COL = {
  no: 25,
  name: 130,
  spec: 70,
  qty: 55,
  unitPrice: 65,
  supply: 75,
  vat: 60,
  note: 55,
};

// 합계행: No + Name + Spec + Qty + UnitPrice = 345
const TOTAL_LABEL_WIDTH =
  COL.no + COL.name + COL.spec + COL.qty + COL.unitPrice;
// 총합계행: 위 + Supply + Vat = 480
const GRAND_TOTAL_LABEL_WIDTH = TOTAL_LABEL_WIDTH + COL.supply + COL.vat;

/* ────────── 공통 셀 베이스 ────────── */
const cellBase = {
  fontSize: 8.5,
  padding: 4,
  justifyContent: "center" as const,
};

const thBase = {
  ...cellBase,
  fontWeight: "bold" as const,
  color: COLORS.white,
  textAlign: "center" as const,
};

const borderR = { borderRight: "0.5pt solid #E5E5E5" };
const borderRWhite = { borderRight: "0.5pt solid rgba(255,255,255,0.3)" };

/* ────────── 스타일 ────────── */
const s = StyleSheet.create({
  page: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    padding: PAGE_PADDING,
    paddingTop: 40,
    color: COLORS.black,
  },
  titleRow: {
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 8,
  },
  dateText: {
    fontSize: 10,
    marginTop: 6,
    textAlign: "center",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  recipientCol: {
    flex: 1,
    paddingRight: 20,
  },
  recipientText: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
  },
  greetingText: {
    fontSize: 9,
    marginBottom: 4,
  },
  validText: {
    fontSize: 9,
    color: COLORS.red,
  },
  supplierBox: {
    width: 240,
    border: "1pt solid #000000",
    padding: 0,
  },
  supplierTitle: {
    backgroundColor: COLORS.blue,
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    padding: 4,
  },
  supplierRow: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #E5E5E5",
    minHeight: 16,
  },
  supplierRowLast: {
    flexDirection: "row",
    minHeight: 16,
  },
  supplierLabel: {
    width: 75,
    fontSize: 8.5,
    backgroundColor: "#F2F2F2",
    padding: 3,
    borderRight: "0.5pt solid #E5E5E5",
  },
  supplierValue: {
    flex: 1,
    fontSize: 8.5,
    padding: 3,
  },

  /* ── 테이블 ── */
  table: {
    marginTop: 10,
    border: "1pt solid #000000",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: COLORS.blue,
    minHeight: 22,
  },
  tableRow: {
    flexDirection: "row",
    borderTop: "0.5pt solid #E5E5E5",
    minHeight: 20,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderTop: "0.5pt solid #E5E5E5",
    minHeight: 20,
    backgroundColor: "#F8F9FA",
  },
  tableTotalRow: {
    flexDirection: "row",
    borderTop: "1pt solid #000000",
    minHeight: 22,
    backgroundColor: "#FFF3CD",
  },
  tableGrandTotalRow: {
    flexDirection: "row",
    borderTop: "1pt solid #000000",
    minHeight: 24,
    backgroundColor: "#D4EDDA",
  },

  /* ── 헤더 셀 ── */
  thNo: { ...thBase, width: COL.no, ...borderRWhite },
  thName: { ...thBase, width: COL.name, ...borderRWhite },
  thSpec: { ...thBase, width: COL.spec, ...borderRWhite },
  thQty: { ...thBase, width: COL.qty, ...borderRWhite },
  thUnitPrice: { ...thBase, width: COL.unitPrice, ...borderRWhite },
  thSupply: { ...thBase, width: COL.supply, ...borderRWhite },
  thVat: { ...thBase, width: COL.vat, ...borderRWhite },
  thNote: { ...thBase, width: COL.note },

  /* ── 데이터 셀 ── */
  tdNo: { ...cellBase, width: COL.no, textAlign: "center", ...borderR },
  tdName: { ...cellBase, width: COL.name, ...borderR },
  tdSpec: { ...cellBase, width: COL.spec, textAlign: "center", ...borderR },
  tdQty: { ...cellBase, width: COL.qty, textAlign: "right", ...borderR },
  tdUnitPrice: {
    ...cellBase,
    width: COL.unitPrice,
    textAlign: "right",
    ...borderR,
  },
  tdSupply: { ...cellBase, width: COL.supply, textAlign: "right", ...borderR },
  tdVat: { ...cellBase, width: COL.vat, textAlign: "right", ...borderR },
  tdNote: { ...cellBase, width: COL.note },

  /* ── 합계행 셀 (노란 배경 통일) ── */
  totalLabel: {
    ...cellBase,
    width: TOTAL_LABEL_WIDTH,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    borderRight: "0.5pt solid #E5E5E5",
  },
  totalSupply: {
    ...cellBase,
    width: COL.supply,
    fontWeight: "bold",
    textAlign: "right",
    borderRight: "0.5pt solid #E5E5E5",
  },
  totalVat: {
    ...cellBase,
    width: COL.vat,
    fontWeight: "bold",
    textAlign: "right",
    borderRight: "0.5pt solid #E5E5E5",
  },
  totalNote: {
    ...cellBase,
    width: COL.note,
  },

  /* ── 총합계행 셀 (초록 배경 통일) ── */
  grandTotalLabel: {
    ...cellBase,
    width: GRAND_TOTAL_LABEL_WIDTH - 40,
    fontSize: 9,
    fontWeight: "bold",
    borderRight: "0.5pt solid #E5E5E5",
  },
  grandTotalValue: {
    ...cellBase,
    width: COL.note + 40,
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "right",
  },

  /* ── 하단 ── */
  footerSection: {
    marginTop: 14,
  },
  footerNoteTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 3,
    color: COLORS.darkGray,
  },
  footerNoteText: {
    fontSize: 8,
    lineHeight: 1.5,
    color: COLORS.darkGray,
  },
  footerNoteTextMt: {
    fontSize: 8,
    lineHeight: 1.5,
    color: COLORS.darkGray,
    marginTop: 4,
  },
  bankInfoRow: {
    flexDirection: "row",
    marginTop: 10,
    padding: 6,
    backgroundColor: "#E8F4FD",
    borderRadius: 3,
  },
  bankLabel: {
    fontSize: 9,
    fontWeight: "bold",
    marginRight: 6,
  },
  bankValue: {
    fontSize: 9,
  },
  managerRow: {
    marginTop: 8,
    padding: 6,
    backgroundColor: "#F5F5F5",
    borderRadius: 3,
  },
  managerLabel: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 2,
  },
  managerValue: {
    fontSize: 9,
  },
  sealContainer: {
    position: "absolute",
    bottom: 80,
    right: 40,
    width: 70,
    height: 70,
  },
  sealImage: {
    width: 70,
    height: 70,
  },
});

/* ────────── Document ────────── */
export function EstimatePdfDocument({ data }: { data: EstimatePdfData }) {
  const recipientDisplay =
    data.recipientText ||
    (
      data.clientCompanyName +
      " " +
      (data.clientContactName || "") +
      " 귀 하"
    ).trim();

  const totalSupply = Number(data.totalSupplyAmount) || 0;
  const totalVat = Number(data.totalVat) || 0;
  const totalAmount = Number(data.totalAmount) || 0;

  const MIN_ROWS = 8;
  const emptyCount =
    data.items.length < MIN_ROWS ? MIN_ROWS - data.items.length : 0;

  return (
    <Document title={"견적서_" + data.estimateNumber} author="신우씨링">
      <Page size="A4" style={s.page}>
        {/* 타이틀 */}
        <View style={s.titleRow}>
          {data.company.logoUrl && (
            <Image
              src={data.company.logoUrl}
              style={{ width: 80, height: 30, marginBottom: 4, objectFit: "contain" as const }}
            />
          )}
          <Text style={s.title}>견 적 서</Text>
          <Text style={s.dateText}>{formatDateKorean(data.estimateDate)}</Text>
        </View>

        {/* 수신자 + 공급자 */}
        <View style={s.infoRow}>
          <View style={s.recipientCol}>
            <Text style={s.recipientText}>{recipientDisplay}</Text>
            <Text style={s.greetingText}>하기와 같이 견적 합니다.</Text>
            <Text style={s.validText}>
              * 유효기간은 견적일로부터 {data.validDays}일입니다.
            </Text>
          </View>

          <View style={s.supplierBox}>
            <Text style={s.supplierTitle}>공 급 자</Text>
            <View style={s.supplierRow}>
              <Text style={s.supplierLabel}>사업자등록번호</Text>
              <Text style={s.supplierValue}>{data.company.businessNumber}</Text>
            </View>
            <View style={s.supplierRow}>
              <Text style={s.supplierLabel}>상호(법인명)</Text>
              <Text style={s.supplierValue}>{data.company.companyName}</Text>
            </View>
            <View style={s.supplierRow}>
              <Text style={s.supplierLabel}>성명(대표자)</Text>
              <Text style={s.supplierValue}>{data.company.representative}</Text>
            </View>
            <View style={s.supplierRow}>
              <Text style={s.supplierLabel}>주소</Text>
              <Text style={s.supplierValue}>{data.company.address}</Text>
            </View>
            <View style={s.supplierRow}>
              <Text style={s.supplierLabel}>업태 / 종목</Text>
              <Text style={s.supplierValue}>
                {data.company.businessType || ""} /{" "}
                {data.company.businessItem || ""}
              </Text>
            </View>
            <View style={s.supplierRowLast}>
              <Text style={s.supplierLabel}>TEL / FAX</Text>
              <Text style={s.supplierValue}>
                {data.company.phone} / {data.company.fax || ""}
              </Text>
            </View>
          </View>
        </View>

        {/* 품목 테이블 */}
        <View style={s.table}>
          {/* 헤더 */}
          <View style={s.tableHeaderRow}>
            <View style={s.thNo}>
              <Text>No</Text>
            </View>
            <View style={s.thName}>
              <Text>품명</Text>
            </View>
            <View style={s.thSpec}>
              <Text>규격(mm)</Text>
            </View>
            <View style={s.thQty}>
              <Text>발주수량</Text>
            </View>
            <View style={s.thUnitPrice}>
              <Text>단가(원)</Text>
            </View>
            <View style={s.thSupply}>
              <Text>공급가액</Text>
            </View>
            <View style={s.thVat}>
              <Text>세액</Text>
            </View>
            <View style={s.thNote}>
              <Text>비고</Text>
            </View>
          </View>

          {/* 데이터 행 */}
          {data.items.map((item, idx) => (
            <View key={idx} style={idx % 2 === 1 ? s.tableRowAlt : s.tableRow}>
              <View style={s.tdNo}>
                <Text>{String(idx + 1)}</Text>
              </View>
              <View style={s.tdName}>
                <Text>{item.productName}</Text>
              </View>
              <View style={s.tdSpec}>
                <Text>{item.spec || ""}</Text>
              </View>
              <View style={s.tdQty}>
                <Text>{item.quantityText || formatNumber(item.quantity)}</Text>
              </View>
              <View style={s.tdUnitPrice}>
                <Text>
                  {item.unitPriceText || formatNumber(item.unitPrice)}
                </Text>
              </View>
              <View style={s.tdSupply}>
                <Text>{formatNumber(item.supplyAmount)}</Text>
              </View>
              <View style={s.tdVat}>
                <Text>{formatNumber(item.vat)}</Text>
              </View>
              <View style={s.tdNote}>
                <Text>{item.note || ""}</Text>
              </View>
            </View>
          ))}

          {/* 빈 행 */}
          {Array.from({ length: emptyCount }).map((_, idx) => (
            <View
              key={"e" + idx}
              style={
                (data.items.length + idx) % 2 === 1 ? s.tableRowAlt : s.tableRow
              }
            >
              <View style={s.tdNo}>
                <Text>{""}</Text>
              </View>
              <View style={s.tdName}>
                <Text>{""}</Text>
              </View>
              <View style={s.tdSpec}>
                <Text>{""}</Text>
              </View>
              <View style={s.tdQty}>
                <Text>{""}</Text>
              </View>
              <View style={s.tdUnitPrice}>
                <Text>{""}</Text>
              </View>
              <View style={s.tdSupply}>
                <Text>{""}</Text>
              </View>
              <View style={s.tdVat}>
                <Text>{""}</Text>
              </View>
              <View style={s.tdNote}>
                <Text>{""}</Text>
              </View>
            </View>
          ))}

          {/* 합계 행 */}
          <View style={s.tableTotalRow}>
            <View style={s.totalLabel}>
              <Text>합 계 금 액</Text>
            </View>
            <View style={s.totalSupply}>
              <Text>{formatNumber(totalSupply)}</Text>
            </View>
            <View style={s.totalVat}>
              <Text>{formatNumber(totalVat)}</Text>
            </View>
            <View style={s.totalNote}>
              <Text>{""}</Text>
            </View>
          </View>

          {/* 총합계 행 */}
          <View style={s.tableGrandTotalRow}>
            <View style={s.grandTotalLabel}>
              <Text>총 합 계 금 액 (VAT 포함)</Text>
            </View>
            <View style={s.grandTotalValue}>
              <Text>{formatNumber(totalAmount)} 원</Text>
            </View>
          </View>
        </View>

        {/* 특이사항 */}
        <View style={s.footerSection}>
          <Text style={s.footerNoteTitle}>특이사항</Text>
          <Text style={s.footerNoteText}>
            {
              "※ 예상 입고일정은 시안확정 후 평일 기준 5~7일 정도 소요됩니다. 또한 택배사의 사정에 따라 배송 지연이 발생할 수 있습니다\n(긴급주문건의 경우 별도로 일정 관련 견적 담당자에게 별도로 문의 연락 부탁드립니다)"
            }
          </Text>
          <Text style={s.footerNoteTextMt}>
            {
              "※ 세금계산서 발행시 사업자등록증 사본(발행메일기재)을 함께 보내주시기 바랍니다."
            }
          </Text>
        </View>

        {/* 입금계좌 */}
        <View style={s.bankInfoRow}>
          <Text style={s.bankLabel}>입금계좌정보:</Text>
          <Text style={s.bankValue}>
            {data.bank.bankName} {data.bank.accountNumber} / 예금주:{" "}
            {data.bank.accountHolder}
          </Text>
        </View>

        {/* 견적 담당자 — 하드코딩 제거 → 동적 렌더링 */}
        {data.manager && (
          <View style={s.managerRow}>
            <Text style={s.managerLabel}>견적 담당자</Text>
            <Text style={s.managerValue}>
              {data.manager.name}
              {data.manager.title ? ` ${data.manager.title}` : ""}
              {data.manager.phone ? ` ${data.manager.phone}` : ""}
              {data.manager.email ? ` ${data.manager.email}` : ""}
            </Text>
          </View>
        )}

        {/* 직인 */}
        {data.company.sealUrl ? (
          <View style={s.sealContainer}>
            <Image src={data.company.sealUrl} style={s.sealImage} />
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
