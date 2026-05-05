import type { ObstacleDefinition } from '../types/game';
import paronychiaFingerIcon from '../assets/icons/paronychia-finger.png';

export const obstacleDefinitions: ObstacleDefinition[] = [
  {
    id: 'redParonychia',
    name: '發紅甲溝炎手指',
    icon: paronychiaFingerIcon,
    hint: '四方向相鄰的任何主方塊被消除時，就可以清除。',
  },
  {
    id: 'woundedParonychia',
    name: '有傷口的甲溝炎手指',
    icon: paronychiaFingerIcon,
    hint: '四方向相鄰的任何主方塊被消除時，就可以清除。',
  },
];
