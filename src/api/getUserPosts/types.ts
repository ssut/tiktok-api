export enum PostItemRequestType {
  Latest = 0,
  Popular = 1,
  Oldest = 2,
}

export interface TiktokUserPostsAPIResponse {
  cursor: string;
  extra: Extra;
  hasMore: boolean;
  itemList: TiktokPostItem[];
  log_pb: LogPb;
  statusCode: number;
  status_code: number;
  status_msg: string;
}

export interface Extra {
  fatal_item_ids: unknown[];
  logid: string;
  now: number;
}

export interface LogPb {
  impr_id: string;
}

export interface TiktokPostItem {
  AIGCDescription: string;
  CategoryType: number;
  adAuthorization?: boolean;
  author: Author;
  authorStats: AuthorStats;
  authorStatsV2: AuthorStatsV2;
  backendSourceEventTracking: string;
  challenges: Challenge[];
  collected: boolean;
  contents: Content[];
  createTime: number;
  creatorAIComment: CreatorAIComment;
  desc: string;
  digged: boolean;
  diversificationId?: number;
  duetDisplay: number;
  duetEnabled?: boolean;
  forFriend: boolean;
  id: string;
  isAd: boolean;
  isPinnedItem?: boolean;
  isReviewing: boolean;
  itemCommentStatus: number;
  item_control: ItemControl;
  music: Music;
  officalItem: boolean;
  originalItem: boolean;
  privateItem: boolean;
  secret: boolean;
  shareEnabled: boolean;
  stats: Stats;
  statsV2: StatsV2;
  stitchDisplay: number;
  stitchEnabled?: boolean;
  textExtra: TextExtra[];
  textLanguage: string;
  textTranslatable: boolean;
  video: Video;
  imagePost?: ImagePost;
  aigcLabelType?: number;
  moderationAigcLabelType?: number;
  anchors?: Anchor[];
  videoSuggestWordsList?: VideoSuggestWordsList;
  event?: {
    event_id: string;
    event_start_time: number;
    has_subscribed: false;
    title: string;
  };
}

export interface Anchor {
  description: string;
  extraInfo: { subtype: string };
  icon: { urlList: string[] };
  id: string;
  keyword: string;
  logExtra: string;
  schema: string;
  thumbnail: { height: number; urlList: string[]; width: number };
  type: number;
}

export interface Author {
  UserStoryStatus: number;
  avatarLarger: string;
  avatarMedium: string;
  avatarThumb: string;
  commentSetting: number;
  downloadSetting: number;
  duetSetting: number;
  ftc: boolean;
  id: string;
  isADVirtual: boolean;
  isEmbedBanned: boolean;
  nickname: string;
  openFavorite: boolean;
  privateAccount: boolean;
  relation: number;
  secUid: string;
  secret: boolean;
  signature: string;
  stitchSetting: number;
  uniqueId: string;
  verified: boolean;
}

export interface AuthorStats {
  diggCount: number;
  followerCount: number;
  followingCount: number;
  friendCount: number;
  heart: number;
  heartCount: number;
  videoCount: number;
}

export interface AuthorStatsV2 {
  diggCount: string;
  followerCount: string;
  followingCount: string;
  friendCount: string;
  heart: string;
  heartCount: string;
  videoCount: string;
}

export interface Challenge {
  coverLarger: string;
  coverMedium: string;
  coverThumb: string;
  desc: string;
  id: string;
  profileLarger: string;
  profileMedium: string;
  profileThumb: string;
  title: string;
}

export interface Content {
  desc: string;
  textExtra?: TextExtra[];
}

export interface TextExtra {
  awemeId: string;
  end: number;
  hashtagName: string;
  isCommerce: boolean;
  secUid?: string;
  start: number;
  subType: number;
  type: number;
  userId?: string;
  userUniqueId?: string;
}

export interface CreatorAIComment {
  eligibleVideo: boolean;
  hasAITopic: boolean;
  notEligibleReason: number;
}

export interface ItemControl {
  can_comment?: boolean;
  can_creator_redirect?: boolean;
  can_music_redirect?: boolean;
  can_repost: boolean;
  can_share?: boolean;
}

