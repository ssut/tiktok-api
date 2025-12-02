import { DEFAULT_MS_TOKEN } from '../../constants/tokens';
import { generateDeviceId, generateOdinId } from '../../utils/helpers';

const LANG = 'en';

type BaseParams = {
  userAgent: string;
  count: number;
  cursor: number;
  region: string;
  msToken?: string;
};

const baseParams = ({
  userAgent,
  count,
  cursor,
  region,
  msToken,
}: BaseParams) => ({
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
  cursor,
  data_collection_enabled: false,
  device_id: generateDeviceId(),
  device_platform: 'web_pc',
  enter_from: 'tiktok_web',
  focus_state: true,
  fromWeb: 1,
  from_page: 'video',
  history_len: 3,
  is_fullscreen: false,
  is_non_personalized: false,
  is_page_visible: true,
  odinId: generateOdinId(),
  os: 'mac',
  priority_region: '',
  referer: '',
  region,
  screen_height: 1440,
  screen_width: 2560,
  tz_name: 'UTC',
  user_is_login: false,
  webcast_language: `${LANG}-${region}`,
  msToken: msToken ?? DEFAULT_MS_TOKEN,
});

export const getPostCommentsParams = (
  args: BaseParams & { awemeId: string },
) => ({
  ...baseParams(args),
  aweme_id: args.awemeId,
});

export const getCommentRepliesParams = (
  args: BaseParams & { awemeId: string; commentId: string },
) => ({
  ...baseParams(args),
  item_id: args.awemeId,
  comment_id: args.commentId,
});
