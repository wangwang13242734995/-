import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="bg-white border-b border-slate-100">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-indigo-600">履程</span>
            <span className="text-xs text-slate-400 hidden sm:inline">Growth Map</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-slate-600 hover:text-slate-900">
              登录
            </Link>
            <Link href="/auth/register" className="btn-primary text-sm">
              免费注册
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
              让每一步成长
              <br />
              <span className="text-indigo-600">都被看见、被认证</span>
            </h1>
            <p className="text-lg text-slate-500 mt-6 max-w-2xl mx-auto">
              不看学历，看能力。用结构化的项目记录和成长轨迹，
              向用人单位展示你的真实能力——30 秒生成能力名片。
            </p>
            <div className="flex items-center justify-center gap-4 mt-8">
              <Link href="/auth/register" className="btn-primary text-lg px-8 py-3">
                开始记录成长
              </Link>
              <Link href="#features" className="btn-secondary text-lg px-8 py-3">
                了解更多
              </Link>
            </div>
            <p className="text-sm text-slate-400 mt-4">
              面向大学生 · 免费使用 · 30 秒注册
            </p>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">
              85% 的大学生没有学历光环，如何证明自己？
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: "📄", title: "简历同质化", desc: "所有人都写着学生会主席、绩点 3.8，HR 分不清谁有能力" },
                { icon: "🎓", title: "学历不等于能力", desc: "名校毕业不代表能干活，双非学生也有很强的实战能力" },
                { icon: "⏱️", title: "面试看不准", desc: "30 分钟面试判断一个人，试错成本是年薪的 1.5 倍" },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="card text-center">
                  <div className="text-4xl mb-4">{icon}</div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 px-6 bg-slate-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-4">
              履程的解法：用数据说话
            </h2>
            <p className="text-center text-slate-500 mb-12">
              结构化记录你的项目经历，AI 自动分析六维能力，30 秒生成能力名片
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: "📝", title: "结构化项目记录", desc: "不是写简历，而是填表记录。项目名称、角色、技术栈、遇到的困难、解决方案——结构化输入，标准化输出。" },
                { icon: "🎯", title: "六维能力评估", desc: "专业力、学习力、自驱力、协作力、抗压力、表达力。由行为数据自动计算，不是你自己打分。" },
                { icon: "📈", title: "成长斜率追踪", desc: "持续记录，看你的能力增长趋势。成长斜率比绝对分数更有价值——只有持续记录的平台才能算出来。" },
                { icon: "🪪", title: "能力名片", desc: "一个链接，30 秒看懂一个人。HR 在微信里点开就能判断要不要面试，不需要翻简历。" },
                { icon: "🏆", title: "企业挑战赛", desc: "企业发布实战任务，学生参与挑战。即使没被选中，完成过程也沉淀到能力档案。" },
                { icon: "🔍", title: "可信度标记", desc: "有 GitHub 链接、量化数据、他人评价的记录标记为高可信。让 HR 知道哪些数据是硬货。" },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="card">
                  <div className="text-3xl mb-3">{icon}</div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">三步开始</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: "01", title: "注册并记录", desc: "注册账号，把你的课程项目、比赛、实习经历用结构化表单记录下来" },
                { step: "02", title: "AI 自动分析", desc: "平台根据你的行为数据自动计算六维能力分数，每次记录后即时反馈" },
                { step: "03", title: "分享给 HR", desc: "生成能力名片链接，放在简历上或直接发给用人单位，30 秒看懂你" },
              ].map(({ step, title, desc }) => (
                <div key={step} className="text-center">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                    {step}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 bg-indigo-600">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              你的每一步成长，都值得被看见
            </h2>
            <p className="text-indigo-200 mb-8">
              加入履程，开始构建你的能力档案。免费、简单、30 秒注册。
            </p>
            <Link href="/auth/register" className="inline-block px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors">
              立即开始
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm">
          <span>履程 Growth Map</span>
          <span>让每一步成长都被看见</span>
        </div>
      </footer>
    </div>
  );
}
