import { UserRank } from '../types';

export const XP_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 1000,
  GOLD: 5000,
  MASTER: 15000,
  GRANDMASTER: 50000
};

export const calculateRank = (xp: number): UserRank => {
  if (xp >= XP_THRESHOLDS.GRANDMASTER) return 'Grandmaster';
  if (xp >= XP_THRESHOLDS.MASTER) return 'Master';
  if (xp >= XP_THRESHOLDS.GOLD) return 'Gold';
  if (xp >= XP_THRESHOLDS.SILVER) return 'Silver';
  return 'Bronze';
};

export const getNextRankInfo = (xp: number) => {
  if (xp >= XP_THRESHOLDS.GRANDMASTER) return { next: 'Max Rank', threshold: xp, progress: 100 };
  
  let next: UserRank = 'Silver';
  let threshold = XP_THRESHOLDS.SILVER;
  let prevThreshold = XP_THRESHOLDS.BRONZE;

  if (xp >= XP_THRESHOLDS.MASTER) {
    next = 'Grandmaster';
    threshold = XP_THRESHOLDS.GRANDMASTER;
    prevThreshold = XP_THRESHOLDS.MASTER;
  } else if (xp >= XP_THRESHOLDS.GOLD) {
    next = 'Master';
    threshold = XP_THRESHOLDS.MASTER;
    prevThreshold = XP_THRESHOLDS.GOLD;
  } else if (xp >= XP_THRESHOLDS.SILVER) {
    next = 'Gold';
    threshold = XP_THRESHOLDS.GOLD;
    prevThreshold = XP_THRESHOLDS.SILVER;
  }

  const progress = ((xp - prevThreshold) / (threshold - prevThreshold)) * 100;
  return { next, threshold, progress: Math.min(100, Math.max(0, progress)) };
};
