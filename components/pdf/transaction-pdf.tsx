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
  infoFieldRowLast: {
    flexDirection: "row",
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
  /* 테이블 셀 - 각 컬럼별 미리 정의 */
  thDate: {
    width: 42,
    fontSize: 5.5,
    fontWeight: "bold",
    textAlign: "center",
    padding: 1.5,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  thName: {
    width: 110,
    fontSize: 5.5,
    fontWeight: "bold",
    textAlign: "center",
    padding: 1.5,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  thSpec: {
    width: 54,
    fontSize: 5.5,
    fontWeight: "bold",
    textAlign: "center",
    padding: 1.5,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  thQty: {
    width: 34,
    fontSize: 5.5,
    fontWeight: "bold",
    textAlign: "center",
    padding: 1.5,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  thUnit: {
    width: 24,
    fontSize: 5.5,
    fontWeight: "bold",
    textAlign: "center",
    padding: 1.5,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  thUnitPrice: {
    width: 52,
    fontSize: 5.5,
    fontWeight: "bold",
    textAlign: "center",
    padding: 1.5,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  thSupply: {
    width: 60,
    fontSize: 5.5,
    fontWeight: "bold",
    textAlign: "center",
    padding: 1.5,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  thVatLast: {
    width: 50,
    fontSize: 5.5,
    fontWeight: "bold",
    textAlign: "center",
    padding: 1.5,
    justifyContent: "center",
  },

  tdDate: {
    width: 42,
    fontSize: 5.5,
    padding: 1.5,
    textAlign: "center",
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdName: {
    width: 110,
    fontSize: 5.5,
    padding: 1.5,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdSpec: {
    width: 54,
    fontSize: 5.5,
    padding: 1.5,
    textAlign: "center",
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdQty: {
    width: 34,
    fontSize: 5.5,
    padding: 1.5,
    textAlign: "right",
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdUnit: {
    width: 24,
    fontSize: 5.5,
    padding: 1.5,
    textAlign: "center",
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdUnitPrice: {
    width: 52,
    fontSize: 5.5,
    padding: 1.5,
    textAlign: "right",
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdSupply: {
    width: 60,
    fontSize: 5.5,
    padding: 1.5,
    textAlign: "right",
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdVatLast: {
    width: 50,
    fontSize: 5.5,
    padding: 1.5,
    textAlign: "right",
    justifyContent: "center",
  },

  /* 빈 셀 (textAlign 불필요) */
  tdDateEmpty: {
    width: 42,
    fontSize: 5.5,
    padding: 1.5,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdNameEmpty: {
    width: 110,
    fontSize: 5.5,
    padding: 1.5,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdSpecEmpty: {
    width: 54,
    fontSize: 5.5,
    padding: 1.5,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdQtyEmpty: {
    width: 34,
    fontSize: 5.5,
    padding: 1.5,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdUnitEmpty: {
    width: 24,
    fontSize: 5.5,
    padding: 1.5,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdUnitPriceEmpty: {
    width: 52,
    fontSize: 5.5,
    padding: 1.5,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdSupplyEmpty: {
    width: 60,
    fontSize: 5.5,
    padding: 1.5,
    borderRight: "0.5pt solid #E5E5E5",
    justifyContent: "center",
  },
  tdVatLastEmpty: {
    width: 50,
    fontSize: 5.5,
    padding: 1.5,
    justifyContent: "center",
  },

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
          <View style={s.infoFieldRowLast}>
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
          <View style={s.infoFieldRowLast}>
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
          <View style={s.thDate}>
            <Text>일자</Text>
          </View>
          <View style={s.thName}>
            <Text>품명</Text>
          </View>
          <View style={s.thSpec}>
            <Text>규격</Text>
          </View>
          <View style={s.thQty}>
            <Text>수량</Text>
          </View>
          <View style={s.thUnit}>
            <Text>단위</Text>
          </View>
          <View style={s.thUnitPrice}>
            <Text>단가</Text>
          </View>
          <View style={s.thSupply}>
            <Text>공급가액</Text>
          </View>
          <View style={s.thVatLast}>
            <Text>부가세</Text>
          </View>
        </View>

        {displayItems.map((item, idx) => (
          <View key={idx} style={s.tRow}>
            <View style={s.tdDate}>
              <Text>{fmtShort(item.itemDate)}</Text>
            </View>
            <View style={s.tdName}>
              <Text>{item.productName}</Text>
            </View>
            <View style={s.tdSpec}>
              <Text>{item.spec || ""}</Text>
            </View>
            <View style={s.tdQty}>
              <Text>{formatNumber(item.quantity)}</Text>
            </View>
            <View style={s.tdUnit}>
              <Text>{item.unit || "EA"}</Text>
            </View>
            <View style={s.tdUnitPrice}>
              <Text>{formatNumber(item.unitPrice)}</Text>
            </View>
            <View style={s.tdSupply}>
              <Text>{formatNumber(item.supplyAmount)}</Text>
            </View>
            <View style={s.tdVatLast}>
              <Text>{formatNumber(item.vat)}</Text>
            </View>
          </View>
        ))}

        {emptyCount > 0 &&
          Array.from({ length: emptyCount }).map((_, idx) => (
            <View key={"e" + idx} style={s.tRow}>
              <View style={s.tdDateEmpty}>
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
              <View style={s.tdUnitEmpty}>
                <Text>{""}</Text>
              </View>
              <View style={s.tdUnitPriceEmpty}>
                <Text>{""}</Text>
              </View>
              <View style={s.tdSupplyEmpty}>
                <Text>{""}</Text>
              </View>
              <View style={s.tdVatLastEmpty}>
                <Text>{""}</Text>
              </View>
            </View>
          ))}

        <View style={s.tTotalRow}>
          <View style={s.totalLabel}>
            <Text>합 계</Text>
          </View>
          <View style={s.tdQty}>
            <Text>{formatNumber(data.totalQuantity)}</Text>
          </View>
          <View style={s.tdUnitEmpty}>
            <Text>{""}</Text>
          </View>
          <View style={s.tdUnitPriceEmpty}>
            <Text>{""}</Text>
          </View>
          <View style={s.tdSupply}>
            <Text>{formatNumber(totalSupply)}</Text>
          </View>
          <View style={s.tdVatLast}>
            <Text>{formatNumber(totalVat)}</Text>
          </View>
        </View>
      </View>

      {/* 하단 */}
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

/* ═══════════════ Document ═══════════════ */

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
