import type { LiffInitState, LiffUserProfile } from '../types/game';

const mockProfile: LiffUserProfile = {
  lineUserId: 'local-dev-user',
  displayName: '本地測試玩家',
  mode: 'mock',
  isLoggedIn: false,
  isMock: true,
};

const makeBrowserProfile = (isLoggedIn: boolean): LiffUserProfile => ({
  lineUserId: 'browser-test-user',
  displayName: '瀏覽器測試玩家',
  mode: 'browser',
  isLoggedIn,
  isMock: true,
});

export const getLiffId = () => import.meta.env.VITE_LIFF_ID?.trim() ?? '';

export const initializeLiff = async (): Promise<LiffInitState> => {
  const liffId = getLiffId();

  if (!liffId) {
    return {
      isLoading: false,
      isConfigured: false,
      profile: mockProfile,
    };
  }

  try {
    const { default: liff } = await import('@line/liff');
    await liff.init({ liffId });

    const isLineClient = liff.isInClient();
    const isLoggedIn = liff.isLoggedIn();

    if (isLineClient && isLoggedIn) {
      const profile = await liff.getProfile();
      return {
        isLoading: false,
        isConfigured: true,
        profile: {
          lineUserId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
          mode: 'line',
          isLoggedIn,
          isMock: false,
        },
      };
    }

    return {
      isLoading: false,
      isConfigured: true,
      profile: makeBrowserProfile(isLoggedIn),
    };
  } catch (error) {
    return {
      isLoading: false,
      isConfigured: Boolean(liffId),
      error: error instanceof Error ? error.message : 'LIFF 初始化失敗',
      profile: mockProfile,
    };
  }
};
