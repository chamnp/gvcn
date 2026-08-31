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

  // 1. Explicit layout: Interactive Quiz (even if it also has a timer)
  if (layout === 'INTERACTIVE_QUIZ') {
    return <QuizSlideControls {...props} />;
  }

  // 2. Explicit layout: Game Wheel
  if (layout === 'GAME_WHEEL') {
    return <WheelSlideControls {...props} />;
  }

  // 3. Countdown Task OR any slide with a dedicated timer
  if (layout === 'COUNTDOWN_TASK' || (tvState.hasTimer && (tvState.timerDuration ?? 0) > 0)) {
    return <CountdownSlideControls {...props} />;
  }

  // 4. Fallback: quiz data present without explicit layout (legacy slides)
  if (tvState.quizQuestion) {
    return <QuizSlideControls {...props} />;
  }

  // 5. Default: Standard Slide View with Presenter Notes
  return <StandardSlideControls {...props} />;
};
