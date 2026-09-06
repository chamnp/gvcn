export type MonthlyStarLeaderboardItem = {
  student: { fullName: string };
  monthlyEarned: number;
};

type RedemptionLike = {
  status: string;
  totalStars: number;
  items: Array<{ productId: string }>;
};

export function getMonthlyRedemptionSummary(redemptions: readonly RedemptionLike[]) {
  return redemptions.reduce(
    (summary, redemption) => {
      if (redemption.status === 'CANCELLED') return summary;
      const isPeriodClose = redemption.items.some((item) => item.productId === 'system-period-close');
      if (isPeriodClose) {
        summary.closedBalance += redemption.totalStars;
        summary.hasPeriodClose = true;
      } else {
        summary.rewardSpent += redemption.totalStars;
      }
      return summary;
    },
    { rewardSpent: 0, closedBalance: 0, hasPeriodClose: false }
  );
}

/**
 * Competition ranking for a monthly star contest.
 * Only positive monthly scores are eligible; equal scores share the same rank.
 */
export function rankMonthlyStarLeaderboard<T extends MonthlyStarLeaderboardItem>(
  items: readonly T[]
): Array<T & { rank: number | null }> {
  const sorted = [...items].sort((a, b) => {
    if (b.monthlyEarned !== a.monthlyEarned) return b.monthlyEarned - a.monthlyEarned;
    return a.student.fullName.localeCompare(b.student.fullName, 'vi');
  });

  let eligiblePosition = 0;
  let previousScore: number | null = null;
  let previousRank: number | null = null;

  return sorted.map((item) => {
    if (item.monthlyEarned <= 0) return { ...item, rank: null };

    eligiblePosition += 1;
    const rank = item.monthlyEarned === previousScore ? previousRank : eligiblePosition;
    previousScore = item.monthlyEarned;
    previousRank = rank;
    return { ...item, rank };
  });
}
