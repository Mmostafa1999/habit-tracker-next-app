import { ServiceResult, BaseService } from "../common/types";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  criteria: string;
  progress: number;
  target: number;
  unlocked: boolean;
  unlockedAt?: string | object;
  icon: string;
  category: string;
  xp: number;
  secret?: boolean;
}

export interface AchievementService extends BaseService {
  // Achievement retrieval
  getAchievements(userId: string): Promise<ServiceResult<Achievement[]>>;
  getAchievementById(userId: string, achievementId: string): Promise<ServiceResult<Achievement>>;
  
  // Achievement progress
  updateAchievementProgress(
    userId: string, 
    achievementId: string, 
    progress: number
  ): Promise<ServiceResult<Achievement>>;
  
  unlockAchievement(
    userId: string, 
    achievementId: string
  ): Promise<ServiceResult<Achievement>>;
  
  // Achievement filtering
  getUnlockedAchievements(userId: string): Promise<ServiceResult<Achievement[]>>;
  getLockedAchievements(userId: string): Promise<ServiceResult<Achievement[]>>;
  filterAchievements(
    userId: string, 
    filter: "all" | "unlocked" | "locked"
  ): Promise<ServiceResult<Achievement[]>>;
  
  // Achievement counts and statistics
  getUnlockedCount(userId: string): Promise<ServiceResult<number>>;
  getTotalCount(userId: string): Promise<ServiceResult<number>>;
  
  // Check if habit completion triggers any achievements
  checkHabitAchievements(
    userId: string, 
    habitId: string, 
    completionData: any
  ): Promise<ServiceResult<Achievement[]>>;
} 