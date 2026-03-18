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
  sealUrl: string | null;
}

interface BankData {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface EstimatePdfData {
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

/* ────────── 스타일 ────────── */
const s = StyleSheet.create({
  page: {
    fontFamily: FONT_FAMILY,
    fontSize: 8,
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
    fontSize: 8,
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
    fontSize: 7.5,
    backgroundColor: "#F2F2F2",
    padding: 3,
    borderRight: "0.5pt solid #E5E5E5",
  },
  supplierValue: {
    flex: 1,
    fontSize: 7.5,
    padding: 3,
  },
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

  /* 헤더 셀 - 컬럼별 */
  thNo: {
    width: 25,
    fontSize: 7.5,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
    padding: 4,
    borderRight: "0.5pt solid rgba(255,255,255,0.3)",
    justifyContent: "center",
  },
  thName: {
    width: 130,
    fontSize: 7.5,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
    padding: 4,
    borderRight: "0.5pt solid rgba(255,255,255,0.3)",
    justifyContent: "center",
  },
  thSpec: {
    width: 70,
    fontSize: 7.5,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
    padding: 4,
    borderRight: "0.5pt solid rgba(255,255,255,0.3)",
    justifyContent: "center",
  },
  thQty: {
    width: 55,
    fontSize: 7.5,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
    padding: 4,
    borderRight: "0.5pt solid rgba(255,255,255,0.3)",
    justifyContent: "center",
  },
  thUnitPrice: {
    width: 65,
    fontSize: 7.5,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
    padding: 4,
    borderRight: "0.5pt solid rgba(255,255,255,0.3)",
    justifyContent: "center",
  },
  thSupply: {
    width: 75,
    fontSize: 7.5,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
    padding: 4,
    borderRight: "0.5pt solid rgba(255,255,255,0.3)",
    justifyContent: "center",
  },
  thVat: {
    width: 60,
    fontSize: 7.5,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
    padding: 4,
    borderRight: "0.5pt solid rgba(255,255,255,0.3)",
    justifyContent: "center",
  },
  thNoteLast: {
    width: 55,
    fontSize: 7.5,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
    padding: 4,
    justifyContent: "center",
  },

  /* 데이터 셀 - 컬럼별 */
  tdNo: {
    width: 25,
    fontSize: 7.5,
    padding: 4,
    textAlign: "center",
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdName: {
    width: 130,
    fontSize: 7.5,
    padding: 4,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdSpec: {
    width: 70,
    fontSize: 7.5,
    padding: 4,
    textAlign: "center",
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdQty: {
    width: 55,
    fontSize: 7.5,
    padding: 4,
    textAlign: "right",
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdUnitPrice: {
    width: 65,
    fontSize: 7.5,
    padding: 4,
    textAlign: "right",
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdSupply: {
    width: 75,
    fontSize: 7.5,
    padding: 4,
    textAlign: "right",
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdVat: {
    width: 60,
    fontSize: 7.5,
    padding: 4,
    textAlign: "right",
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdNoteLast: {
    width: 55,
    fontSize: 7.5,
    padding: 4,
    justifyContent: "center",
  },

  /* 빈 셀 */
  tdNoEmpty: {
    width: 25,
    fontSize: 7.5,
    padding: 4,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdNameEmpty: {
    width: 130,
    fontSize: 7.5,
    padding: 4,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdSpecEmpty: {
    width: 70,
    fontSize: 7.5,
    padding: 4,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdQtyEmpty: {
    width: 55,
    fontSize: 7.5,
    padding: 4,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdUnitPriceEmpty: {
    width: 65,
    fontSize: 7.5,
    padding: 4,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdSupplyEmpty: {
    width: 75,
    fontSize: 7.5,
    padding: 4,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdVatEmpty: {
    width: 60,
    fontSize: 7.5,
    padding: 4,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdNoteLastEmpty: {
    width: 55,
    fontSize: 7.5,
    padding: 4,
    justifyContent: "center",
  },

  /* 합계행 특수 셀 */
  totalNoBold: {
    width: 25,
    fontSize: 7.5,
    fontWeight: "bold",
    padding: 4,
    textAlign: "center",
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  totalLabelCell: {
    width: 200,
    fontSize: 8,
    fontWeight: "bold",
    padding: 4,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  grandTotalLabelCell: {
    width: 260,
    fontSize: 9,
    fontWeight: "bold",
    padding: 4,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  grandTotalValueCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: "bold",
    padding: 4,
    textAlign: "right",
    justifyContent: "center",
  },

  footerSection: {
    marginTop: 14,
  },
  footerNoteTitle: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 3,
    color: COLORS.darkGray,
  },
  footerNoteText: {
    fontSize: 7,
    lineHeight: 1.5,
    color: COLORS.darkGray,
  },
  footerNoteTextMt: {
    fontSize: 7,
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
    fontSize: 8,
    fontWeight: "bold",
    marginRight: 6,
  },
  bankValue: {
    fontSize: 8,
  },
  managerRow: {
    marginTop: 8,
    padding: 6,
    backgroundColor: "#F5F5F5",
    borderRadius: 3,
  },
  managerLabel: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 2,
  },
  managerValue: {
    fontSize: 8,
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

  return (
    <Document title={"견적서_" + data.estimateNumber} author="신우씨링">
      <Page size="A4" style={s.page}>
        {/* 타이틀 */}
        <View style={s.titleRow}>
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
            <View style={s.thNoteLast}>
              <Text>비고</Text>
            </View>
          </View>

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
              <View style={s.tdNoteLast}>
                <Text>{item.note || ""}</Text>
              </View>
            </View>
          ))}

          {data.items.length < 8 &&
            Array.from({ length: 8 - data.items.length }).map((_, idx) => (
              <View
                key={"e" + idx}
                style={
                  (data.items.length + idx) % 2 === 1
                    ? s.tableRowAlt
                    : s.tableRow
                }
              >
                <View style={s.tdNoEmpty}>
                  <Text>{""}</Text>
                </View>
                <View style={s.tdNameEmpty}>
                  <Text>{""}</Text>
                </View>
                <View style={s.tdSpecEmpty}>
                  <Text>{""}</Text>
                </View>
                <View style={s.tdQtyEmpty}>
                  <Text>{""}</Text>
                </View>
                <View style={s.tdUnitPriceEmpty}>
                  <Text>{""}</Text>
                </View>
                <View style={s.tdSupplyEmpty}>
                  <Text>{""}</Text>
                </View>
                <View style={s.tdVatEmpty}>
                  <Text>{""}</Text>
                </View>
                <View style={s.tdNoteLastEmpty}>
                  <Text>{""}</Text>
                </View>
              </View>
            ))}

          {/* 합계 행 */}
          <View style={s.tableTotalRow}>
            <View style={s.totalNoBold}>
              <Text>{""}</Text>
            </View>
            <View style={s.totalLabelCell}>
              <Text>합계금액</Text>
            </View>
            <View style={s.tdSpecEmpty}>
              <Text>{""}</Text>
            </View>
            <View style={s.tdQtyEmpty}>
              <Text>{""}</Text>
            </View>
            <View style={s.tdUnitPriceEmpty}>
              <Text>{""}</Text>
            </View>
            <View style={s.tdSupply}>
              <Text>{formatNumber(totalSupply)}</Text>
            </View>
            <View style={s.tdVat}>
              <Text>{formatNumber(totalVat)}</Text>
            </View>
            <View style={s.tdNoteLastEmpty}>
              <Text>{""}</Text>
            </View>
          </View>

          {/* 총합계 행 */}
          <View style={s.tableGrandTotalRow}>
            <View style={s.grandTotalLabelCell}>
              <Text>총합계금액(VAT포함)</Text>
            </View>
            <View style={s.grandTotalValueCell}>
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

        {/* 견적 담당자 */}
        <View style={s.managerRow}>
          <Text style={s.managerLabel}>견적 담당자</Text>
          <Text style={s.managerValue}>
            박성진 실장 010-3583-6312 shinwoo6536@hanmail.net
          </Text>
        </View>

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
