import { formatNumber } from "@/lib/pdf/format-utils";
import { COLORS, FONT_FAMILY } from "@/lib/pdf/pdf-styles";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

/* ────────── 타입 ────────── */
interface TransactionItemData {
  itemDate: string;
  productName: string;
  spec: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: string;
  supplyAmount: string;
  vat: string;
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

interface ClientData {
  companyName: string;
  contactName: string | null;
  phone: string | null;
  fax: string | null;
  address: string | null;
  businessNumber: string | null;
  businessType: string | null;
  businessItem: string | null;
}

interface BankData {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface TransactionPdfData {
  transactionNumber: string;
  transactionDate: string;
  totalQuantity: number;
  totalSupplyAmount: string;
  totalVat: string;
  totalAmount: string;
  note: string | null;
  items: TransactionItemData[];
  company: CompanyData;
  client: ClientData;
  bank: BankData;
}

/* ────────── 상수: 1매 크기 ────────── */
// 19cm × 13cm -> pt 변환 (1cm = 28.3465pt)
const SLIP_WIDTH = 538.65; // 19cm
const SLIP_HEIGHT = 122.0; // A4(841.89pt)를 3등분하면 약 280pt이지만 여백/점선 고려
// A4: 595.28 × 841.89pt
// 상하 마진 각 15pt = 30pt -> 사용가능 높이 = 811.89pt
// 3매 + 점선2개(각 0.5pt) = 811.89 / 3 = 약 270.6pt
const COPY_HEIGHT = 265;
const PAGE_TOP = 12;
const PAGE_LEFT = 28;
const DASH_MARGIN = 5;

const COPY_LABELS = ["공급자 보관용", "공급받는자 보관용", "확인용"] as const;

/* ────────── 스타일 ────────── */
const s = StyleSheet.create({
  page: {
    fontFamily: FONT_FAMILY,
    fontSize: 6.5,
    color: COLORS.black,
    padding: 0,
  },
  // 1매 슬립
  slip: {
    width: SLIP_WIDTH,
    height: COPY_HEIGHT,
    marginLeft: PAGE_LEFT,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  // 점선 구분
  dashLine: {
    width: SLIP_WIDTH,
    marginLeft: PAGE_LEFT,
    borderBottom: "0.5pt dashed #999999",
    marginVertical: DASH_MARGIN,
  },
  // 상단 타이틀 행
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
  },
  copyLabel: {
    fontSize: 7,
    color: COLORS.gray,
    border: `0.5pt solid ${COLORS.gray}`,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  // 공급자 / 공급받는자 정보 2열
  infoRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 5,
  },
  infoBox: {
    flex: 1,
    border: `0.5pt solid ${COLORS.black}`,
  },
  infoBoxTitle: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    padding: 2,
    backgroundColor: "#E8E8E8",
    borderBottom: `0.5pt solid ${COLORS.black}`,
  },
  infoFieldRow: {
    flexDirection: "row",
    borderBottom: `0.5pt solid ${COLORS.veryLightGray}`,
    minHeight: 13,
  },
  infoLabel: {
    width: 50,
    fontSize: 6,
    padding: 2,
    backgroundColor: "#F5F5F5",
    borderRight: `0.5pt solid ${COLORS.veryLightGray}`,
  },
  infoValue: {
    flex: 1,
    fontSize: 6,
    padding: 2,
  },
  // 품목 테이블
  table: {
    border: `0.5pt solid ${COLORS.black}`,
    marginBottom: 4,
  },
  tHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#D9E2F3",
    minHeight: 14,
  },
  tRow: {
    flexDirection: "row",
    borderTop: `0.5pt solid ${COLORS.veryLightGray}`,
    minHeight: 12,
  },
  tTotalRow: {
    flexDirection: "row",
    borderTop: `0.5pt solid ${COLORS.black}`,
    minHeight: 14,
    backgroundColor: "#FFF3CD",
  },
  thCell: {
    fontSize: 6,
    fontWeight: "bold",
    textAlign: "center",
    padding: 2,
    borderRight: `0.5pt solid ${COLORS.veryLightGray}`,
    justifyContent: "center",
  },
  tdCell: {
    fontSize: 6,
    padding: 2,
    borderRight: `0.5pt solid ${COLORS.veryLightGray}`,
    justifyContent: "center",
  },
  // 컬럼 폭
  colDate: { width: 46 },
  colName: { width: 110 },
  colSpec: { width: 56 },
  colQty: { width: 36 },
  colUnit: { width: 26 },
  colUnitPrice: { width: 52 },
  colSupply: { width: 62 },
  colVat: { width: 52 },
  // 합계 레이블
  totalLabel: {
    width: 238,
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    padding: 2,
    borderRight: `0.5pt solid ${COLORS.veryLightGray}`,
    justifyContent: "center",
  },
  // 하단: 계좌 + 직인
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  bankText: {
    fontSize: 6.5,
  },
  sealImage: {
    width: 35,
    height: 35,
  },
});

