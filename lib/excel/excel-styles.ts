import type ExcelJS from "exceljs";

export const HEADER_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF4472C4" },
};

export const HEADER_FONT: Partial<ExcelJS.Font> = {
  color: { argb: "FFFFFFFF" },
  bold: true,
  size: 10,
};

export const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin" },
  bottom: { style: "thin" },
  left: { style: "thin" },
  right: { style: "thin" },
};

export const NUMBER_FORMAT = "#,##0";

export function applyHeaderStyle(row: ExcelJS.Row, colCount: number) {
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = THIN_BORDER;
  }
  row.height = 22;
}

export function applyDataStyle(
  row: ExcelJS.Row,
  colCount: number,
  numberCols: number[] = []
) {
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: "middle" };
    if (numberCols.includes(i)) {
      cell.numFmt = NUMBER_FORMAT;
      cell.alignment = { horizontal: "right", vertical: "middle" };
    }
  }
}

export function applyTotalStyle(
  row: ExcelJS.Row,
  colCount: number,
  numberCols: number[] = []
) {
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.border = THIN_BORDER;
    cell.font = { bold: true, size: 10 };
    cell.alignment = { vertical: "middle" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFF3CD" },
    };
    if (numberCols.includes(i)) {
      cell.numFmt = NUMBER_FORMAT;
      cell.alignment = { horizontal: "right", vertical: "middle" };
    }
  }
  row.height = 22;
}
