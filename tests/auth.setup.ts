import { Page } from "@playwright/test";

export async function login(page: Page) {
  // 로그인 페이지로 직접 이동
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  
  // 비밀번호 input이 나타날 때까지 대기
  const pwInput = page.locator('input[type="password"]');
  await pwInput.waitFor({ state: "visible", timeout: 10000 });
  
  // 비밀번호 입력
  await pwInput.fill(process.env.ERP_PASSWORD || "test1234");
  
  // 로그인 버튼 클릭
  await page.locator('button[type="submit"]').click();
  
  // 대시보드로 이동될 때까지 대기
  await page.waitForURL("**/dashboard", { timeout: 15000 });
  await page.waitForLoadState("networkidle");
}
