"use client";

import { getAchievementStats, Achievement } from "@/services/achievement-engine";

interface AchievementPanelProps {
  scores: Record<string, number>;
  projectCount: number;
  streakDays: number;
}

export default function AchievementPanel({ scores, projectCount, streakDays }: AchievementPanelProps) {
  const stats = getAchievementStats(scores, projectCount, streakDays);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <span className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">🏅</span>
          成就
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">{stats.unlocked}/{stats.total}</span>
          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
          <span className="text-xs text-amber-600 font-medium">{stats.percentage}%</span>
        </div>
      </div>

      {/* Recent Achievements */}
      {stats.recent.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-slate-400 mb-2">最近解锁</p>
          <div className="flex gap-2">
            {stats.recent.map((ach) => (
              <div
                key={ach.id}
                className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg"
              >
                <span className="text-lg">{ach.icon}</span>
                <span className="text-xs font-medium text-amber-800">{ach.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievement Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {stats.all.filter(a => a.type === "SCORE_MILESTONE" && a.threshold === 70).map((ach) => (
          <AchievementBadge key={ach.id} achievement={ach} />
        ))}
        {stats.all.filter(a => a.type === "PROJECT_MILESTONE").slice(0, 3).map((ach) => (
          <AchievementBadge key={ach.id} achievement={ach} />
        ))}
        {stats.all.filter(a => a.type === "STREAK").slice(0, 3).map((ach) => (
          <AchievementBadge key={ach.id} achievement={ach} />
        ))}
      </div>
    </div>
  );
}

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  return (
    <div
      className={`flex flex-col items-center p-3 rounded-xl border transition ${
        achievement.achieved
          ? "bg-gradient-to-b from-amber-50 to-white border-amber-200 shadow-sm"
          : "bg-slate-50 border-slate-100 opacity-50"
      }`}
      title={achievement.description}
    >
      <span className="text-2xl mb-1">{achievement.icon}</span>
      <span className={`text-[10px] text-center leading-tight font-medium ${
        achievement.achieved ? "text-amber-800" : "text-slate-400"
      }`}>
        {achievement.title}
      </span>
    </div>
  );
}
