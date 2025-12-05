import { DEFAULT_MS_TOKEN } from '../../constants/tokens';
import { generateDeviceId, generateOdinId } from '../../utils/helpers';

const LANG = 'en';

export const getUserFollowingParams = ({
  userAgent,
  count,
  cursor,
  secUid,
  msToken,
  region,
}: {
  userAgent: string;
  count: number;
  cursor: number;
  secUid: string;
  msToken?: string;
  region: string;
}) => {
  return {
    WebIdLastTime: Date.now(),
    aid: 1988,
    app_language: `${LANG}-${region}`,
    app_name: 'tiktok_web',
    browser_language: `${LANG}-${region}`,
    browser_name: 'Mozilla',
    browser_online: true,
    browser_platform: 'MacIntel',
    browser_version: userAgent.replace('Mozilla/', ''),
    channel: 'tiktok_web',
    cookie_enabled: true,
    count,
    current_region: region,
    data_collection_enabled: true,
    device_id: generateDeviceId(),
    device_platform: 'web_pc',
    focus_state: true,
    from_page: 'user',
    history_len: 3,
    is_fullscreen: false,
    is_non_personalized: false,
    is_page_visible: true,
    maxCursor: cursor,
    minCursor: cursor,
    odinId: generateOdinId(),
    os: 'mac',
    priority_region: region,
    referer: '',
    region,
    scene: 21,
    screen_height: 1440,
    screen_width: 2560,
    secUid,
    tz_name: 'UTC',
    user_is_login: false,
    webcast_language: `${LANG}-${region}`,
    msToken: msToken ?? DEFAULT_MS_TOKEN,
  };
};
