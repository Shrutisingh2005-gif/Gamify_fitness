export type UserRank = 'Bronze' | 'Silver' | 'Gold' | 'Master' | 'Grandmaster';
export type UserGoal = 'Bulk' | 'Fit' | 'Light';

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  level: number;
  xp: number;
  rank: UserRank;
  streak: number;
  lastActive: string;
  goal?: UserGoal;
  currentWeight?: number;
  weightHistory?: WeightEntry[];
}


export interface ActivityLog {
  id?: string;
  userId: string;
  userName?: string;
  userPhoto?: string;
  type: 'exercise' | 'nutrition' | 'sleep' | 'water';
  value: number;
  unit: string;
  timestamp: any;
  note?: string;
  cheers?: string[]; // Array of user UIDs
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  rewardXp: number;
  type: 'Global' | 'Daily' | 'Special';
  icon: string;
  targetValue: number;
  targetType: 'exercise' | 'nutrition' | 'sleep' | 'water';
  participants?: string[];
}

export interface Notification {
  id?: string;
  userId: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'challenge';
  read: boolean;
  timestamp: any;
}

export interface HealthStats {
  steps: number;
  calories: number;
  sleepHours: number;
  waterMl: number;
}

export interface Message {
  id?: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  timestamp: any;
}
