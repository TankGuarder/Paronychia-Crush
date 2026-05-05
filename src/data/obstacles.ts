import type { ObstacleDefinition } from '../types/game';
import redParonychiaIcon from '../assets/icons/red-paronychia.svg';
import woundedParonychiaIcon from '../assets/icons/wounded-paronychia.svg';

export const obstacleDefinitions: ObstacleDefinition[] = [
  {
    id: 'redParonychia',
    name: '發紅甲溝炎手指',
    icon: redParonychiaIcon,
    hint: '四方向相鄰的任何主方塊被消除時，就可以清除。',
  },
  {
    id: 'woundedParonychia',
    name: '有傷口的甲溝炎手指',
    icon: woundedParonychiaIcon,
    hint: '四方向相鄰的任何主方塊被消除時，就可以清除。',
  },
];
