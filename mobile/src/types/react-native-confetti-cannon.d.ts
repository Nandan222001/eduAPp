declare module 'react-native-confetti-cannon' {
  import { Component } from 'react';

  interface ConfettiCannonProps {
    count?: number;
    origin?: { x: number; y: number };
    explosionSpeed?: number;
    fallSpeed?: number;
    fadeOut?: boolean;
    autoStart?: boolean;
    autoStartDelay?: number;
    colors?: string[];
  }

  export default class ConfettiCannon extends Component<ConfettiCannonProps> {
    start(): void;
    stop(): void;
  }
}
