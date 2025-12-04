import { DEFAULT_MS_TOKEN } from '../../constants/tokens';
import { generateDeviceId, generateOdinId } from '../../utils/helpers';

const LANG = 'en';

type ParamsInput = {
  userAgent: string;
  region: string;
  itemId: string;
  msToken?: string;
};

export const getPostParams = ({
  userAgent,
  region,
  itemId,
  msToken,
}: ParamsInput) => ({
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
  coverFormat: 2,
  data_collection_enabled: true,
  device_id: generateDeviceId(),
  device_platform: 'web_pc',
  focus_state: true,
  from_page: 'user',
  history_len: 6,
  is_fullscreen: false,
  is_page_visible: true,
  itemId,
  language: LANG,
  odinId: generateOdinId(),
  os: 'mac',
  priority_region: region ?? 'GB',
  referer: '',
  region: region ?? 'GB',
  root_referer: '',
  screen_height: 1080,
  screen_width: 1920,
  tz_name: 'UTC',
  user_is_login: false,
  video_encoding: 'mp4',
  webcast_language: LANG,
  msToken: msToken ?? DEFAULT_MS_TOKEN,
});
