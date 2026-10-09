import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#421d24] text-white">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium mb-3" style={{ fontWeight: 500 }}>履程</h3>
            <p className="text-sm opacity-70 leading-relaxed">
              让每一步成长都被看见。
              <br />
              不看学历，看能力。
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-bold mb-4 uppercase tracking-wide opacity-90" style={{ fontWeight: 700 }}>产品</h4>
            <ul className="space-y-3">
              <li><Link href="/projects/new" className="text-sm opacity-70 hover:opacity-100 transition-opacity" style={{ fontWeight: 460 }}>记录项目</Link></li>
              <li><Link href="/challenges" className="text-sm opacity-70 hover:opacity-100 transition-opacity" style={{ fontWeight: 460 }}>挑战广场</Link></li>
              <li><Link href="/weekly-review" className="text-sm opacity-70 hover:opacity-100 transition-opacity" style={{ fontWeight: 460 }}>周复盘</Link></li>
              <li><Link href="/time-capsule" className="text-sm opacity-70 hover:opacity-100 transition-opacity" style={{ fontWeight: 460 }}>时间胶囊</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-bold mb-4 uppercase tracking-wide opacity-90" style={{ fontWeight: 700 }}>资源</h4>
            <ul className="space-y-3">
              <li><Link href="/enterprise/dashboard" className="text-sm opacity-70 hover:opacity-100 transition-opacity" style={{ fontWeight: 460 }}>企业入口</Link></li>
              <li><Link href="/enterprise/talents" className="text-sm opacity-70 hover:opacity-100 transition-opacity" style={{ fontWeight: 460 }}>人才搜索</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-bold mb-4 uppercase tracking-wide opacity-90" style={{ fontWeight: 700 }}>关于</h4>
            <ul className="space-y-3">
              <li><span className="text-sm opacity-70" style={{ fontWeight: 460 }}>隐私政策</span></li>
              <li><span className="text-sm opacity-70" style={{ fontWeight: 460 }}>服务条款</span></li>
              <li><span className="text-sm opacity-70" style={{ fontWeight: 460 }}>联系我们</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-between text-sm opacity-50">
          <span>© 2026 履程 Growth Map</span>
          <span>在履程，没有人知道你来自哪里——我们只看你做了什么</span>
        </div>
      </div>
    </footer>
  );
}
