import { renderToBuffer } from "@react-pdf/renderer";
import type { ReactElement } from "react";

// Font 등록 사이드이펙트
import "@/lib/pdf/font-register";

export async function renderPdfToResponse(
  document: ReactElement,
  fileName: string,
): Promise<Response> {
  const buffer = await renderToBuffer(document);

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}.pdf"`,
    },
  });
}
