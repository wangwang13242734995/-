import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // 如果未登录，只有非注册页面才需要跳转
        if (!token) return false;
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
  ],
};