/* ────────── 셀 컴포넌트 ────────── */
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
        align === "right" && { textAlign: "right" },
        align === "center" && { textAlign: "center" },
        style,
      ]}
    >
      <Text>{children}</Text>
    </View>
  );
}

/* ────────── 1매 슬립 컴포넌트 ────────── */
function TransactionSlip({
  data,
  copyIndex,
}: {
  data: TransactionPdfData;
  copyIndex: number;
}) {
  const totalSupply = Number(data.totalSupplyAmount) || 0;
  const totalVat = Number(data.totalVat) || 0;
  const totalAmount = Number(data.totalAmount) || 0;

  // 최대 표시 아이템 수 (공간 제한)
  const MAX_ITEMS = 6;
  const displayItems = data.items.slice(0, MAX_ITEMS);

  // 일자 포맷 (MM/DD)
  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <View style={s.slip}>
      {/* 타이틀 */}
      <View style={s.headerRow}>
        <Text style={s.title}>거래명세서</Text>
        <Text style={{ fontSize: 7, color: COLORS.gray }}>
          {data.transactionNumber}
        </Text>
        <Text style={s.copyLabel}>{COPY_LABELS[copyIndex]}</Text>
      </View>

      {/* 공급자 / 공급받는자 */}
      <View style={s.infoRow}>
        {/* 공급자 */}
        <View style={s.infoBox}>
          <Text style={s.infoBoxTitle}>공급자</Text>
          <View style={s.infoFieldRow}>
            <Text style={s.infoLabel}>사업자번호</Text>
            <Text style={s.infoValue}>{data.company.businessNumber}</Text>
          </View>
          <View style={s.infoFieldRow}>
            <Text style={s.infoLabel}>상호</Text>
            <Text style={s.infoValue}>{data.company.companyName}</Text>
          </View>
          <View style={s.infoFieldRow}>
            <Text style={s.infoLabel}>성명</Text>
            <Text style={s.infoValue}>{data.company.representative}</Text>
          </View>
          <View style={s.infoFieldRow}>
            <Text style={s.infoLabel}>주소</Text>
            <Text style={s.infoValue}>{data.company.address}</Text>
          </View>
          <View style={[s.infoFieldRow, { borderBottom: "none" }]}>
            <Text style={s.infoLabel}>TEL / FAX</Text>
            <Text style={s.infoValue}>
              {data.company.phone} / {data.company.fax || ""}
            </Text>
          </View>
        </View>

        {/* 공급받는자 */}
        <View style={s.infoBox}>
          <Text style={s.infoBoxTitle}>공급받는자</Text>
          <View style={s.infoFieldRow}>
            <Text style={s.infoLabel}>사업자번호</Text>
            <Text style={s.infoValue}>{data.client.businessNumber || ""}</Text>
          </View>
          <View style={s.infoFieldRow}>
            <Text style={s.infoLabel}>상호</Text>
            <Text style={s.infoValue}>{data.client.companyName}</Text>
          </View>
          <View style={s.infoFieldRow}>
            <Text style={s.infoLabel}>성명</Text>
            <Text style={s.infoValue}>{data.client.contactName || ""}</Text>
          </View>
          <View style={s.infoFieldRow}>
            <Text style={s.infoLabel}>주소</Text>
            <Text style={s.infoValue}>{data.client.address || ""}</Text>
          </View>
          <View style={[s.infoFieldRow, { borderBottom: "none" }]}>
            <Text style={s.infoLabel}>TEL / FAX</Text>
            <Text style={s.infoValue}>
              {data.client.phone || ""} / {data.client.fax || ""}
            </Text>
          </View>
        </View>
      </View>

      {/* 품목 테이블 */}
      <View style={s.table}>
        {/* 헤더 */}
        <View style={s.tHeaderRow}>
          <Th style={s.colDate}>일자</Th>
          <Th style={s.colName}>품명</Th>
          <Th style={s.colSpec}>규격</Th>
          <Th style={s.colQty}>수량</Th>
          <Th style={s.colUnit}>단위</Th>
          <Th style={s.colUnitPrice}>단가</Th>
          <Th style={s.colSupply}>공급가액</Th>
          <Th style={[s.colVat, { borderRight: "none" }]}>부가세</Th>
        </View>

        {/* 데이터 행 */}
        {displayItems.map((item, idx) => (
          <View key={idx} style={s.tRow}>
            <Td style={s.colDate} align="center">
              {formatShortDate(item.itemDate)}
            </Td>
            <Td style={s.colName}>{item.productName}</Td>
            <Td style={s.colSpec} align="center">
              {item.spec || ""}
            </Td>
            <Td style={s.colQty} align="right">
              {formatNumber(item.quantity)}
            </Td>
            <Td style={s.colUnit} align="center">
              {item.unit || "EA"}
            </Td>
            <Td style={s.colUnitPrice} align="right">
              {formatNumber(item.unitPrice)}
            </Td>
            <Td style={s.colSupply} align="right">
              {formatNumber(item.supplyAmount)}
            </Td>
            <Td style={[s.colVat, { borderRight: "none" }]} align="right">
              {formatNumber(item.vat)}
            </Td>
          </View>
        ))}

        {/* 빈 행 채우기 (최소 6행) */}
        {displayItems.length < MAX_ITEMS &&
          Array.from({ length: MAX_ITEMS - displayItems.length }).map(
            (_, idx) => (
              <View key={`empty-${idx}`} style={s.tRow}>
                <Td style={s.colDate}>{""}</Td>
                <Td style={s.colName}>{""}</Td>
                <Td style={s.colSpec}>{""}</Td>
                <Td style={s.colQty}>{""}</Td>
                <Td style={s.colUnit}>{""}</Td>
                <Td style={s.colUnitPrice}>{""}</Td>
                <Td style={s.colSupply}>{""}</Td>
                <Td style={[s.colVat, { borderRight: "none" }]}>{""}</Td>
              </View>
            ),
          )}

        {/* 합계 행 */}
        <View style={s.tTotalRow}>
          <View style={s.totalLabel}>
            <Text>합 계</Text>
          </View>
          <Td style={s.colQty} align="right">
            {formatNumber(data.totalQuantity)}
          </Td>
          <Td style={s.colUnit}>{""}</Td>
          <Td style={s.colUnitPrice}>{""}</Td>
          <Td style={s.colSupply} align="right">
            {formatNumber(totalSupply)}
          </Td>
          <Td style={[s.colVat, { borderRight: "none" }]} align="right">
            {formatNumber(totalVat)}
          </Td>
        </View>
      </View>

      {/* 하단: 합계금액 + 계좌 + 직인 */}
      <View style={s.footerRow}>
        <View>
          <Text style={{ fontSize: 7, fontWeight: "bold", marginBottom: 2 }}>
            합계금액: {formatNumber(totalAmount)}원
          </Text>
          <Text style={s.bankText}>
            입금계좌: {data.bank.bankName} {data.bank.accountNumber} (예금주:{" "}
            {data.bank.accountHolder})
          </Text>
        </View>
        {data.company.sealUrl && (
          <Image src={data.company.sealUrl} style={s.sealImage} />
        )}
      </View>
    </View>
  );
}

/* ────────── Document ────────── */
export function TransactionPdfDocument({ data }: { data: TransactionPdfData }) {
  return (
    <Document title={`거래명세서_${data.transactionNumber}`} author="신우씨링">
      <Page size="A4" style={s.page}>
        <View style={{ paddingTop: PAGE_TOP }}>
          {/* 1매: 공급자 보관용 */}
          <TransactionSlip data={data} copyIndex={0} />
          <View style={s.dashLine} />

          {/* 2매: 공급받는자 보관용 */}
          <TransactionSlip data={data} copyIndex={1} />
          <View style={s.dashLine} />

          {/* 3매: 확인용 */}
          <TransactionSlip data={data} copyIndex={2} />
        </View>
      </Page>
    </Document>
  );
}
