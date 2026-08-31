'use client';

import React from 'react';
import { RemoteModuleProps } from '../types';
import { CountdownSlideControls } from './countdown-slide-controls';
import { QuizSlideControls } from './quiz-slide-controls';
import { WheelSlideControls } from './wheel-slide-controls';
import { StandardSlideControls } from './standard-slide-controls';

export const AdaptiveSlideView: React.FC<RemoteModuleProps> = (props) => {
  const { tvState } = props;
  const layout = tvState.slideLayout;

  // 1. If slide is Countdown Task OR has a dedicated timer attached
  if (layout === 'COUNTDOWN_TASK' || (tvState.hasTimer && (tvState.timerDuration ?? 0) > 0)) {
    return <CountdownSlideControls {...props} />;
  }

  // 2. If slide is Interactive Quiz
  if (layout === 'INTERACTIVE_QUIZ' || tvState.quizQuestion) {
    return <QuizSlideControls {...props} />;
  }

  // 3. If slide is Game Wheel
  if (layout === 'GAME_WHEEL') {
    return <WheelSlideControls {...props} />;
  }

  // 4. Default: Standard Slide View with Presenter Notes
  return <StandardSlideControls {...props} />;
};
