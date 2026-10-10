import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (!token) return false;
        // /admin 路径额外要求管理员角色
        const pathname = req.nextUrl.pathname;
        if (pathname.startsWith("/admin")) {
          return (token as { role?: string }).role === "ADMIN";
        }
        return true;
      },
    },
    pages: {
      signIn: "/auth/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/records/:path*",
    "/weekly-review/:path*",
    "/my-challenges/:path*",
    "/enterprise/dashboard/:path*",
    "/profile/edit/:path*",
    "/time-capsule/:path*",
    "/admin/:path*",
  ],
};
