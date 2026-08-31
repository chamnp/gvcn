'use client';

import { TVModalType } from '@/lib/remote-sync';
import { RemoteGameModule } from './types';
import {
  LuckyWheelModule,
  ClassroomTimerModule,
  TrafficLightModule,
  TeamQuizBattleModule,
  MysteryChestModule,
  SmartPairModule,
  BrainBreakModule,
  DailyMoodModule,
  TaskCanvasModule,
  NoiseMeterModule,
  LeaderboardModule,
  SoundboardModule,
} from './game-adapters';

export const REMOTE_GAME_MODULES: Record<TVModalType, RemoteGameModule | null> = {
  WHEEL: LuckyWheelModule,
  TIMER: ClassroomTimerModule,
  TRAFFIC: TrafficLightModule,
  TEAM_QUIZ: TeamQuizBattleModule,
  CHEST: MysteryChestModule,
  PAIR: SmartPairModule,
  BRAIN_BREAK: BrainBreakModule,
  MOOD: DailyMoodModule,
  TASK_CANVAS: TaskCanvasModule,
  NOISE: NoiseMeterModule,
  LEADERBOARD: LeaderboardModule,
  SOUNDBOARD: SoundboardModule,
  NONE: null,
};

export function getRemoteGameModule(modalType?: TVModalType): RemoteGameModule | null {
  if (!modalType || modalType === 'NONE') return null;
  return REMOTE_GAME_MODULES[modalType] || null;
}

export const ALL_REMOTE_GAMES: RemoteGameModule[] = [
  LuckyWheelModule,
  ClassroomTimerModule,
  TrafficLightModule,
  TeamQuizBattleModule,
  MysteryChestModule,
  SmartPairModule,
  BrainBreakModule,
  DailyMoodModule,
  TaskCanvasModule,
  NoiseMeterModule,
  LeaderboardModule,
  SoundboardModule,
];
