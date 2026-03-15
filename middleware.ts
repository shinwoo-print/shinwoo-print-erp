// middleware.ts (프로젝트 루트)
import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "shinwoo_session";

const PUBLIC_PATHS = ["/login", "/api/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 파일 & public 경로 스킵
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/uploads") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 공개 경로 스킵
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 인증 쿠키 확인
  const session = request.cookies.get(AUTH_COOKIE_NAME);
  if (!session?.value) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
