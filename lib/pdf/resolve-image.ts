import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_BASE =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "public");

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function resolveImageSrc(
  urlOrPath: string,
): Promise<string | null> {
  try {
    // 절대 URL(http/https)이면 그대로 반환 (외부 이미지)
    if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
      return urlOrPath;
    }

    // data URI면 그대로 반환
    if (urlOrPath.startsWith("data:")) {
      return urlOrPath;
    }

    let filePath: string;

    // ★ 새 형식: /api/uploads/designs?file=xxx.jpg
    if (urlOrPath.includes("/api/uploads/designs")) {
      const url = new URL(urlOrPath, "http://localhost");
      const fileName = url.searchParams.get("file");
      if (!fileName) {
        console.warn(`[resolve-image] 파일명 파라미터 없음: ${urlOrPath}`);
        return null;
      }
      const safeName = path.basename(fileName);
      filePath = path.join(UPLOAD_BASE, "uploads", "designs", safeName);
    }
    // 기존 형식: /uploads/designs/xxx.jpg
    else {
      filePath = path.join(UPLOAD_BASE, urlOrPath);
    }

    if (!existsSync(filePath)) {
      console.warn(`[resolve-image] 파일 없음: ${filePath}`);
      return null;
    }

    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_MAP[ext] || "image/jpeg";

    const base64 = buffer.toString("base64");
    return `data:${mime};base64,${base64}`;
  } catch (error) {
    console.error(`[resolve-image] 이미지 변환 실패: ${urlOrPath}`, error);
    return null;
  }
}
