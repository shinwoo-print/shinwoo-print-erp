// lib/pdf/font-register.ts
import { Font } from "@react-pdf/renderer";
import { existsSync } from "fs";
import path from "path";

const FONT_FILE = "NanumGothic-Regular.ttf";
const FONT_FILE_BOLD = "NanumGothic-Bold.ttf";

const candidates = [
  path.join(process.cwd(), "public", "fonts", FONT_FILE),
  path.join("/app/public", "fonts", FONT_FILE),          // Docker standalone
  path.join(process.cwd(), ".next", "static", "fonts", FONT_FILE),
];

const fontPath = candidates.find((p) => existsSync(p))
  ?? path.join(process.cwd(), "public", "fonts", FONT_FILE);

const fontDir = path.dirname(fontPath);
const boldPath = path.join(fontDir, FONT_FILE_BOLD);

Font.register({
  family: "NanumGothic",
  src: fontPath,
});

if (existsSync(boldPath)) {
  Font.register({
    family: "NanumGothic",
    src: boldPath,
    fontWeight: "bold",
  });
}

// 하이픈 줄바꿈 비활성화 (한글 깨짐 방지)
Font.registerHyphenationCallback((word) => [word]);
