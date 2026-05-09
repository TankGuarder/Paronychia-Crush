import gameBgmUrl from '../assets/audio/game-bgm.mp3';
import clearSoundUrl from '../assets/audio/shoot1.mp3';
import shuffleSoundUrl from '../assets/audio/warp1.mp3';
import { obstacleDefinitions } from '../data/obstacles';
import { tileDefinitions } from '../data/tiles';

let hasPreloadedGameAssets = false;

const preloadImage = (src: string) => {
  const image = new Image();
  image.decoding = 'async';
  image.src = src;
  if (image.decode) {
    void image.decode().catch(() => undefined);
  }
};

const preloadAudio = (src: string) => {
  const audio = new Audio();
  audio.preload = 'auto';
  audio.src = src;
  audio.load();
};

export const preloadGameAssets = () => {
  if (hasPreloadedGameAssets) {
    return;
  }

  hasPreloadedGameAssets = true;
  [...tileDefinitions, ...obstacleDefinitions].forEach((definition) => {
    if (definition.icon) {
      preloadImage(definition.icon);
    }
  });
  [gameBgmUrl, clearSoundUrl, shuffleSoundUrl].forEach(preloadAudio);
};
