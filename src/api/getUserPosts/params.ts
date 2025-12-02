import { DEFAULT_MS_TOKEN } from '../../constants/tokens';
import { generateDeviceId, generateOdinId } from '../../utils/helpers';

const LANG = 'en';

export const getUserPostsParams = ({
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
    count,
    cursor,
    secUid,
    WebIdLastTime: Date.now(),
    aid: 1988,
    app_language: LANG,
    app_name: 'tiktok_web',
    browser_language: LANG,
    browser_name: 'Mozilla',
    browser_online: true,
    browser_platform: 'MacIntel',
    browser_version: userAgent.replace('Mozilla/', ''),
    channel: 'tiktok_web',
    cookie_enabled: true,
    clientABVersions: '',
    coverFormat: 0,
    data_collection_enabled: true,
    device_id: generateDeviceId(),
    device_platform: 'web_pc',
    focus_state: true,
    // enable_cache: false,
    from_page: 'user',
    history_len: 8,
    is_fullscreen: false,
    is_page_visible: true,
    needPinnedItemIds: true,
    language: LANG,
    odinId: generateOdinId(),
    os: 'mac',
    priority_region: '',
    post_item_list_request_type: 0,
    referer: '',
    region: region ?? 'GB',
    screen_height: 1440,
    screen_width: 2560,

    tz_name: 'UTC',
    user_is_login: false,
    video_encoding: 'mp4',
    webcast_language: LANG,
    msToken: msToken ?? DEFAULT_MS_TOKEN,
  };
};
