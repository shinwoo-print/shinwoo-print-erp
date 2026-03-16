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
  // 타이틀
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
  // 수신자 + 공급자
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
  // 공급자 박스
  supplierBox: {
    width: 240,
    border: `1pt solid ${COLORS.black}`,
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
    borderBottom: `0.5pt solid ${COLORS.veryLightGray}`,
    minHeight: 16,
  },
  supplierLabel: {
    width: 75,
    fontSize: 7.5,
    backgroundColor: "#F2F2F2",
    padding: 3,
    borderRight: `0.5pt solid ${COLORS.veryLightGray}`,
  },
  supplierValue: {
    flex: 1,
    fontSize: 7.5,
    padding: 3,
  },
  // 테이블
  table: {
    marginTop: 10,
    border: `1pt solid ${COLORS.black}`,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: COLORS.blue,
    minHeight: 22,
  },
  tableRow: {
    flexDirection: "row",
    borderTop: `0.5pt solid ${COLORS.veryLightGray}`,
    minHeight: 20,
  },
  tableRowAlt: {
    backgroundColor: "#F8F9FA",
  },
  tableTotalRow: {
    flexDirection: "row",
    borderTop: `1pt solid ${COLORS.black}`,
    minHeight: 22,
    backgroundColor: "#FFF3CD",
  },
  tableGrandTotalRow: {
    flexDirection: "row",
    borderTop: `1pt solid ${COLORS.black}`,
    minHeight: 24,
    backgroundColor: "#D4EDDA",
  },
  // 테이블 셀 헤더
  thCell: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
    padding: 4,
    borderRight: `0.5pt solid rgba(255,255,255,0.3)`,
    justifyContent: "center",
  },
  // 테이블 셀 일반
  tdCell: {
    fontSize: 7.5,
    padding: 4,
    borderRight: `0.5pt solid ${COLORS.veryLightGray}`,
    justifyContent: "center",
  },
  tdCellRight: {
    textAlign: "right",
  },
  tdCellCenter: {
    textAlign: "center",
  },
  // 컬럼 폭
  colNo: { width: 25 },
  colName: { width: 130 },
  colSpec: { width: 70 },
  colQty: { width: 55 },
  colUnitPrice: { width: 65 },
  colSupply: { width: 75 },
  colVat: { width: 60 },
  colNote: { width: 55 },
  // 하단 섹션
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
  // 직인
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

/* ────────── 테이블 셀 헬퍼 ────────── */
function Th({ children, style }: { children: string; style?: object }) {
  return (
    <View style={[s.thCell, style]}>
      <Text>{children}</Text>
    </View>
  );
}

function Td({
  children,
  style,
  align,
}: {
  children: string;
  style?: object;
  align?: "right" | "center";
}) {
  return (
    <View
      style={[
        s.tdCell,
        align === "right" && s.tdCellRight,
        align === "center" && s.tdCellCenter,
        style,
      ]}
    >
      <Text>{children}</Text>
    </View>
  );
}

