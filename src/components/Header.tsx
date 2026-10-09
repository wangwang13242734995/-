"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export function Header() {
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-[12px] border-b border-[#e3e3e2]"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-medium text-[#292827]" style={{ fontWeight: 500 }}>
            履程
          </span>
          <span className="text-xs text-[#666666] hidden sm:inline">Growth Map</span>
        </Link>

        {/* Center Nav */}
        <div className="hidden md:flex items-center gap-8">
          {session ? (
            <>
              <Link href="/dashboard" className="text-sm text-[#292827] hover:text-[#714cb6] transition-colors" style={{ fontWeight: 460 }}>
                概览
              </Link>
              <Link href="/projects" className="text-sm text-[#292827] hover:text-[#714cb6] transition-colors" style={{ fontWeight: 460 }}>
                项目
              </Link>
              <Link href="/challenges" className="text-sm text-[#292827] hover:text-[#714cb6] transition-colors" style={{ fontWeight: 460 }}>
                挑战
              </Link>
              <Link href="/weekly-review" className="text-sm text-[#292827] hover:text-[#714cb6] transition-colors" style={{ fontWeight: 460 }}>
                周复盘
              </Link>
            </>
          ) : (
            <>
              <a href="#features" className="text-sm text-[#292827] hover:text-[#714cb6] transition-colors" style={{ fontWeight: 460 }}>
                功能
              </a>
              <a href="#how-it-works" className="text-sm text-[#292827] hover:text-[#714cb6] transition-colors" style={{ fontWeight: 460 }}>
                怎么用
              </a>
            </>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link
                href={`/profile/${(session.user as { id: string })?.id}`}
                className="text-sm text-[#292827] hover:text-[#714cb6] transition-colors"
                style={{ fontWeight: 460 }}
              >
                我的名片
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm text-[#666666] hover:text-[#292827] transition-colors"
                style={{ fontWeight: 460 }}
              >
                退出
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm text-[#292827] hover:text-[#714cb6] transition-colors"
                style={{ fontWeight: 460 }}
              >
                登录
              </Link>
              <Link
                href="/auth/register"
                className="text-sm px-4 py-1.5 bg-[#d4c7ff] text-[#292827] border border-[#292827] rounded-lg hover:bg-[#c4b5fe] transition-colors"
                style={{ fontWeight: 460 }}
              >
                免费注册
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
