export const animationConfig = {
  training: {
    beginner: {
      player: 1000,
      computer: 300,
    },
    experienced: {
      player: 300,
      computer: 100,
    },
    pro: {
      player: 50,
      computer: 50,
    },
  },
  timed: {
    player: 50,
    computer: 50,
  },
  local: {
    player: 50,
    computer: 50,
  },
  online: {
    player: 50,
    computer: 50,
  },
} as const;

export type AnimationConfigMode = keyof typeof animationConfig;
export type AnimationConfigPreset = keyof typeof animationConfig.training;