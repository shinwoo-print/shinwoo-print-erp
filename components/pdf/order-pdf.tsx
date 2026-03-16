import { boolToOX, formatDate, formatNumber } from "@/lib/pdf/format-utils";
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
interface OrderItemData {
  productName: string;
  printType: string | null;
  printPrice: string | null;
  sheets: number | null;
  sheetsPerRoll: number | null;
  unitPrice: string | null;
  supplyAmount: string | null;
  material: string | null;
  materialWidth: string | null;
  perforation: boolean;
  sizeWidth: string | null;
  sizeHeight: string | null;
  shape: string | null;
  okkuri: string | null;
  lamination: string | null;
  foil: string | null;
  cuttingMethod: string | null;
  cuttingType: string | null;
  sheetsPerSheet: string | null;
  labelGap: string | null;
  dieCutter: string | null;
  resinPlate: string | null;
  rollDirection: string | null;
  slit: boolean;
  dataType: string | null;
  lastDataDate: string | null;
  designFileStatus: string | null;
  designImageUrl: string | null;
  sortOrder: number;
}

interface OrderPdfData {
  orderNumber: string;
  clientCompanyName: string;
  orderDate: string;
  dueDate: string | null;
  orderer: string | null;
  worker: string | null;
  clientContact: string | null;
  clientPhone: string | null;
  deliveryMethod: string | null;
  deliveryRegion: string | null;
  deliveryAddress: string | null;
  photoInspection: boolean;
  sampleShipping: boolean;
  tightRoll: boolean;
  packagingType: string | null;
  deliveryType: string | null;
  courierType: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  note: string | null;
  items: OrderItemData[];
}

/* ────────── 스타일 ────────── */
const s = StyleSheet.create({
  page: {
    fontFamily: FONT_FAMILY,
    fontSize: 8,
    padding: PAGE_PADDING,
    color: COLORS.black,
  },
  // 상단
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
  },
  labelText: {
    fontSize: 8,
    color: COLORS.gray,
    marginBottom: 2,
  },
  valueText: {
    fontSize: 9,
    marginBottom: 4,
  },
  // 인쇄종류
  printTypeBadge: {
    fontSize: 7,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 3,
  },
  printTypeActive: {
    backgroundColor: COLORS.blue,
    color: COLORS.white,
  },
  printTypeInactive: {
    backgroundColor: COLORS.veryLightGray,
    color: COLORS.lightGray,
  },
  // 디자인 이미지
  designArea: {
    width: "100%",
    height: 180,
    border: `1pt solid ${COLORS.veryLightGray}`,
    marginVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  designImage: {
    maxWidth: "100%",
    maxHeight: 178,
    objectFit: "contain",
  },
  designPlaceholder: {
    color: COLORS.lightGray,
    fontSize: 10,
  },
  // 3열 하단
  threeCol: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  col: {
    flex: 1,
    border: `0.5pt solid ${COLORS.veryLightGray}`,
    padding: 6,
  },
  colTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
    paddingBottom: 3,
    borderBottom: `0.5pt solid ${COLORS.veryLightGray}`,
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  fieldLabel: {
    fontSize: 7,
    color: COLORS.gray,
    width: 58,
  },
  fieldValue: {
    fontSize: 7.5,
    flex: 1,
  },
  // 포장/배송
  twoCol: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  halfCol: {
    flex: 1,
    border: `0.5pt solid ${COLORS.veryLightGray}`,
    padding: 6,
  },
  // 하단 비고
  noteSection: {
    border: `0.5pt solid ${COLORS.veryLightGray}`,
    padding: 6,
    marginBottom: 6,
  },
  noteTitle: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 3,
  },
  noteText: {
    fontSize: 7.5,
    lineHeight: 1.4,
  },
  checkRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  checkBox: {
    width: 8,
    height: 8,
    border: `0.5pt solid ${COLORS.black}`,
    justifyContent: "center",
    alignItems: "center",
  },
  checkMark: {
    fontSize: 6,
    fontWeight: "bold",
  },
  checkLabel: {
    fontSize: 7,
  },
  // 페이지 번호
  pageNumber: {
    position: "absolute",
    bottom: 15,
    right: 30,
    fontSize: 7,
    color: COLORS.lightGray,
  },
});

const PRINT_TYPES = ["옵셋", "디지털", "실크", "레터프레스", "플렉소"];

/* ────────── Field 컴포넌트 ────────── */
function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <View style={s.fieldRow}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{value || "-"}</Text>
    </View>
  );
}

function CheckItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <View style={s.checkItem}>
      <View style={s.checkBox}>
        {checked && <Text style={s.checkMark}>✓</Text>}
      </View>
      <Text style={s.checkLabel}>{label}</Text>
    </View>
  );
}

