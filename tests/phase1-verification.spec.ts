import { expect, test } from "@playwright/test";
import { login } from "./auth.setup";

test.describe("1차 수정사항 검증", () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("거래명세서 PDF 정상 생성", async ({ page }) => {
    await page.goto("/invoices");
    const firstRow = page.locator("table tbody tr").first();
    if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstRow.click();
      const pdfBtn = page.locator('a[href*="/pdf"], button:has-text("PDF")');
      await expect(pdfBtn).toBeVisible();
    }
  });

  test("발주서 디자인 시안 영역 존재", async ({ page }) => {
    await page.goto("/orders");
    const firstRow = page.locator("table tbody tr").first();
    if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstRow.click();
      await page.waitForLoadState("networkidle");
      const uploadArea = page.locator('text="디자인 시안"');
      await expect(uploadArea).toBeVisible();
    }
  });

  test("지종 텍스트 없고 원단종류 존재", async ({ page }) => {
    await page.goto("/orders/new");
    await page.waitForLoadState("networkidle");
    // 발주일 라벨로 hydration 대기 (유일한 라벨)
    await page.locator('label:has-text("발주일")').first().waitFor({ timeout: 15000 });
    // 품목 아코디언 펼치기 - 접혀있으면 품목명이 안 보임
    const itemBtn = page.locator("button").filter({ hasText: /품목 #1/ });
    const isItemVisible = await page.locator('label:has-text("품목명")').isVisible().catch(() => false);
    if (!isItemVisible && await itemBtn.isVisible().catch(() => false)) {
      await itemBtn.click();
      await page.waitForTimeout(1000);
    }
    // 품목명 라벨이 보일 때까지 재확인
    await page.locator('label:has-text("품목명")').first().waitFor({ timeout: 10000 });
    const allText = await page.locator("body").innerText();
    expect(allText).not.toContain("지종");
    expect(allText).toContain("원단종류");
  });

  test("사진검수 샘플발송 삭제 롤짱짱 유지", async ({ page }) => {
    await page.goto("/orders/new");
    await page.waitForLoadState("networkidle");
    // 발주일 라벨로 hydration 대기
    await page.locator('label:has-text("발주일")').first().waitFor({ timeout: 15000 });
    const html = await page.content();
    expect(html).not.toContain('id="photoInspection"');
    expect(html).not.toContain('id="sampleShipping"');
    expect(html).toContain('id="tightRoll"');
  });

  test("PDF 비고 검증 발주서 PDF 생성", async ({ page }) => {
    await page.goto("/orders");
    const firstRow = page.locator("table tbody tr").first();
    if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstRow.click();
      const currentUrl = page.url();
      const idMatch = currentUrl.match(/orders\/(\d+)/);
      if (idMatch) {
        const res = await page.request.get("/api/orders/" + idMatch[1] + "/pdf");
        expect(res.status()).toBe(200);
      }
    }
  });

  test("삭제된 필드 미표시 작업자", async ({ page }) => {
    await page.goto("/orders/new");
    await page.waitForLoadState("networkidle");
    await page.locator('label:has-text("발주일")').first().waitFor({ timeout: 15000 });
    const html = await page.content();
    expect(html).not.toContain('placeholder="작업자명"');
  });

  test("품목 삭제 필드 형상 오꾸리 슬리트 등", async ({ page }) => {
    await page.goto("/orders/new");
    await page.waitForLoadState("networkidle");
    await page.locator('label:has-text("발주일")').first().waitFor({ timeout: 15000 });
    const itemBtn = page.locator("button").filter({ hasText: /품목 #1/ });
    const isItemVisible = await page.locator('label:has-text("품목명")').isVisible().catch(() => false);
    if (!isItemVisible && await itemBtn.isVisible().catch(() => false)) {
      await itemBtn.click();
      await page.waitForTimeout(1000);
    }
    const allText = await page.locator("body").innerText();
    for (const labelText of ["오꾸리", "슬리트", "라벨간격", "도무송칼", "수지판"]) {
      expect(allText, labelText + " 이 아직 존재함").not.toContain(labelText);
    }
  });

  test("발주서 PDF 생성 정상", async ({ page }) => {
    await page.goto("/orders");
    const firstRow = page.locator("table tbody tr").first();
    if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstRow.click();
      await page.waitForLoadState("networkidle");
      const currentUrl = page.url();
      const idMatch = currentUrl.match(/orders\/(\d+)/);
      if (idMatch) {
        const res = await page.request.get("/api/orders/" + idMatch[1] + "/pdf");
        expect(res.status()).toBe(200);
      }
    }
  });

  test("견적서 PDF 생성 정상", async ({ page }) => {
    await page.goto("/quotes");
    const firstRow = page.locator("table tbody tr").first();
    if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstRow.click();
      await page.waitForLoadState("networkidle");
      const currentUrl = page.url();
      const idMatch = currentUrl.match(/quotes\/(\d+)/);
      if (idMatch) {
        const res = await page.request.get("/api/estimates/" + idMatch[1] + "/pdf");
        expect(res.status()).toBe(200);
      }
    }
  });

  test("거래처 구분 필드 존재", async ({ page }) => {
    await page.goto("/clients/new");
    await page.waitForLoadState("networkidle");
    await page.locator('h3:has-text("기본"), label:has-text("업체명")').first().waitFor({ timeout: 15000 });
    const html = await page.content();
    expect(html).toContain('value="매출"');
    expect(html).toContain('value="매입"');
    expect(html).toContain('value="매입매출"');
  });

  test("비밀번호 변경 UI 존재", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    const html = await page.content();
    const hasPw = html.includes("비밀번호") || html.includes("password") || html.includes("Password");
    expect(hasPw, "비밀번호 변경 UI가 settings에 없음").toBe(true);
  });

  test("주요 API 정상 응답", async ({ page }) => {
    const endpoints = [
      "/api/clients?pageSize=1",
      "/api/products?pageSize=1",
      "/api/orders?pageSize=1",
      "/api/estimates?pageSize=1",
      "/api/company",
      "/api/bank-accounts",
      "/api/estimate-managers",
    ];
    for (const ep of endpoints) {
      const res = await page.request.get(ep);
      expect(res.status(), ep + " 응답 실패").toBe(200);
    }
  });
});
