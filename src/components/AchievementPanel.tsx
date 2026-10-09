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
    <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[#292827] flex items-center gap-2" style={{ fontSize: 18, fontWeight: 460 }}>
          <span className="w-8 h-8 bg-[#d4c7ff]/30 rounded-lg flex items-center justify-center text-sm">🏅</span>
          成就
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#666666]">{stats.unlocked}/{stats.total}</span>
          <div className="w-24 h-2 bg-[#e3e3e2] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#714cb6] rounded-full transition-all"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
          <span className="text-xs text-[#714cb6]" style={{ fontWeight: 540 }}>{stats.percentage}%</span>
        </div>
      </div>

      {/* Recent Achievements */}
      {stats.recent.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-[#666666] mb-2">最近解锁</p>
          <div className="flex gap-2">
            {stats.recent.map((ach) => (
              <div
                key={ach.id}
                className="flex items-center gap-2 px-3 py-2 bg-[#d4c7ff]/20 border border-[#d4c7ff] rounded-xl"
              >
                <span className="text-lg">{ach.icon}</span>
                <span className="text-xs text-[#714cb6]" style={{ fontWeight: 540 }}>{ach.title}</span>
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
          ? "bg-[#d4c7ff]/20 border-[#d4c7ff]"
          : "bg-[#f2f0eb] border-[#e3e3e2] opacity-50"
      }`}
      title={achievement.description}
    >
      <span className="text-2xl mb-1">{achievement.icon}</span>
      <span className={`text-[10px] text-center leading-tight ${
        achievement.achieved ? "text-[#714cb6]" : "text-[#666666]"
      }`} style={{ fontWeight: 540 }}>
        {achievement.title}
      </span>
    </div>
  );
}
