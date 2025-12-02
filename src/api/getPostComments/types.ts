export type TiktokPostCommentsResponse = {
  error?: string;
  statusCode?: number;
  data: TiktokComment[] | null;
  total: number;
  hasMore?: boolean;
  cursor?: number;
};

export interface TiktokCommentListAPIResponse {
  alias_comment_deleted: boolean;
  comments: TiktokComment[];
  cursor: number;
  extra: {
    api_debug_info: unknown;
    fatal_item_ids: unknown;
    now: number;
  };
  has_filtered_comments: number;
  has_more: number;
  log_pb: { impr_id: string };
  reply_style: number;
  status_code: number;
  status_msg: string;
  top_gifts: unknown;
  total: number;
}

export interface TiktokCommentReplyListAPIResponse {
  comments: TiktokComment[];
  cursor: number;
  extra: {
    fatal_item_ids: unknown[];
    logid: string;
    now: number;
  };
  has_more: number;
  log_pb: { impr_id: string };
  status_code: number;
  status_msg: string;
  total: number;
}

export interface TiktokComment {
  allow_download_photo?: boolean;
  author_pin?: boolean;
  aweme_id: string;
  cid: string;
  collect_stat?: number;
  comment_language?: string;
  comment_post_item_ids?: unknown;
  create_time: number;
  digg_count: number;
  fold_status?: number;
  image_list?: CommentImage[] | null;
  is_author_digged?: boolean;
  is_comment_translatable?: boolean;
  is_high_purchase_intent?: boolean;
  label_list?: unknown;
  no_show?: boolean;
  reply_comment?: unknown;
  reply_comment_total?: number;
  reply_id?: string;
  reply_to_reply_id?: string;
  share_info?: CommentShareInfo;
  sort_extra_score?: {
    reply_score?: number;
    show_more_score?: number;
  };
  sort_tags?: string;
  status?: number;
  stick_position?: number;
  text: string;
  text_extra: unknown[];
  trans_btn_style?: number;
  user: CommentUser;
  user_buried?: boolean;
  user_digged?: number;
}

export interface CommentUser {
  nickname: string;
  unique_id: string;
  uid: string;
  sec_uid: string;
  avatar_thumb?: {
    uri: string;
    url_list: string[];
    url_prefix?: string | null;
  };
  custom_verify?: string;
  enterprise_verify_reason?: string;
  predicted_age_group?: string;
  relative_users?: unknown;
  user_tags?: unknown;
  [key: string]: unknown;
}

export interface CommentImage {
  crop_url: CommentImageUrl;
  origin_url: CommentImageUrl;
}

export interface CommentImageUrl {
  height: number;
  uri: string;
  url_list: string[];
  url_prefix?: string | null;
  width: number;
}

export interface CommentShareInfo {
  acl: { code: number; extra: string };
  desc: string;
  title: string;
  url: string;
}
