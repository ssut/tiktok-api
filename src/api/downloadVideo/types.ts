export interface TiktokAuthor {
  uid: string;
  username: string;
  uniqueId: string;
  nickname: string;
  signature: string;
  region: string;
  avatarThumb: string[];
  avatarMedium: string[];
  url: string;
}

export interface TiktokStatistics {
  commentCount: number;
  likeCount: number;
  shareCount: number;
  playCount: number;
  downloadCount: number;
}

export interface TiktokMusic {
  id: string;
  title: string;
  author: string;
  album: string;
  playUrl: string[];
  coverLarge: string[];
  coverMedium: string[];
  coverThumb: string[];
  duration: number;
  isCommerceMusic: boolean;
  isOriginalSound: boolean;
  isAuthorArtist: boolean;
}

export interface TiktokVideoFormat {
  url: string;
  format_id: string;
  format_note?: string;
  width?: number;
  height?: number;
  resolution?: string;
  vcodec?: string;
  acodec?: string;
  bitrate?: number;
  fps?: number;
  filesize?: number;
  has_watermark?: boolean;
  quality?: string;
}

export interface TiktokVideo {
  ratio: string;
  duration: number;
  playAddr: string[];
  downloadAddr: string[];
  cover: string[];
  dynamicCover: string[];
  originCover: string[];
  formats?: TiktokVideoFormat[];
}

export interface TiktokVideoResult {
  type: 'video';
  id: string;
  createTime: number;
  desc: string;
  isTurnOffComment: boolean;
  hashtag: string[];
  isADS: boolean;
  author: TiktokAuthor;
  statistics: TiktokStatistics;
  video: TiktokVideo;
  music: TiktokMusic;
}

export interface TiktokImageResult {
  type: 'image';
  id: string;
  createTime: number;
  desc: string;
  isTurnOffComment: boolean;
  hashtag: string[];
  isADS: boolean;
  author: TiktokAuthor;
  statistics: TiktokStatistics;
  images: string[];
  music: TiktokMusic;
}

export interface TiktokDownloadResponse {
  status: 'success' | 'error';
  message?: string;
  result?: TiktokVideoResult | TiktokImageResult;
  resultNotParsed?: {
    content: TiktokAwemeItem;
    statistics: TiktokStatistics;
    author: TiktokAuthor;
    music: TiktokMusic;
    formats?: TiktokVideoFormat[];
  };
}

// API Response Types for TikTok v1 Feed endpoint
export interface TiktokVideoData {
  width?: number;
  height?: number;
  ratio?: string;
  duration?: number;
  is_bytevc1?: boolean;
  is_h265?: boolean;
  has_watermark?: boolean;
  play_addr?: {
    url_list?: string[];
    data_size?: number;
    width?: number;
    height?: number;
  };
  download_addr?: {
    url_list?: string[];
    data_size?: number;
    width?: number;
    height?: number;
  };
  play_addr_h264?: {
    url_list?: string[];
    data_size?: number;
    width?: number;
    height?: number;
  };
  play_addr_bytevc1?: {
    url_list?: string[];
    data_size?: number;
    width?: number;
    height?: number;
  };
  cover?: {
    url_list?: string[];
  };
  dynamic_cover?: {
    url_list?: string[];
  };
  origin_cover?: {
    url_list?: string[];
  };
  bit_rate?: Array<{
    play_addr?: {
      url_list?: string[];
      data_size?: number;
      width?: number;
      height?: number;
    };
    gear_name?: string;
    bit_rate?: number;
    is_bytevc1?: boolean;
    is_h265?: boolean;
    FPS?: number;
    quality_type?: string;
  }>;
}

export interface TiktokAuthorData {
  uid?: string;
  unique_id?: string;
  nickname?: string;
  signature?: string;
  region?: string;
  avatar_thumb?: {
    url_list?: string[];
  };
  avatar_medium?: {
    url_list?: string[];
  };
}

export interface TiktokMusicData {
  id?: string | number;
  title?: string;
  author?: string;
  album?: string;
  duration?: number;
  is_commerce_music?: boolean;
  is_original_sound?: boolean;
  is_author_artist?: boolean;
  play_url?: {
    url_list?: string[];
  };
  cover_large?: {
    url_list?: string[];
  };
  cover_medium?: {
    url_list?: string[];
  };
  cover_thumb?: {
    url_list?: string[];
  };
}

export interface TiktokStatisticsData {
  comment_count?: number;
  digg_count?: number;
  share_count?: number;
  play_count?: number;
  download_count?: number;
}

export interface TiktokTextExtra {
  hashtag_name?: string;
}

export interface TiktokImagePostInfo {
  images?: Array<{
    display_image?: {
      url_list?: string[];
    };
  }>;
}

export interface TiktokAwemeItem {
  aweme_id?: string;
  create_time?: number;
  desc?: string;
  item_comment_settings?: number;
  is_ads?: boolean;
  video?: TiktokVideoData;
  author?: TiktokAuthorData;
  music?: TiktokMusicData;
  statistics?: TiktokStatisticsData;
  text_extra?: TiktokTextExtra[];
  image_post_info?: TiktokImagePostInfo;
}

export interface TiktokAPIResponse {
  aweme_list?: TiktokAwemeItem[];
  status_code?: number;
}
