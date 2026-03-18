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

/* ═══════════════ 타입 정의 ═══════════════ */

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

/* ═══════════════ 레이아웃 상수 ═══════════════ */

// A4: 595.28pt x 841.89pt
// 상하 여백 각 14pt = 28pt, 절취선 영역 2개 x 12pt = 24pt
// 사용 가능 높이: 841.89 - 28 - 24 = 789.89pt
// 1매 높이: 789.89 / 3 ≈ 263pt
const COPY_HEIGHT = 263;
const PAGE_MARGIN_TOP = 14;
const PAGE_MARGIN_LEFT = 28;
const SLIP_WIDTH = 538;
const DASH_AREA_HEIGHT = 12;
const MAX_ITEMS = 5;

const COPY_LABELS = ["공급자 보관용", "공급받는자 보관용", "확인용"] as const;

/* ═══════════════ 스타일 ═══════════════ */

const s = StyleSheet.create({
  page: {
    fontFamily: FONT_FAMILY,
    fontSize: 6.5,
    color: COLORS.black,
    padding: 0,
  },
  slip: {
    width: SLIP_WIDTH,
    height: COPY_HEIGHT,
    marginLeft: PAGE_MARGIN_LEFT,
    paddingHorizontal: 6,
    paddingTop: 5,
    paddingBottom: 3,
  },
  dashArea: {
    width: SLIP_WIDTH,
    marginLeft: PAGE_MARGIN_LEFT,
    height: DASH_AREA_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dashLineLeft: {
    flex: 1,
    borderBottom: "0.5pt dashed #AAAAAA",
  },
  dashScissor: {
    fontSize: 7,
    color: "#AAAAAA",
    marginHorizontal: 4,
  },
  dashLineRight: {
    flex: 1,
    borderBottom: "0.5pt dashed #AAAAAA",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    borderBottom: "1pt solid #000000",
    paddingBottom: 3,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: "bold",
  },
  transDate: {
    fontSize: 7,
    color: COLORS.darkGray,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  transNo: {
    fontSize: 6.5,
    color: COLORS.gray,
  },
  copyLabel: {
    fontSize: 6.5,
    color: COLORS.gray,
    border: "0.5pt solid #999999",
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  infoRow: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 4,
  },
  infoBox: {
    flex: 1,
    border: "0.5pt solid #000000",
  },
  infoBoxTitle: {
    fontSize: 6.5,
    fontWeight: "bold",
    textAlign: "center",
    padding: 1.5,
    backgroundColor: "#E8E8E8",
    borderBottom: "0.5pt solid #000000",
  },
  infoFieldRow: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #E5E5E5",
    minHeight: 11,
  },
  infoLabel: {
    width: 46,
    fontSize: 5.5,
    padding: 1.5,
    backgroundColor: "#F5F5F5",
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  infoValue: {
    flex: 1,
    fontSize: 5.5,
    padding: 1.5,
    justifyContent: "center",
  },
  table: {
    border: "0.5pt solid #000000",
    marginBottom: 3,
  },
  tHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#D9E2F3",
    minHeight: 12,
  },
  tRow: {
    flexDirection: "row",
    borderTop: "0.5pt solid #E5E5E5",
    minHeight: 11,
  },
  tTotalRow: {
    flexDirection: "row",
    borderTop: "0.5pt solid #000000",
    minHeight: 12,
    backgroundColor: "#FFF3CD",
  },
  thCell: {
    fontSize: 5.5,
    fontWeight: "bold",
    textAlign: "center",
    padding: 1.5,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdCell: {
    fontSize: 5.5,
    padding: 1.5,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  colDate: { width: 42 },
  colName: { width: 110 },
  colSpec: { width: 54 },
  colQty: { width: 34 },
  colUnit: { width: 24 },
  colUnitPrice: { width: 52 },
  colSupply: { width: 60 },
  colVat: { width: 50 },
  totalLabel: {
    width: 206,
    fontSize: 6.5,
    fontWeight: "bold",
    textAlign: "center",
    padding: 1.5,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerLeft: {
    flex: 1,
  },
  amountText: {
    fontSize: 7,
    fontWeight: "bold",
    marginBottom: 1,
  },
  bankText: {
    fontSize: 6,
    marginBottom: 1,
  },
  noteText: {
    fontSize: 5.5,
    color: COLORS.gray,
  },
  sealImage: {
    width: 32,
    height: 32,
  },
});

/* ═══════════════ 셀 컴포넌트 ═══════════════ */

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

/* ═══════════════ 절취선 컴포넌트 ═══════════════ */

function DashCutLine() {
  return (
    <View style={s.dashArea}>
      <View style={s.dashLineLeft} />
      <Text style={s.dashScissor}>- - -</Text>
      <View style={s.dashLineRight} />
    </View>
  );
}

/* ═══════════════ 1매 슬립 컴포넌트 ═══════════════ */

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

  const displayItems = data.items.slice(0, MAX_ITEMS);
  const emptyCount = MAX_ITEMS - displayItems.length;

  const fmtShort = (ds: string) => {
    if (!ds) return "";
    const d = new Date(ds);
    return (
      String(d.getMonth() + 1).padStart(2, "0") +
      "/" +
      String(d.getDate()).padStart(2, "0")
    );
  };

  const fmtDate = (ds: string) => {
    if (!ds) return "";
    const d = new Date(ds);
    return (
      d.getFullYear() +
      "." +
      String(d.getMonth() + 1).padStart(2, "0") +
      "." +
      String(d.getDate()).padStart(2, "0")
    );
  };

  return (
    <View style={s.slip}>
      {/* 타이틀 행 */}
      <View style={s.headerRow}>
        <View style={s.titleGroup}>
          <Text style={s.title}>거 래 명 세 서</Text>
          <Text style={s.transDate}>{fmtDate(data.transactionDate)}</Text>
        </View>
        <View style={s.headerRight}>
          <Text style={s.transNo}>No. {data.transactionNumber}</Text>
          <Text style={s.copyLabel}>{COPY_LABELS[copyIndex]}</Text>
        </View>
      </View>

      {/* 공급자 / 공급받는자 */}
      <View style={s.infoRow}>
        <View style={s.infoBox}>
          <Text style={s.infoBoxTitle}>공 급 자</Text>
          <View style={s.infoFieldRow}>
            <View style={s.infoLabel}>
              <Text>사업자번호</Text>
            </View>
            <View style={s.infoValue}>
              <Text>{data.company.businessNumber}</Text>
            </View>
          </View>
          <View style={s.infoFieldRow}>
            <View style={s.infoLabel}>
              <Text>상호(법인명)</Text>
            </View>
            <View style={s.infoValue}>
              <Text>{data.company.companyName}</Text>
            </View>
          </View>
          <View style={s.infoFieldRow}>
            <View style={s.infoLabel}>
              <Text>대표자</Text>
            </View>
            <View style={s.infoValue}>
              <Text>{data.company.representative}</Text>
            </View>
          </View>
          <View style={s.infoFieldRow}>
            <View style={s.infoLabel}>
              <Text>주소</Text>
            </View>
            <View style={s.infoValue}>
              <Text>{data.company.address}</Text>
            </View>
          </View>
          <View style={s.infoFieldRow}>
            <View style={s.infoLabel}>
              <Text>업태/종목</Text>
            </View>
            <View style={s.infoValue}>
              <Text>
                {data.company.businessType || ""} /{" "}
                {data.company.businessItem || ""}
              </Text>
            </View>
          </View>
          <View style={[s.infoFieldRow, { borderBottom: "none" }]}>
            <View style={s.infoLabel}>
              <Text>TEL / FAX</Text>
            </View>
            <View style={s.infoValue}>
              <Text>
                {data.company.phone} / {data.company.fax || ""}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.infoBox}>
          <Text style={s.infoBoxTitle}>공 급 받 는 자</Text>
          <View style={s.infoFieldRow}>
            <View style={s.infoLabel}>
              <Text>사업자번호</Text>
            </View>
            <View style={s.infoValue}>
              <Text>{data.client.businessNumber || ""}</Text>
            </View>
          </View>
          <View style={s.infoFieldRow}>
            <View style={s.infoLabel}>
              <Text>상호(법인명)</Text>
            </View>
            <View style={s.infoValue}>
              <Text>{data.client.companyName}</Text>
            </View>
          </View>
          <View style={s.infoFieldRow}>
            <View style={s.infoLabel}>
              <Text>성명</Text>
            </View>
            <View style={s.infoValue}>
              <Text>{data.client.contactName || ""}</Text>
            </View>
          </View>
          <View style={s.infoFieldRow}>
            <View style={s.infoLabel}>
              <Text>주소</Text>
            </View>
            <View style={s.infoValue}>
              <Text>{data.client.address || ""}</Text>
            </View>
          </View>
          <View style={s.infoFieldRow}>
            <View style={s.infoLabel}>
              <Text>업태/종목</Text>
            </View>
            <View style={s.infoValue}>
              <Text>
                {data.client.businessType || ""} /{" "}
                {data.client.businessItem || ""}
              </Text>
            </View>
          </View>
          <View style={[s.infoFieldRow, { borderBottom: "none" }]}>
            <View style={s.infoLabel}>
              <Text>TEL / FAX</Text>
            </View>
            <View style={s.infoValue}>
              <Text>
                {data.client.phone || ""} / {data.client.fax || ""}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 품목 테이블 */}
      <View style={s.table}>
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

        {displayItems.map((item, idx) => (
          <View key={idx} style={s.tRow}>
            <Td style={s.colDate} align="center">
              {fmtShort(item.itemDate)}
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

        {emptyCount > 0 &&
          Array.from({ length: emptyCount }).map((_, idx) => (
            <View key={"e" + idx} style={s.tRow}>
              <Td style={s.colDate}>{""}</Td>
              <Td style={s.colName}>{""}</Td>
              <Td style={s.colSpec}>{""}</Td>
              <Td style={s.colQty}>{""}</Td>
              <Td style={s.colUnit}>{""}</Td>
              <Td style={s.colUnitPrice}>{""}</Td>
              <Td style={s.colSupply}>{""}</Td>
              <Td style={[s.colVat, { borderRight: "none" }]}>{""}</Td>
            </View>
          ))}

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

      {/* 하단: 합계금액 + 계좌 + 비고 + 직인 */}
      <View style={s.footerRow}>
        <View style={s.footerLeft}>
          <Text style={s.amountText}>
            합계금액: {formatNumber(totalAmount)}원
          </Text>
          <Text style={s.bankText}>
            입금계좌: {data.bank.bankName} {data.bank.accountNumber} (예금주:{" "}
            {data.bank.accountHolder})
          </Text>
          {data.note ? <Text style={s.noteText}>비고: {data.note}</Text> : null}
        </View>
        {data.company.sealUrl ? (
          <Image src={data.company.sealUrl} style={s.sealImage} />
        ) : null}
      </View>
    </View>
  );
}

/* ═══════════════ Document (최종 export) ═══════════════ */

export function TransactionPdfDocument({ data }: { data: TransactionPdfData }) {
  return (
    <Document title={"거래명세서_" + data.transactionNumber} author="신우씨링">
      <Page size="A4" style={s.page}>
        <View style={{ paddingTop: PAGE_MARGIN_TOP }}>
          <TransactionSlip data={data} copyIndex={0} />
          <DashCutLine />
          <TransactionSlip data={data} copyIndex={1} />
          <DashCutLine />
          <TransactionSlip data={data} copyIndex={2} />
        </View>
      </Page>
    </Document>
  );
}
