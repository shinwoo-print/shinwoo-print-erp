import type { DocumentProps } from "@react-pdf/renderer";
import { renderToBuffer } from "@react-pdf/renderer";
import type { ReactElement } from "react";

// Font 등록 사이드이펙트
import "@/lib/pdf/font-register";

export async function renderPdfToResponse(
  document: ReactElement<DocumentProps>,
  fileName: string,
): Promise<Response> {
  try {
    const buffer = await renderToBuffer(document);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[renderPdfToResponse] PDF 렌더링 실패:", error);
    throw error;
  }
}
