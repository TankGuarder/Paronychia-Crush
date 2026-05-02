import type { TileDefinition } from '../types/game';
import cottonSwabIcon from '../assets/icons/cotton-swab.svg';
import frictionIcon from '../assets/icons/friction.svg';
import glovesIcon from '../assets/icons/gloves.svg';
import looseSocksIcon from '../assets/icons/loose-socks.svg';
import moisturizerIcon from '../assets/icons/moisturizer.svg';
import ointmentIcon from '../assets/icons/ointment.svg';
import rednessIcon from '../assets/icons/redness.svg';

export const tileDefinitions: TileDefinition[] = [
  {
    id: 'ointment',
    name: '藥膏',
    icon: ointmentIcon,
    educationHint: '依照醫囑薄擦藥膏，避免自行增加次數。',
  },
  {
    id: 'looseSocks',
    name: '寬鬆襪子',
    icon: looseSocksIcon,
    educationHint: '選擇寬鬆透氣襪子，降低腳趾壓迫與摩擦。',
  },
  {
    id: 'gloves',
    name: '手套',
    icon: glovesIcon,
    educationHint: '清潔或接觸刺激物時戴手套，保護指甲周圍皮膚。',
  },
  {
    id: 'moisturizer',
    name: '保濕用品',
    icon: moisturizerIcon,
    educationHint: '規律保濕可減少乾裂，幫助皮膚屏障恢復。',
  },
  {
    id: 'cottonSwab',
    name: '棉棒',
    icon: cottonSwabIcon,
    educationHint: '可用乾淨棉棒輕柔清潔，避免用尖銳物挖指甲溝。',
  },
  {
    id: 'redness',
    name: '紅腫區障礙',
    icon: rednessIcon,
    isObstacle: true,
    educationHint: '紅腫疼痛加劇或化膿時，應盡快就醫。',
  },
  {
    id: 'friction',
    name: '摩擦區障礙',
    icon: frictionIcon,
    isObstacle: true,
    educationHint: '鞋襪摩擦會刺激甲溝，應減少壓迫與反覆摩擦。',
  },
];

export const playableTileTypes = tileDefinitions
  .filter((tile) => tile.id !== 'friction')
  .map((tile) => tile.id);
