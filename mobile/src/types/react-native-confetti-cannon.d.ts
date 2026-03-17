declare module 'react-native-confetti-cannon' {
  import { Component } from 'react';
  import { ViewStyle } from 'react-native';

  interface ConfettiCannonProps {
    count?: number;
    origin?: { x: number; y: number };
    explosionSpeed?: number;
    fallSpeed?: number;
    fadeOut?: boolean;
    autoStart?: boolean;
    autoStartDelay?: number;
    onAnimationStart?: () => void;
    onAnimationResume?: () => void;
    onAnimationStop?: () => void;
    onAnimationEnd?: () => void;
    colors?: string[];
    style?: ViewStyle;
  }

  export default class ConfettiCannon extends Component<ConfettiCannonProps> {
    start(): void;
    stop(): void;
    resume(): void;
  }
}
