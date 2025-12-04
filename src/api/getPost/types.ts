import type { TiktokPostItem } from '../getUserPosts/types';

export type TiktokPostResponse = {
  error?: string;
  statusCode?: number;
  data: TiktokPostItem | null;
};

export type TiktokPostDetailAPIResponse = {
  extra?: {
    fatal_item_ids?: unknown[];
    logid?: string;
    now?: number;
  };
  itemInfo?: {
    itemStruct?: TiktokPostItem;
  };
  log_pb?: { impr_id: string };
  shareMeta?: {
    desc?: string;
    title?: string;
  };
  statusCode?: number;
  status_code?: number;
  status_msg?: string;
};