/* ────────── 아이템 1페이지 ────────── */
function OrderItemPage({
  data,
  item,
  pageIndex,
  totalPages,
}: {
  data: OrderPdfData;
  item: OrderItemData;
  pageIndex: number;
  totalPages: number;
}) {
  const spec =
    item.sizeWidth && item.sizeHeight
      ? `${item.sizeWidth} × ${item.sizeHeight} mm`
      : "";

  return (
    <Page size="A4" style={s.page}>
      {/* ═══ 상단 ═══ */}
      <View style={s.headerRow}>
        {/* 좌측 */}
        <View style={{ flex: 1 }}>
          <Text style={s.title}>발주서</Text>
          <Text style={s.labelText}>발주처</Text>
          <Text style={s.valueText}>{data.clientCompanyName}</Text>
          <Text style={s.labelText}>제품명</Text>
          <Text style={s.valueText}>{item.productName}</Text>
          <Text style={s.labelText}>인쇄종류</Text>
          <View style={{ flexDirection: "row", marginTop: 2 }}>
            {PRINT_TYPES.map((pt) => (
              <Text
                key={pt}
                style={[
                  s.printTypeBadge,
                  item.printType === pt
                    ? s.printTypeActive
                    : s.printTypeInactive,
                ]}
              >
                {pt}
              </Text>
            ))}
          </View>
        </View>
        {/* 우측 */}
        <View style={{ width: 140, alignItems: "flex-end" }}>
          <Text style={s.labelText}>발주번호</Text>
          <Text style={s.valueText}>{data.orderNumber}</Text>
          <Text style={s.labelText}>발주일</Text>
          <Text style={s.valueText}>{formatDate(data.orderDate)}</Text>
          <Text style={s.labelText}>납기요청일</Text>
          <Text style={s.valueText}>{formatDate(data.dueDate)}</Text>
          <Text style={s.labelText}>발주자</Text>
          <Text style={s.valueText}>{data.orderer || "-"}</Text>
        </View>
      </View>

      {/* ═══ 디자인 시안 이미지 ═══ */}
      <View style={s.designArea}>
        {item.designImageUrl ? (
          <Image src={item.designImageUrl} style={s.designImage} />
        ) : (
          <Text style={s.designPlaceholder}>디자인 시안 미등록</Text>
        )}
      </View>

      {/* ═══ 3열 (인쇄 / 후가공 / 디자인) ═══ */}
      <View style={s.threeCol}>
        {/* 좌: 인쇄 */}
        <View style={s.col}>
          <Text style={s.colTitle}>인쇄</Text>
          <Field label="인쇄가격" value={formatNumber(item.printPrice)} />
          <Field label="발주수량" value={formatNumber(item.sheets)} />
          <Field label="단가" value={formatNumber(item.unitPrice)} />
          <Field label="원단" value={item.material} />
          <Field label="재단방식" value={item.cuttingMethod} />
          <Field
            label="원단폭"
            value={item.materialWidth ? `${item.materialWidth}mm` : null}
          />
          <Field label="롤당매수" value={formatNumber(item.sheetsPerRoll)} />
          <Field label="시트당매수" value={item.sheetsPerSheet} />
          <Field label="작업자" value={data.worker} />
        </View>
        {/* 중: 후가공 */}
        <View style={s.col}>
          <Text style={s.colTitle}>후가공</Text>
          <Field label="규격" value={spec} />
          <Field label="모형" value={item.shape} />
          <Field
            label="오꾸리"
            value={item.okkuri ? `${item.okkuri}mm` : null}
          />
          <Field label="라미" value={item.lamination} />
          <Field label="박" value={item.foil} />
          <Field label="미싱선" value={boolToOX(item.perforation)} />
          <Field label="롤방향" value={item.rollDirection} />
          <Field label="슬리트" value={boolToOX(item.slit)} />
          <Field
            label="라벨간간격"
            value={item.labelGap ? `${item.labelGap}mm` : null}
          />
        </View>
        {/* 우: 디자인 */}
        <View style={s.col}>
          <Text style={s.colTitle}>디자인</Text>
          <Field label="DATA종류" value={item.dataType} />
          <Field label="최종DATA날짜" value={formatDate(item.lastDataDate)} />
          <Field label="디자인파일상태" value={item.designFileStatus} />
          <Field label="도무송칼" value={item.dieCutter} />
          <Field label="수지판" value={item.resinPlate} />
          <Field label="거래처담당자" value={data.clientContact} />
          <Field label="담당자연락처" value={data.clientPhone} />
        </View>
      </View>

      {/* ═══ 포장/배송 ═══ */}
      <View style={s.twoCol}>
        <View style={s.halfCol}>
          <Text style={s.colTitle}>포장</Text>
          <Field label="포장종류" value={data.packagingType} />
          <Field label="택배종류" value={data.courierType} />
          <Field label="담당자" value={data.receiverName} />
        </View>
        <View style={s.halfCol}>
          <Text style={s.colTitle}>배송</Text>
          <Field label="배송방법" value={data.deliveryMethod} />
          <Field label="배송주소" value={data.deliveryAddress} />
          <Field label="배송지역" value={data.deliveryRegion} />
        </View>
      </View>

      {/* ═══ 비고 + 체크 ═══ */}
      <View style={s.noteSection}>
        <Text style={s.noteTitle}>비고</Text>
        <Text style={s.noteText}>{data.note || "-"}</Text>
        <View style={s.checkRow}>
          <CheckItem label="사진감리요청" checked={data.photoInspection} />
          <CheckItem label="샘플우편배송요청" checked={data.sampleShipping} />
          <CheckItem label="롤짱짱하게" checked={data.tightRoll} />
        </View>
      </View>

      {/* 페이지 번호 */}
      <Text style={s.pageNumber}>
        {pageIndex + 1} / {totalPages}
      </Text>
    </Page>
  );
}

/* ────────── Document ────────── */
export function OrderPdfDocument({ data }: { data: OrderPdfData }) {
  const totalPages = data.items.length;

  return (
    <Document title={`발주서_${data.orderNumber}`} author="신우씨링">
      {data.items.map((item, idx) => (
        <OrderItemPage
          key={idx}
          data={data}
          item={item}
          pageIndex={idx}
          totalPages={totalPages}
        />
      ))}
    </Document>
  );
}
