import type { ObstacleDefinition } from '../types/game';
import redParonychiaIcon from '../assets/icons/red-paronychia.svg';
import woundedParonychiaIcon from '../assets/icons/wounded-paronychia.svg';

export const obstacleDefinitions: ObstacleDefinition[] = [
  {
    id: 'redParonychia',
    name: '發紅甲溝炎手指',
    icon: redParonychiaIcon,
    hint: '相鄰的藥膏、襪子、手套或乳液三消時可以清除；棉棒不能清除。',
  },
  {
    id: 'woundedParonychia',
    name: '有傷口的甲溝炎手指',
    icon: woundedParonychiaIcon,
    hint: '相鄰的任何主方塊三消時都可以清除。',
  },
];
