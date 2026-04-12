// lib/pdf/font-register.ts
import { Font } from "@react-pdf/renderer";
import { existsSync } from "fs";
import path from "path";

const FONT_FILE = "NanumGothic-Regular.ttf";
const FONT_FILE_BOLD = "NanumGothic-Bold.ttf";

const candidates = [
  path.join(process.cwd(), "public", "fonts"),
  path.join("/app/public", "fonts"),          // Docker standalone
  path.join(process.cwd(), ".next", "static", "fonts"),
];

const fontDir = candidates.find((d) => existsSync(path.join(d, FONT_FILE)))
  ?? path.join(process.cwd(), "public", "fonts");

const regularPath = path.join(fontDir, FONT_FILE);
const boldPath = path.join(fontDir, FONT_FILE_BOLD);

Font.register({
  family: "NanumGothic",
  fonts: [
    { src: regularPath, fontWeight: "normal" },
    ...(existsSync(boldPath) ? [{ src: boldPath, fontWeight: "bold" as const }] : []),
  ],
});

// 하이픈 줄바꿈 비활성화 (한글 깨짐 방지)
Font.registerHyphenationCallback((word) => [word]);
