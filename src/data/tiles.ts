import type { TileDefinition } from '../types/game';
import cottonSwabIcon from '../assets/icons/cotton-swab.svg';
import glovesIcon from '../assets/icons/gloves.svg';
import socksIcon from '../assets/icons/socks.svg';
import lotionIcon from '../assets/icons/lotion.svg';
import ointmentIcon from '../assets/icons/ointment.svg';

export const tileDefinitions: TileDefinition[] = [
  {
    id: 'ointment',
    name: '藥膏',
    icon: ointmentIcon,
    educationHint: '依照醫囑薄擦藥膏，避免自行增加次數。',
  },
  {
    id: 'socks',
    name: '襪子',
    icon: socksIcon,
    educationHint: '選擇寬鬆透氣襪子，降低腳趾壓迫與摩擦。',
  },
  {
    id: 'gloves',
    name: '手套',
    icon: glovesIcon,
    educationHint: '清潔或接觸刺激物時戴手套，保護指甲周圍皮膚。',
  },
  {
    id: 'lotion',
    name: '乳液',
    icon: lotionIcon,
    educationHint: '規律保濕可減少乾裂，幫助皮膚屏障恢復。',
  },
  {
    id: 'cottonSwab',
    name: '棉棒',
    icon: cottonSwabIcon,
    educationHint: '可用乾淨棉棒輕柔清潔，避免用尖銳物挖指甲溝。',
  },
];

export const playableTileTypes = tileDefinitions.map((tile) => tile.id);
