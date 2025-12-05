import type {
  StatsUserProfile,
  StatsV2UserProfile,
  UserProfile,
} from '../getUser/types';

export type FollowerUserProfile = Partial<UserProfile> &
  Pick<
    UserProfile,
    | 'avatarLarger'
    | 'avatarMedium'
    | 'avatarThumb'
    | 'id'
    | 'nickname'
    | 'secUid'
    | 'uniqueId'
  > & {
    [key: string]: unknown;
  };

export type TiktokUserFollower = {
  stats: StatsUserProfile;
  statsV2: StatsV2UserProfile;
  user: FollowerUserProfile;
};

export type TiktokUserFollowersAPIResponse = {
  extra: {
    fatal_item_ids: unknown[];
    logid: string;
    now: number;
  };
  hasMore: boolean;
  isTruncated: boolean;
  log_pb: {
    impr_id: string;
  };
  minCursor: number;
  statusCode: number;
  status_code: number;
  status_msg: string;
  total: number;
  userList: TiktokUserFollower[];
};

export type TiktokUserFollowersResponse = {
  error?: string;
  statusCode?: number;
  data: TiktokUserFollower[] | null;
  totalFollowers: number;
  hasMore?: boolean;
  cursor?: number;
};