export interface Music {
  authorName: string;
  coverLarge: string;
  coverMedium: string;
  coverThumb: string;
  duration: number;
  id: string;
  isCopyrighted: boolean;
  original: boolean;
  playUrl: string;
  private: boolean;
  title: string;
  tt2dsp: { tt_to_dsp_song_infos?: TtToDspSongInfo[] };
}

export interface TtToDspSongInfo {
  meta_song_id: string;
  platform: number;
  song_id: string;
  token?: { apple_music_token: { developer_token: string } };
}

export interface Stats {
  collectCount: number;
  commentCount: number;
  diggCount: number;
  playCount: number;
  shareCount: number;
}

export interface StatsV2 {
  collectCount: string;
  commentCount: string;
  diggCount: string;
  playCount: string;
  repostCount: string;
  shareCount: string;
}

export interface Video {
  PlayAddrStruct: PlayAddr;
  VQScore: string;
  bitrate: number;
  bitrateInfo: BitrateInfo[];
  claInfo: ClaInfo;
  codecType: string;
  cover: string;
  definition: string;
  downloadAddr: string;
  duration: number;
  dynamicCover: string;
  encodeUserTag: string;
  encodedType: string;
  format: string;
  height: number;
  id: string;
  originCover: string;
  playAddr: string;
  ratio: string;
  size: number;
  subtitleInfos?: SubtitleInfo[];
  videoID: string;
  videoQuality: string;
  volumeInfo: VolumeInfo;
  width: number;
  zoomCover: Record<string, string>;
}

export interface PlayAddr {
  DataSize: number;
  FileCs: string;
  FileHash: string;
  Height: number;
  Uri: string;
  UrlKey: string;
  UrlList: string[];
  Width: number;
}

export interface BitrateInfo {
  Bitrate: number;
  BitrateFPS: number;
  CodecType: string;
  Format: string;
  GearName: string;
  MVMAF: string;
  PlayAddr: PlayAddr;
  QualityType: number;
  VideoExtra: string;
}

export interface ClaInfo {
  enableAutoCaption: boolean;
  hasOriginalAudio: boolean;
  noCaptionReason?: number;
  captionInfos?: CaptionInfo[];
  captionsType?: number;
  originalLanguageInfo?: OriginalLanguageInfo;
}

export interface CaptionInfo {
  captionFormat: string;
  claSubtitleID: string;
  expire: string;
  isAutoGen: boolean;
  isOriginalCaption: boolean;
  language: string;
  languageCode: string;
  languageID: string;
  subID: string;
  subtitleType: string;
  translationType: string;
  url: string;
  urlList: string[];
  variant: string;
}

export interface OriginalLanguageInfo {
  canTranslateRealTimeNoCheck: boolean;
  language: string;
  languageCode: string;
  languageID: string;
}

export interface SubtitleInfo {
  Format: string;
  LanguageCodeName: string;
  LanguageID: string;
  Size: number;
  Source: string;
  Url: string;
  UrlExpire: number;
  Version: string;
}

export interface VolumeInfo {
  Loudness: number;
  Peak: number;
}

export interface VideoSuggestWordsList {
  video_suggest_words_struct: VideoSuggestWordsStruct[];
}

export interface VideoSuggestWordsStruct {
  hint_text: string;
  scene: string;
  words: VideoSuggestWord[];
}

export interface VideoSuggestWord {
  word: string;
  word_id: string;
}

export interface ImagePost {
  cover: ImageAsset;
  images: ImageAsset[];
  shareCover?: ImageAsset;
  title: string;
}

export interface ImageAsset {
  imageHeight: number;
  imageWidth: number;
  imageURL: {
    urlList: string[];
  };
}

// Backward compatible alias for previous "Posts" type
export type Posts = TiktokPostItem;

export type TiktokUserPostsResponse = {
  error?: string;
  statusCode?: number;
  data: TiktokPostItem[] | null;
  totalPosts: number;
  hasMore?: boolean;
  cursor?: string;
};
