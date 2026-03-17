// lib/pdf/font-register.ts
import { Font } from "@react-pdf/renderer";
import path from "path";

Font.register({
  family: "NanumGothic",
  src: path.join(process.cwd(), "public", "fonts", "NanumGothic-Regular.ttf"),
});
