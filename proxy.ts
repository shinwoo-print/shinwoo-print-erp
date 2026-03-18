import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth"];
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "shinwoo_session";
const AUTH_SECRET = process.env.AUTH_SECRET || "fallback-secret-key";

function verifyToken(token: string): boolean {
  const expected = Buffer.from(`authenticated:${AUTH_SECRET}`).toString(
    "base64",
  );
  return token === expected;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 파일 무시
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isValidToken = token ? verifyToken(token) : false;

  // 루트 경로 → 대시보드로 리다이렉트
  if (pathname === "/") {
    if (isValidToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(
      new URL("/login?redirect=/dashboard", request.url),
    );
  }

  // 인증 상태에서 /login 접근 → 대시보드로 리다이렉트
  if (pathname === "/login" && isValidToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 공개 경로는 통과
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 보호 경로: 토큰 존재 + 유효성 검증
  if (!isValidToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