/* ────────── Document ────────── */
export function EstimatePdfDocument({ data }: { data: EstimatePdfData }) {
  const recipientDisplay =
    data.recipientText ||
    `${data.clientCompanyName} ${data.clientContactName || ""} 귀 하`.trim();

  const totalSupply = Number(data.totalSupplyAmount) || 0;
  const totalVat = Number(data.totalVat) || 0;
  const totalAmount = Number(data.totalAmount) || 0;

  return (
    <Document title={`견적서_${data.estimateNumber}`} author="신우씨링">
      <Page size="A4" style={s.page}>
        {/* ═══ 타이틀 ═══ */}
        <View style={s.titleRow}>
          <Text style={s.title}>견 적 서</Text>
          <Text style={s.dateText}>{formatDateKorean(data.estimateDate)}</Text>
        </View>

        {/* ═══ 수신자 + 공급자 ═══ */}
        <View style={s.infoRow}>
          {/* 좌측: 수신자 */}
          <View style={s.recipientCol}>
            <Text style={s.recipientText}>{recipientDisplay}</Text>
            <Text style={s.greetingText}>하기와 같이 견적 합니다.</Text>
            <Text style={s.validText}>
              * 유효기간은 견적일로부터 {data.validDays}일입니다.
            </Text>
          </View>

          {/* 우측: 공급자 */}
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
            <View style={[s.supplierRow, { borderBottom: "none" }]}>
              <Text style={s.supplierLabel}>TEL / FAX</Text>
              <Text style={s.supplierValue}>
                {data.company.phone} / {data.company.fax || ""}
              </Text>
            </View>
          </View>
        </View>

        {/* ═══ 품목 테이블 ═══ */}
        <View style={s.table}>
          {/* 헤더 */}
          <View style={s.tableHeaderRow}>
            <Th style={s.colNo}>No</Th>
            <Th style={s.colName}>품명</Th>
            <Th style={s.colSpec}>규격(mm)</Th>
            <Th style={s.colQty}>발주수량</Th>
            <Th style={s.colUnitPrice}>단가(원)</Th>
            <Th style={s.colSupply}>공급가액</Th>
            <Th style={s.colVat}>세액</Th>
            <Th style={[s.colNote, { borderRight: "none" }]}>비고</Th>
          </View>

          {/* 데이터 행 */}
          {data.items.map((item, idx) => (
            <View
              key={idx}
              style={[s.tableRow, idx % 2 === 1 && s.tableRowAlt]}
            >
              <Td style={s.colNo} align="center">
                {String(idx + 1)}
              </Td>
              <Td style={s.colName}>{item.productName}</Td>
              <Td style={s.colSpec} align="center">
                {item.spec || ""}
              </Td>
              <Td style={s.colQty} align="right">
                {item.quantityText || formatNumber(item.quantity)}
              </Td>
              <Td style={s.colUnitPrice} align="right">
                {item.unitPriceText || formatNumber(item.unitPrice)}
              </Td>
              <Td style={s.colSupply} align="right">
                {formatNumber(item.supplyAmount)}
              </Td>
              <Td style={s.colVat} align="right">
                {formatNumber(item.vat)}
              </Td>
              <Td style={[s.colNote, { borderRight: "none" }]}>
                {item.note || ""}
              </Td>
            </View>
          ))}

          {/* 빈 행 채우기 (최소 8행) */}
          {data.items.length < 8 &&
            Array.from({ length: 8 - data.items.length }).map((_, idx) => (
              <View
                key={`empty-${idx}`}
                style={[
                  s.tableRow,
                  (data.items.length + idx) % 2 === 1 && s.tableRowAlt,
                ]}
              >
                <Td style={s.colNo} align="center">
                  {""}
                </Td>
                <Td style={s.colName}>{""}</Td>
                <Td style={s.colSpec}>{""}</Td>
                <Td style={s.colQty}>{""}</Td>
                <Td style={s.colUnitPrice}>{""}</Td>
                <Td style={s.colSupply}>{""}</Td>
                <Td style={s.colVat}>{""}</Td>
                <Td style={[s.colNote, { borderRight: "none" }]}>{""}</Td>
              </View>
            ))}

          {/* 합계금액 행 */}
          <View style={s.tableTotalRow}>
            <Td style={[s.colNo, { fontWeight: "bold" }]} align="center">
              {""}
            </Td>
            <View
              style={[
                s.tdCell,
                {
                  width: 200,
                  fontWeight: "bold",
                  justifyContent: "center",
                },
              ]}
            >
              <Text style={{ fontWeight: "bold", fontSize: 8 }}>합계금액</Text>
            </View>
            <Td style={s.colSpec}>{""}</Td>
            <Td style={s.colQty}>{""}</Td>
            <Td style={s.colUnitPrice}>{""}</Td>
            <Td style={s.colSupply} align="right">
              {formatNumber(totalSupply)}
            </Td>
            <Td style={s.colVat} align="right">
              {formatNumber(totalVat)}
            </Td>
            <Td style={[s.colNote, { borderRight: "none" }]}>{""}</Td>
          </View>

          {/* 총합계금액(VAT포함) 행 */}
          <View style={s.tableGrandTotalRow}>
            <View
              style={[
                s.tdCell,
                {
                  width: 260,
                  fontWeight: "bold",
                  justifyContent: "center",
                },
              ]}
            >
              <Text style={{ fontWeight: "bold", fontSize: 9 }}>
                총합계금액(VAT포함)
              </Text>
            </View>
            <View style={[s.tdCell, { flex: 1, borderRight: "none" }]}>
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 11,
                  textAlign: "right",
                }}
              >
                {formatNumber(totalAmount)} 원
              </Text>
            </View>
          </View>
        </View>

        {/* ═══ 특이사항 ═══ */}
        <View style={s.footerSection}>
          <Text style={s.footerNoteTitle}>특이사항</Text>
          <Text style={s.footerNoteText}>
            {
              "※ 예상 입고일정은 시안확정 후 평일 기준 5~7일 정도 소요됩니다. 또한 택배사의 사정에 따라 배송 지연이 발생할 수 있습니다\n(긴급주문건의 경우 별도로 일정 관련 견적 담당자에게 별도로 문의 연락 부탁드립니다)"
            }
          </Text>
          <Text style={[s.footerNoteText, { marginTop: 4 }]}>
            {
              "※ 세금계산서 발행시 사업자등록증 사본(발행메일기재)을 함께 보내주시기 바랍니다."
            }
          </Text>
        </View>

        {/* ═══ 입금계좌 ═══ */}
        <View style={s.bankInfoRow}>
          <Text style={s.bankLabel}>입금계좌정보:</Text>
          <Text style={s.bankValue}>
            {data.bank.bankName} {data.bank.accountNumber} / 예금주:{" "}
            {data.bank.accountHolder}
          </Text>
        </View>

        {/* ═══ 견적 담당자 ═══ */}
        <View style={s.managerRow}>
          <Text style={s.managerLabel}>견적 담당자</Text>
          <Text style={s.managerValue}>
            박성진 실장 010-3583-6312 shinwoo6536@hanmail.net
          </Text>
        </View>

        {/* ═══ 직인 ═══ */}
        {data.company.sealUrl && (
          <View style={s.sealContainer}>
            <Image src={data.company.sealUrl} style={s.sealImage} />
          </View>
        )}
      </Page>
    </Document>
  );
}
