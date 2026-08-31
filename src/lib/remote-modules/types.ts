import React from 'react';
import { RemoteStatePayload, RemoteActionType, TVModalType } from '@/lib/remote-sync';
import { LessonSlideLayout } from '@/types';

export type RemoteControlActionDispatcher = (type: RemoteActionType, payload?: any) => void;

export interface RemoteModuleProps {
  tvState: RemoteStatePayload;
  sendAction: RemoteControlActionDispatcher;
  onAwardStar?: (studentId: string, studentName: string) => void;
}

export interface RemoteGameModule {
  id: TVModalType;
  title: string;
  iconEmoji: string;
  shortDesc: string;
  category: 'GAME' | 'MANAGEMENT' | 'INTERACTION' | 'ENERGY';
  renderControls: (props: RemoteModuleProps) => React.ReactNode;
}

export interface SlideLayoutRemoteAdapter {
  layout: LessonSlideLayout;
  name: string;
  iconEmoji: string;
  renderControls: (props: RemoteModuleProps) => React.ReactNode;
}
