import { UserGoal } from '../types';

export const GOAL_TARGETS: Record<UserGoal, { exercise: number; calories: number; sleep: number; water: number }> = {
  Bulk: { exercise: 60, calories: 3000, sleep: 8, water: 3000 },
  Fit: { exercise: 45, calories: 2200, sleep: 7, water: 2500 },
  Light: { exercise: 30, calories: 1800, sleep: 7, water: 2000 },
};
