import type { TileDefinition } from '../types/game';

export const tileDefinitions: TileDefinition[] = [
  {
    id: 'ointment',
    name: '藥膏',
    icon: '膏',
    educationHint: '依照醫囑薄擦藥膏，避免自行增加次數。',
  },
  {
    id: 'looseSocks',
    name: '寬鬆襪子',
    icon: '襪',
    educationHint: '選擇寬鬆透氣襪子，降低腳趾壓迫與摩擦。',
  },
  {
    id: 'gloves',
    name: '手套',
    icon: '套',
    educationHint: '清潔或接觸刺激物時戴手套，保護指甲周圍皮膚。',
  },
  {
    id: 'moisturizer',
    name: '保濕用品',
    icon: '潤',
    educationHint: '規律保濕可減少乾裂，幫助皮膚屏障恢復。',
  },
  {
    id: 'cottonSwab',
    name: '棉棒',
    icon: '棉',
    educationHint: '可用乾淨棉棒輕柔清潔，避免用尖銳物挖指甲溝。',
  },
  {
    id: 'redness',
    name: '紅腫區',
    icon: '腫',
    educationHint: '紅腫疼痛加劇或化膿時，應盡快就醫。',
  },
];

export const playableTileTypes = tileDefinitions.map((tile) => tile.id);
