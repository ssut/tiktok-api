import retry, { type Options as RetryOptions } from 'async-retry';
import Axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { TiktokError } from '../constants/errors';
import { RETRY_OPTIONS } from '../constants/retry';
import { TIKTOK_URL, USER_AGENT } from '../constants/urls';
import { extractMsToken } from '../utils/helpers';
import { signUrl } from '../utils/signUrl';
import { buildTiktokApiParams } from './downloadVideo/params';
import type {
  TiktokAPIResponse,
  TiktokAuthor,
  TiktokAwemeItem,
  TiktokDownloadResponse,
  TiktokImageResult,
  TiktokMusic,
  TiktokStatistics,
  TiktokVideo,
  TiktokVideoFormat,
  TiktokVideoResult,
} from './downloadVideo/types';
import { getChallengeParams } from './getChallenge/params';
import type { TiktokChallengeResponse } from './getChallenge/types';
import { getPostParams } from './getPost/params';
import type {
  TiktokPostDetailAPIResponse,
  TiktokPostResponse,
} from './getPost/types';
import {
  getCommentRepliesParams,
  getPostCommentsParams,
} from './getPostComments/params';
import type {
  TiktokComment,
  TiktokCommentListAPIResponse,
  TiktokCommentReplyListAPIResponse,
  TiktokPostCommentsResponse,
} from './getPostComments/types';
// Params builders
import { getUserParams } from './getUser/params';
// Types
import type { TiktokStalkUserResponse } from './getUser/types';
import { getUserFollowersParams } from './getUserFollowers/params';
import type {
  TiktokUserFollower,
  TiktokUserFollowersAPIResponse,
  TiktokUserFollowersResponse,
} from './getUserFollowers/types';
import { getUserFollowingParams } from './getUserFollowing/params';
import { getUserPostsParams } from './getUserPosts/params';
import type {
  PostItemRequestType,
  TiktokPostItem,
  TiktokUserPostsAPIResponse,
  TiktokUserPostsResponse,
} from './getUserPosts/types';

type ClientOptions = {
  proxy?: string | null;
  region: string;
  msToken?: string;
  retryOptions?: RetryOptions;
  tiktokApiHost?: string;
};

type RequestOverrides = {
  proxy?: string | null;
  region?: string;
  msToken?: string;
  retryOptions?: RetryOptions;
};

const DEFAULT_POST_COUNT = 16;
const FIRST_PAGE_POST_COUNT = 35;

export class TikTokClient {
  private readonly axios: AxiosInstance;
  private readonly region: string;
  private readonly defaultHttpsAgent?: HttpsProxyAgent<string>;
  private readonly retryOptions: RetryOptions;
  private readonly tiktokApiHost: string;
  private msToken?: string;

  constructor(options: ClientOptions) {
    this.region = options.region;
    this.msToken = options.msToken;
    this.tiktokApiHost =
      options.tiktokApiHost || 'api16-normal-c-useast1a.tiktokv.com';

    this.defaultHttpsAgent = options.proxy
      ? new HttpsProxyAgent(options.proxy)
      : undefined;

    this.retryOptions = options.retryOptions
      ? { ...RETRY_OPTIONS, ...options.retryOptions }
      : RETRY_OPTIONS;

    this.axios = Axios.create({
      headers: { 'user-agent': USER_AGENT },
    });
  }

  private resolveRegion(overrides?: RequestOverrides): string {
    return overrides?.region ?? this.region;
  }

  private resolveMsToken(overrides?: RequestOverrides): string | undefined {
    return overrides?.msToken ?? this.msToken;
  }

  private resolveRetryOptions(overrides?: RetryOptions): RetryOptions {
    return overrides
      ? { ...this.retryOptions, ...overrides }
      : this.retryOptions;
  }

  private buildAxiosConfig(
    overrides?: RequestOverrides,
  ): AxiosRequestConfig | undefined {
    if (overrides?.proxy === undefined) {
      return this.defaultHttpsAgent
        ? { httpsAgent: this.defaultHttpsAgent }
        : undefined;
    }

    if (overrides.proxy) {
      return { httpsAgent: new HttpsProxyAgent(overrides.proxy) };
    }

    return { httpsAgent: undefined };
  }

  /**
   * Fetch user profile details.
   */
  public async getUser(
    username: string,
    overrides?: RequestOverrides,
  ): Promise<TiktokStalkUserResponse> {
    try {
      const sanitizedUsername = username.replace('@', '');
      let extractedMsToken: string | undefined;
      const axiosConfig = this.buildAxiosConfig(overrides);
      const region = this.resolveRegion(overrides);
      let activeMsToken = this.resolveMsToken(overrides);
      const retryOptions = this.resolveRetryOptions(overrides?.retryOptions);

      const data = await retry(async (bail) => {
        try {
          const params = getUserParams({
            username: sanitizedUsername,
            userAgent: USER_AGENT,
            msToken: activeMsToken,
            region,
          });

          const signedUrl = signUrl({
            url: `${TIKTOK_URL}/api/user/detail`,
            params,
            body: '',
            userAgent: USER_AGENT,
          });

          const { data, headers } = await this.axios.get(
            signedUrl,
            axiosConfig,
          );

          const newMsToken = extractMsToken(headers['set-cookie']);
          if (newMsToken) {
            extractedMsToken = newMsToken;
            this.msToken = newMsToken;
            activeMsToken = newMsToken;
          }

          if (
            data.statusCode === TiktokError.USER_NOT_EXIST ||
            data.statusCode === TiktokError.USER_BAN ||
            data.statusCode === TiktokError.USER_PRIVATE
          ) {
            bail(new Error('USER_NOT_EXIST'));
            return null;
          }

          return data;
        } catch (error: any) {
          if (
            error.response?.status === 400 ||
            error.response?.data?.statusCode === TiktokError.INVALID_ENTITY
          ) {
            bail(new Error('INVALID_ENTITY'));
            return null;
          }
          throw error;
        }
      }, retryOptions);

      return { data, msToken: extractedMsToken };
    } catch (error: any) {
      if (error?.message === 'USER_NOT_EXIST') {
        return {
          error: 'USER_NOT_EXIST',
          statusCode: TiktokError.USER_NOT_EXIST,
          data: null,
        };
      }

      return {
        error: 'UNKNOWN_ERROR',
        statusCode: 0,
        data: null,
      };
    }
  }

  /**
   * Fetch challenge (hashtag) details.
   */
  public async getChallenge(
    hashtag: string,
    overrides?: RequestOverrides,
  ): Promise<{
    error?: string;
    statusCode?: number;
    data: TiktokChallengeResponse | null;
  }> {
    try {
      const axiosConfig = this.buildAxiosConfig(overrides);
      const region = this.resolveRegion(overrides);
      let activeMsToken = this.resolveMsToken(overrides);
      const retryOptions = this.resolveRetryOptions(overrides?.retryOptions);

      const data = await retry(async (bail) => {
        try {
          const params = getChallengeParams({
            hashtag,
            userAgent: USER_AGENT,
            msToken: activeMsToken,
            region,
          });

          const signedUrl = signUrl({
            url: `${TIKTOK_URL}/api/challenge/detail`,
            params,
            body: '',
            userAgent: USER_AGENT,
          });

          const { data, headers } =
            await this.axios.get<TiktokChallengeResponse>(
              signedUrl,
              axiosConfig,
            );

          const newMsToken = extractMsToken(headers['set-cookie']);
          if (newMsToken) {
            this.msToken = newMsToken;
            activeMsToken = newMsToken;
          }

          if (data.statusCode === TiktokError.HASHTAG_NOT_EXIST) {
            bail(new Error('HASHTAG_NOT_EXIST'));
            return null;
          }

          return data;
        } catch (error: any) {
          if (
            error.response?.status === 400 ||
            error.response?.data?.statusCode === TiktokError.INVALID_ENTITY
          ) {
            bail(new Error('INVALID_ENTITY'));
            return null;
          }
          throw error;
        }
      }, retryOptions);

      return { data };
    } catch (error: any) {
      if (error?.message === 'HASHTAG_NOT_EXIST') {
        return {
          error: 'HASHTAG_NOT_EXIST',
          statusCode: TiktokError.HASHTAG_NOT_EXIST,
          data: null,
        };
      }

      return {
        error: 'UNKNOWN_ERROR',
        statusCode: 0,
        data: null,
      };
    }
  }

  /**
   * Fetch a single post by itemId.
   * @param itemId - awemeId
   */
  public async getPost(
    itemId: string,
    overrides?: RequestOverrides,
  ): Promise<TiktokPostResponse> {
    try {
      const data = await this.fetchPost(itemId, overrides);
      const statusCode = data?.statusCode ?? data?.status_code ?? 0;
      const item = data?.itemInfo?.itemStruct;

      if (!item) {
        return {
          error: 'VIDEO_NOT_FOUND',
          statusCode,
          data: null,
        };
      }

      return {
        data: item,
        statusCode,
      };
    } catch (err: any) {
      if (
        err.status === 400 ||
        (err.response?.data &&
          (err.response.data.statusCode === TiktokError.INVALID_ENTITY ||
            err.response.data.status_code === TiktokError.INVALID_ENTITY))
      ) {
        return {
          error: 'INVALID_ENTITY',
          statusCode: TiktokError.INVALID_ENTITY,
          data: null,
        };
      }

      if (err.message === 'EMPTY_RESPONSE') {
        return {
          error: 'EMPTY_RESPONSE',
          statusCode: 0,
          data: null,
        };
      }

      return {
        error: 'UNKNOWN_ERROR',
        statusCode: 0,
        data: null,
      };
    }
  }

  /**
   * Fetch user posts with pagination.
   */
  public async getUserPosts(
    secUid: string,
    options?: {
      postLimit?: number;
      nextCursor?: number;
      requestType?: PostItemRequestType;
    } & RequestOverrides,
  ): Promise<TiktokUserPostsResponse> {
    try {
      const posts: TiktokPostItem[] = [];
      const seenIds = new Set<string>();
      let hasMore = true;
      let cursor = options?.nextCursor ?? 0;
      const postLimit = options?.postLimit ?? 35;
      let isFirstPage = cursor === 0;
      let lastCursor: string | undefined;

      while (hasMore) {
        const count = isFirstPage ? FIRST_PAGE_POST_COUNT : DEFAULT_POST_COUNT;
        const pageResult = await this.fetchUserPostsPage(
          secUid,
          count,
          cursor,
          options?.requestType,
          options,
        );

        const list = pageResult?.itemList ?? [];
        for (const item of list) {
          if (seenIds.has(item.id)) {
            continue;
          }
          posts.push(item);
          seenIds.add(item.id);
        }

        hasMore = Boolean(pageResult?.hasMore);
        if (pageResult?.cursor !== undefined) {
          lastCursor = String(pageResult.cursor);
        }
        cursor = hasMore ? Number(pageResult?.cursor ?? 0) : 0;
        isFirstPage = false;

        if (postLimit && posts.length >= postLimit) {
          hasMore = false;
        }
      }
      if (!posts.length) {
        return {
          error: 'USER_NOT_FOUND',
          statusCode: TiktokError.USER_NOT_EXIST,
          data: null,
          totalPosts: 0,
        };
      }

      const trimmedPosts = postLimit ? posts.slice(0, postLimit) : posts;

      return {
        data: trimmedPosts,
        totalPosts: trimmedPosts.length,
        hasMore,
        cursor: lastCursor,
      };
    } catch (err: any) {
      if (
        err.status === 400 ||
        (err.response?.data &&
          err.response.data.statusCode === TiktokError.INVALID_ENTITY)
      ) {
        return {
          error: 'VIDEO_NOT_FOUND',
          statusCode: TiktokError.INVALID_ENTITY,
          data: null,
          totalPosts: 0,
        };
      }

      if (err.message === 'EMPTY_RESPONSE') {
        return {
          error: 'EMPTY_RESPONSE',
          statusCode: 0,
          data: null,
          totalPosts: 0,
        };
      }

      return {
        error: 'UNKNOWN_ERROR',
        statusCode: 0,
        data: null,
        totalPosts: 0,
      };
    }
  }

  /**
   * Fetch followers for a given user.
   */
  public async getUserFollowers(
    secUid: string,
    options?: {
      followerLimit?: number;
      count?: number;
      cursor?: number;
    } & RequestOverrides,
  ): Promise<TiktokUserFollowersResponse> {
    try {
      const followers: TiktokUserFollower[] = [];
      const seenIds = new Set<string>();
      const count = options?.count ?? 30;
      const followerLimit = options?.followerLimit ?? count;
      let cursor = options?.cursor ?? 0;
      let hasMore = true;
      let lastCursor = cursor;

      while (hasMore) {
        const page = await this.fetchUserFollowersPage(
          secUid,
          count,
          cursor,
          options,
        );

        const statusCode = page?.statusCode ?? page?.status_code ?? 0;
        if (
          statusCode === TiktokError.USER_NOT_EXIST ||
          statusCode === TiktokError.USER_BAN ||
          statusCode === TiktokError.USER_PRIVATE
        ) {
          return {
            error: 'USER_NOT_FOUND',
            statusCode,
            data: null,
            totalFollowers: 0,
            hasMore: false,
            cursor: lastCursor,
          };
        }

        const list = page?.userList ?? [];
        for (const follower of list) {
          const key =
            follower.user?.id ||
            follower.user?.secUid ||
            follower.user?.uniqueId;
          if (key && seenIds.has(key)) {
            continue;
          }
          followers.push(follower);
          if (key) {
            seenIds.add(key);
          }
        }

        hasMore = Boolean(page?.hasMore);
        if (page?.minCursor !== undefined) {
          lastCursor = Number(page.minCursor);
        }
        cursor = hasMore ? Number(page?.minCursor ?? 0) : 0;

        if (!hasMore || list.length < count) {
          hasMore = false;
        }

        if (followerLimit && followers.length >= followerLimit) {
          hasMore = false;
        }

        if (hasMore && cursor === lastCursor && list.length === 0) {
          hasMore = false;
        }
      }

      const trimmedFollowers =
        followerLimit && followers.length > followerLimit
          ? followers.slice(0, followerLimit)
          : followers;

      return {
        data: trimmedFollowers,
        totalFollowers: trimmedFollowers.length,
        hasMore,
        cursor: lastCursor,
        statusCode: 0,
      };
    } catch (err: any) {
      if (
        err.status === 400 ||
        (err.response?.data &&
          (err.response.data.statusCode === TiktokError.INVALID_ENTITY ||
            err.response.data.status_code === TiktokError.INVALID_ENTITY))
      ) {
        return {
          error: 'INVALID_ENTITY',
          statusCode: TiktokError.INVALID_ENTITY,
          data: null,
          totalFollowers: 0,
        };
      }

      if (err.message === 'EMPTY_RESPONSE') {
        return {
          error: 'EMPTY_RESPONSE',
          statusCode: 0,
          data: null,
          totalFollowers: 0,
        };
      }

      return {
        error: 'UNKNOWN_ERROR',
        statusCode: 0,
        data: null,
        totalFollowers: 0,
      };
    }
  }

  /**
   * Fetch following list (users that the given user follows).
   */
  public async getUserFollowing(
    secUid: string,
    options?: {
      followingLimit?: number;
      count?: number;
      cursor?: number;
    } & RequestOverrides,
  ): Promise<TiktokUserFollowersResponse> {
    try {
      const following: TiktokUserFollower[] = [];
      const seenIds = new Set<string>();
      const count = options?.count ?? 30;
      const followingLimit = options?.followingLimit ?? count;
      let cursor = options?.cursor ?? 0;
      let hasMore = true;
      let lastCursor = cursor;

      while (hasMore) {
        const page = await this.fetchUserFollowingPage(
          secUid,
          count,
          cursor,
          options,
        );

        const statusCode = page?.statusCode ?? page?.status_code ?? 0;
        if (
          statusCode === TiktokError.USER_NOT_EXIST ||
          statusCode === TiktokError.USER_BAN ||
          statusCode === TiktokError.USER_PRIVATE
        ) {
          return {
            error: 'USER_NOT_FOUND',
            statusCode,
            data: null,
            totalFollowers: 0,
            hasMore: false,
            cursor: lastCursor,
          };
        }

        const list = page?.userList ?? [];
        for (const user of list) {
          const key = user.user?.id || user.user?.secUid || user.user?.uniqueId;
          if (key && seenIds.has(key)) continue;
          following.push(user);
          if (key) seenIds.add(key);
        }

        hasMore = Boolean(page?.hasMore);
        if (page?.minCursor !== undefined) {
          lastCursor = Number(page.minCursor);
        }
        cursor = hasMore ? Number(page?.minCursor ?? 0) : 0;

        if (!hasMore || list.length < count) {
          hasMore = false;
        }

        if (followingLimit && following.length >= followingLimit) {
          hasMore = false;
        }

        if (hasMore && cursor === lastCursor && list.length === 0) {
          hasMore = false;
        }
      }

      const trimmed =
        followingLimit && following.length > followingLimit
          ? following.slice(0, followingLimit)
          : following;

      return {
        data: trimmed,
        totalFollowers: trimmed.length,
        hasMore,
        cursor: lastCursor,
        statusCode: 0,
      };
    } catch (err: any) {
      if (
        err.status === 400 ||
        (err.response?.data &&
          (err.response.data.statusCode === TiktokError.INVALID_ENTITY ||
            err.response.data.status_code === TiktokError.INVALID_ENTITY))
      ) {
        return {
          error: 'INVALID_ENTITY',
          statusCode: TiktokError.INVALID_ENTITY,
          data: null,
          totalFollowers: 0,
        };
      }

      if (err.message === 'EMPTY_RESPONSE') {
        return {
          error: 'EMPTY_RESPONSE',
          statusCode: 0,
          data: null,
          totalFollowers: 0,
        };
      }

      return {
        error: 'UNKNOWN_ERROR',
        statusCode: 0,
        data: null,
        totalFollowers: 0,
      };
    }
  }

  /**
   * Fetch comments for a given post (aweme).
   */
  public async getPostComments(
    awemeId: string,
    count = 20,
    options?: { cursor?: number } & RequestOverrides,
  ): Promise<TiktokPostCommentsResponse> {
    try {
      const comments: TiktokComment[] = [];
      const seenIds = new Set<string>();
      let cursor = options?.cursor ?? 0;
      let hasMore = true;
      let lastCursor = cursor;

      while (hasMore) {
        const page = await this.fetchPostCommentsPage(
          awemeId,
          count,
          cursor,
          options,
        );

        const list = page?.comments ?? [];
        for (const c of list) {
          if (seenIds.has(c.cid)) continue;
          comments.push(c);
          seenIds.add(c.cid);
        }

        hasMore = Boolean(page?.has_more);
        if (page?.cursor !== undefined) {
          lastCursor = Number(page.cursor);
        }
        cursor = hasMore ? Number(page?.cursor ?? 0) : 0;

        if (!hasMore || list.length < count) {
          hasMore = false;
        }
      }

      return {
        data: comments,
        total: comments.length,
        hasMore,
        cursor: lastCursor,
      };
    } catch (err: any) {
      if (
        err.status === 400 ||
        (err.response?.data &&
          (err.response.data.statusCode === TiktokError.INVALID_ENTITY ||
            err.response.data.status_code === TiktokError.INVALID_ENTITY))
      ) {
        return {
          error: 'INVALID_ENTITY',
          statusCode: TiktokError.INVALID_ENTITY,
          data: null,
          total: 0,
        };
      }

      if (err.message === 'EMPTY_RESPONSE') {
        return {
          error: 'EMPTY_RESPONSE',
          statusCode: 0,
          data: null,
          total: 0,
        };
      }

      return {
        error: 'UNKNOWN_ERROR',
        statusCode: 0,
        data: null,
        total: 0,
      };
    }
  }

  /**
   * Download TikTok video/image content by URL (v1 API method)
   * @param url - TikTok URL
   * @param showOriginalResponse - Return unparsed response
   * @param overrides - Optional request overrides (proxy, region, etc.)
   */
  public async downloadVideo(
    url: string,
    showOriginalResponse?: boolean,
    overrides?: RequestOverrides,
  ): Promise<TiktokDownloadResponse> {
    const TIKTOK_URL_REGEX =
      /https:\/\/(?:m|t|www|vm|vt|lite)?\.?tiktok\.com\/((?:.*\b(?:(?:usr|v|embed|user|video|photo)\/|\?shareId=|&item_id=)(\d+))|\w+)/;
    const DL_USER_AGENT =
      'com.zhiliaoapp.musically/35.1.3 (Linux; U; Android 13; en_US; Pixel 7; Build/TD1A.220804.031; Cronet/58.0.2991.0)';

    try {
      // Validate URL
      if (!TIKTOK_URL_REGEX.test(url)) {
        return {
          status: 'error',
          message: 'Invalid TikTok URL',
        };
      }

      // Normalize URL
      const normalizedUrl = url.replace('https://vm', 'https://vt');

      // Get video ID by following redirects
      const axiosConfig = this.buildAxiosConfig(overrides);
      const request = await this.axios(normalizedUrl, {
        ...axiosConfig,
        method: 'GET',
        maxRedirects: 0,
        headers: {
          'User-Agent': DL_USER_AGENT,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        validateStatus: (status: number) => status >= 200 && status < 400,
      });

      const redirectUrl =
        request.headers.location ?? request.request?.res?.responseUrl ?? url;

      const matches = redirectUrl.match(/\d{17,21}/g);
      const videoId = matches ? matches[0] : null;

      if (!videoId) {
        return {
          status: 'error',
          message: 'Could not extract video ID from URL',
        };
      }

      // Fetch TikTok data from v1 API
      const data = await this.fetchTiktokVideoData(
        videoId,
        DL_USER_AGENT,
        overrides,
      );
      if (!data) {
        return {
          status: 'error',
          message: 'Failed to fetch TikTok data',
        };
      }

      const { content, author, statistics, music, formats } = data;

      // Return original response if requested
      if (showOriginalResponse) {
        return {
          status: 'success',
          resultNotParsed: data,
        };
      }

      // Create response based on content type (image or video)
      const result = content.image_post_info
        ? this.createImageResponse(content, author, statistics, music)
        : this.createVideoResponse(content, author, statistics, music, formats);

      return {
        status: 'success',
        result,
      };
    } catch (error) {
      return {
        status: 'error',
        message:
          error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  /**
   * Fetch replies for a specific comment under a post.
   */
  public async getCommentReplies(
    awemeId: string,
    commentId: string,
    count = 20,
    options?: { cursor?: number } & RequestOverrides,
  ): Promise<TiktokPostCommentsResponse> {
    try {
      const comments: TiktokComment[] = [];
      const seenIds = new Set<string>();
      let cursor = options?.cursor ?? 0;
      let hasMore = true;
      let lastCursor = cursor;

      while (hasMore) {
        const page = await this.fetchCommentRepliesPage(
          awemeId,
          commentId,
          count,
          cursor,
          options,
        );

        const list = page?.comments ?? [];
        for (const c of list) {
          if (seenIds.has(c.cid)) continue;
          comments.push(c);
          seenIds.add(c.cid);
        }

        hasMore = Boolean(page?.has_more);
        if (page?.cursor !== undefined) {
          lastCursor = Number(page.cursor);
        }
        cursor = hasMore ? Number(page?.cursor ?? 0) : 0;

        if (!hasMore || list.length < count) {
          hasMore = false;
        }
      }

      return {
        data: comments,
        total: comments.length,
        hasMore,
        cursor: lastCursor,
      };
    } catch (err: any) {
      if (
        err.status === 400 ||
        (err.response?.data &&
          (err.response.data.statusCode === TiktokError.INVALID_ENTITY ||
            err.response.data.status_code === TiktokError.INVALID_ENTITY))
      ) {
        return {
          error: 'INVALID_ENTITY',
          statusCode: TiktokError.INVALID_ENTITY,
          data: null,
          total: 0,
        };
      }

      if (err.message === 'EMPTY_RESPONSE') {
        return {
          error: 'EMPTY_RESPONSE',
          statusCode: 0,
          data: null,
          total: 0,
        };
      }

      return {
        error: 'UNKNOWN_ERROR',
        statusCode: 0,
        data: null,
        total: 0,
      };
    }
  }

  private async fetchUserPostsPage(
    secUid: string,
    count: number,
    cursor: number,
    requestType?: PostItemRequestType,
    overrides?: RequestOverrides,
  ): Promise<TiktokUserPostsAPIResponse | null> {
    const axiosConfig = this.buildAxiosConfig(overrides);
    const region = this.resolveRegion(overrides);
    let activeMsToken = this.resolveMsToken(overrides);
    const retryOptions = this.resolveRetryOptions(overrides?.retryOptions);

    return retry(async (bail) => {
      try {
        const params = getUserPostsParams({
          userAgent: USER_AGENT,
          count,
          cursor,
          secUid,
          region,
          msToken: activeMsToken,
          requestType,
        });

        const signedUrl = signUrl({
          url: `${TIKTOK_URL}/api/post/item_list`,
          params,
          userAgent: USER_AGENT,
        });

        const { data, headers } =
          await this.axios.get<TiktokUserPostsAPIResponse>(
            signedUrl,
            axiosConfig,
          );

        const newMsToken = headers['x-ms-token'] as string | undefined;
        if (newMsToken) {
          this.msToken = newMsToken;
          activeMsToken = newMsToken;
        }

        if (!data || (typeof data === 'string' && data === '')) {
          throw new Error('EMPTY_RESPONSE');
        }

        return data;
      } catch (error: any) {
        if (
          error.response?.status === 400 ||
          error.response?.data?.statusCode === TiktokError.INVALID_ENTITY
        ) {
          const invalidError: any = new Error('INVALID_ENTITY');
          invalidError.status = 400;
          bail(invalidError);
          return null;
        }
        throw error;
      }
    }, retryOptions);
  }

  private async fetchPostCommentsPage(
    awemeId: string,
    count: number,
    cursor: number,
    overrides?: RequestOverrides,
  ): Promise<TiktokCommentListAPIResponse | null> {
    const axiosConfig = this.buildAxiosConfig(overrides);
    const region = this.resolveRegion(overrides);
    let activeMsToken = this.resolveMsToken(overrides);
    const retryOptions = this.resolveRetryOptions(overrides?.retryOptions);

    return retry(async (bail) => {
      try {
        const params = getPostCommentsParams({
          userAgent: USER_AGENT,
          count,
          cursor,
          awemeId,
          region,
          msToken: activeMsToken,
        });

        const signedUrl = signUrl({
          url: `${TIKTOK_URL}/api/comment/list/`,
          params,
          userAgent: USER_AGENT,
        });

        const { data, headers } =
          await this.axios.get<TiktokCommentListAPIResponse>(
            signedUrl,
            axiosConfig,
          );

        const newMsToken = headers['x-ms-token'] as string | undefined;
        if (newMsToken) {
          this.msToken = newMsToken;
          activeMsToken = newMsToken;
        }

        if (!data || (typeof data === 'string' && data === '')) {
          throw new Error('EMPTY_RESPONSE');
        }

        return data;
      } catch (error: any) {
        if (
          error.response?.status === 400 ||
          error.response?.data?.statusCode === TiktokError.INVALID_ENTITY
        ) {
          const invalidError: any = new Error('INVALID_ENTITY');
          invalidError.status = 400;
          bail(invalidError);
          return null;
        }
        throw error;
      }
    }, retryOptions);
  }

  private async fetchCommentRepliesPage(
    awemeId: string,
    commentId: string,
    count: number,
    cursor: number,
    overrides?: RequestOverrides,
  ): Promise<TiktokCommentReplyListAPIResponse | null> {
    const axiosConfig = this.buildAxiosConfig(overrides);
    const region = this.resolveRegion(overrides);
    let activeMsToken = this.resolveMsToken(overrides);
    const retryOptions = this.resolveRetryOptions(overrides?.retryOptions);

    return retry(async (bail) => {
      try {
        const params = getCommentRepliesParams({
          userAgent: USER_AGENT,
          count,
          cursor,
          awemeId,
          commentId,
          region,
          msToken: activeMsToken,
        });

        const signedUrl = signUrl({
          url: `${TIKTOK_URL}/api/comment/list/reply/`,
          params,
          userAgent: USER_AGENT,
        });

        const { data, headers } =
          await this.axios.get<TiktokCommentReplyListAPIResponse>(
            signedUrl,
            axiosConfig,
          );

        const newMsToken = headers['x-ms-token'] as string | undefined;
        if (newMsToken) {
          this.msToken = newMsToken;
          activeMsToken = newMsToken;
        }

        if (!data || (typeof data === 'string' && data === '')) {
          throw new Error('EMPTY_RESPONSE');
        }

        return data;
      } catch (error: any) {
        if (
          error.response?.status === 400 ||
          error.response?.data?.statusCode === TiktokError.INVALID_ENTITY
        ) {
          const invalidError: any = new Error('INVALID_ENTITY');
          invalidError.status = 400;
          bail(invalidError);
          return null;
        }
        throw error;
      }
    }, retryOptions);
  }

  private async fetchUserFollowersPage(
    secUid: string,
    count: number,
    cursor: number,
    overrides?: RequestOverrides,
  ): Promise<TiktokUserFollowersAPIResponse | null> {
    const axiosConfig = this.buildAxiosConfig(overrides);
    const region = this.resolveRegion(overrides);
    let activeMsToken = this.resolveMsToken(overrides);
    const retryOptions = this.resolveRetryOptions(overrides?.retryOptions);

    return retry(async (bail) => {
      try {
        const params = getUserFollowersParams({
          userAgent: USER_AGENT,
          count,
          cursor,
          secUid,
          region,
          msToken: activeMsToken,
        });

        const signedUrl = signUrl({
          url: `${TIKTOK_URL}/api/user/list/`,
          params,
          userAgent: USER_AGENT,
        });

        const { data, headers } =
          await this.axios.get<TiktokUserFollowersAPIResponse>(
            signedUrl,
            axiosConfig,
          );

        const newMsToken = headers['x-ms-token'] as string | undefined;
        if (newMsToken) {
          this.msToken = newMsToken;
          activeMsToken = newMsToken;
        }

        if (!data || (typeof data === 'string' && data === '')) {
          throw new Error('EMPTY_RESPONSE');
        }

        return data;
      } catch (error: any) {
        if (
          error.response?.status === 400 ||
          error.response?.data?.statusCode === TiktokError.INVALID_ENTITY ||
          error.response?.data?.status_code === TiktokError.INVALID_ENTITY
        ) {
          const invalidError: any = new Error('INVALID_ENTITY');
          invalidError.status = 400;
          bail(invalidError);
          return null;
        }
        throw error;
      }
    }, retryOptions);
  }

  private async fetchUserFollowingPage(
    secUid: string,
    count: number,
    cursor: number,
    overrides?: RequestOverrides,
  ): Promise<TiktokUserFollowersAPIResponse | null> {
    const axiosConfig = this.buildAxiosConfig(overrides);
    const region = this.resolveRegion(overrides);
    let activeMsToken = this.resolveMsToken(overrides);
    const retryOptions = this.resolveRetryOptions(overrides?.retryOptions);

    return retry(async (bail) => {
      try {
        const params = getUserFollowingParams({
          userAgent: USER_AGENT,
          count,
          cursor,
          secUid,
          region,
          msToken: activeMsToken,
        });

        const signedUrl = signUrl({
          url: `${TIKTOK_URL}/api/user/list/`,
          params,
          userAgent: USER_AGENT,
        });

        const { data, headers } =
          await this.axios.get<TiktokUserFollowersAPIResponse>(
            signedUrl,
            axiosConfig,
          );

        const newMsToken = headers['x-ms-token'] as string | undefined;
        if (newMsToken) {
          this.msToken = newMsToken;
          activeMsToken = newMsToken;
        }

        if (!data || (typeof data === 'string' && data === '')) {
          throw new Error('EMPTY_RESPONSE');
        }

        return data;
      } catch (error: any) {
        if (
          error.response?.status === 400 ||
          error.response?.data?.statusCode === TiktokError.INVALID_ENTITY ||
          error.response?.data?.status_code === TiktokError.INVALID_ENTITY
        ) {
          const invalidError: any = new Error('INVALID_ENTITY');
          invalidError.status = 400;
          bail(invalidError);
          return null;
        }
        throw error;
      }
    }, retryOptions);
  }

  private async fetchTiktokVideoData(
    videoId: string,
    userAgent: string,
    overrides?: RequestOverrides,
  ): Promise<{
    content: TiktokAwemeItem;
    statistics: TiktokStatistics;
    author: TiktokAuthor;
    music: TiktokMusic;
    formats?: TiktokVideoFormat[];
  } | null> {
    const params = buildTiktokApiParams(videoId);
    const feedUrl = `https://${this.tiktokApiHost}/aweme/v1/feed/?${params}`;

    try {
      const response = await retry<TiktokAPIResponse>(
        async () => {
          const axiosConfig = this.buildAxiosConfig(overrides);
          const res = await this.axios<TiktokAPIResponse>(feedUrl, {
            ...axiosConfig,
            method: 'OPTIONS',
            headers: { 'User-Agent': userAgent },
          });

          if (res.data && res.data.status_code === 0) {
            return res.data;
          }

          throw new Error('Failed to fetch TikTok data');
        },
        {
          retries: 10,
          minTimeout: 200,
          maxTimeout: 1000,
        },
      );

      // Find the matching video in the response
      const content = response?.aweme_list?.find((v) => v.aweme_id === videoId);

      if (!content) {
        return null;
      }

      // Parse statistics with error handling
      let statistics: TiktokStatistics;
      try {
        statistics = {
          commentCount: content.statistics?.comment_count || 0,
          likeCount: content.statistics?.digg_count || 0,
          shareCount: content.statistics?.share_count || 0,
          playCount: content.statistics?.play_count || 0,
          downloadCount: content.statistics?.download_count || 0,
        };
      } catch {
        statistics = {
          commentCount: 0,
          likeCount: 0,
          shareCount: 0,
          playCount: 0,
          downloadCount: 0,
        };
      }

      // Parse author with error handling
      let author: TiktokAuthor;
      try {
        author = {
          uid: content.author?.uid || '',
          username: content.author?.unique_id || '',
          uniqueId: content.author?.unique_id || '',
          nickname: content.author?.nickname || '',
          signature: content.author?.signature || '',
          region: content.author?.region || '',
          avatarThumb: content.author?.avatar_thumb?.url_list || [],
          avatarMedium: content.author?.avatar_medium?.url_list || [],
          url: content.author?.unique_id
            ? `https://www.tiktok.com/@${content.author.unique_id}`
            : '',
        };
      } catch {
        author = {
          uid: '',
          username: '',
          uniqueId: '',
          nickname: '',
          signature: '',
          region: '',
          avatarThumb: [],
          avatarMedium: [],
          url: '',
        };
      }

      // Parse music with error handling
      let music: TiktokMusic;
      try {
        music = {
          id: String(content.music?.id || ''),
          title: content.music?.title || '',
          author: content.music?.author || '',
          album: content.music?.album || '',
          playUrl: content.music?.play_url?.url_list || [],
          coverLarge: content.music?.cover_large?.url_list || [],
          coverMedium: content.music?.cover_medium?.url_list || [],
          coverThumb: content.music?.cover_thumb?.url_list || [],
          duration: content.music?.duration || 0,
          isCommerceMusic: content.music?.is_commerce_music || false,
          isOriginalSound: content.music?.is_original_sound || false,
          isAuthorArtist: content.music?.is_author_artist || false,
        };
      } catch {
        music = {
          id: '',
          title: '',
          author: '',
          album: '',
          playUrl: [],
          coverLarge: [],
          coverMedium: [],
          coverThumb: [],
          duration: 0,
          isCommerceMusic: false,
          isOriginalSound: false,
          isAuthorArtist: false,
        };
      }

      // Extract video formats with resolution detection
      const formats = this.extractVideoFormats(content);

      return {
        content,
        statistics,
        author,
        music,
        formats,
      };
    } catch (error) {
      console.error('Error fetching TikTok data:', error);
      return null;
    }
  }

  private extractVideoFormats(content: TiktokAwemeItem): TiktokVideoFormat[] {
    const formats: TiktokVideoFormat[] = [];

    try {
      const video = content.video;
      if (!video) return formats;

      const width = video.width || 0;
      const height = video.height || 0;
      const ratio = width && height ? width / height : 0.5625;

      // Helper to determine resolution string
      const getResolution = (w?: number, h?: number): string => {
        if (!h) return '';
        if (h >= 2160) return '4K';
        if (h >= 1440) return '1440p';
        if (h >= 1080) return '1080p';
        if (h >= 720) return '720p';
        if (h >= 540) return '540p';
        if (h >= 480) return '480p';
        if (h >= 360) return '360p';
        return `${h}p`;
      };

      // Extract play_addr (direct video)
      if (video.play_addr?.url_list?.length) {
        const isH265 = video.is_bytevc1 || video.is_h265;
        formats.push({
          url: video.play_addr.url_list[0],
          format_id: 'play_addr',
          format_note: 'Direct video',
          width,
          height,
          resolution: getResolution(width, height),
          vcodec: isH265 ? 'h265' : 'h264',
          acodec: 'aac',
          filesize: video.play_addr.data_size,
          quality: 'high',
        });
      }

      // Extract download_addr (watermarked)
      if (video.download_addr?.url_list?.length) {
        const dlWidth = video.download_addr.width || width;
        const dlHeight =
          dlWidth && ratio ? Math.round(dlWidth / ratio) : height;
        formats.push({
          url: video.download_addr.url_list[0],
          format_id: 'download_addr',
          format_note: 'Download video (watermarked)',
          width: dlWidth,
          height: dlHeight,
          resolution: getResolution(dlWidth, dlHeight),
          vcodec: 'h264',
          acodec: 'aac',
          filesize: video.download_addr.data_size,
          has_watermark: true,
          quality: 'medium',
        });
      }

      // Extract play_addr_h264 if available
      if (video.play_addr_h264?.url_list?.length) {
        formats.push({
          url: video.play_addr_h264.url_list[0],
          format_id: 'play_addr_h264',
          format_note: 'H264 video',
          width: video.play_addr_h264.width || width,
          height: video.play_addr_h264.height || height,
          resolution: getResolution(
            video.play_addr_h264.width || width,
            video.play_addr_h264.height || height,
          ),
          vcodec: 'h264',
          acodec: 'aac',
          filesize: video.play_addr_h264.data_size,
          quality: 'high',
        });
      }

      // Extract play_addr_bytevc1 if available (H265)
      if (video.play_addr_bytevc1?.url_list?.length) {
        formats.push({
          url: video.play_addr_bytevc1.url_list[0],
          format_id: 'play_addr_bytevc1',
          format_note: 'H265 video',
          width: video.play_addr_bytevc1.width || width,
          height: video.play_addr_bytevc1.height || height,
          resolution: getResolution(
            video.play_addr_bytevc1.width || width,
            video.play_addr_bytevc1.height || height,
          ),
          vcodec: 'h265',
          acodec: 'aac',
          filesize: video.play_addr_bytevc1.data_size,
          quality: 'high',
        });
      }

      // Extract bit_rate variations (different quality levels)
      if (Array.isArray(video.bit_rate)) {
        for (const bitrate of video.bit_rate) {
          if (bitrate.play_addr?.url_list?.length) {
            const brWidth = bitrate.play_addr.width || width;
            const brHeight = bitrate.play_addr.height || height;
            const isH265 = bitrate.is_bytevc1 || bitrate.is_h265;

            formats.push({
              url: bitrate.play_addr.url_list[0],
              format_id: bitrate.gear_name || `bitrate_${bitrate.bit_rate}`,
              format_note: `${bitrate.gear_name || 'Bitrate'} video`,
              width: brWidth,
              height: brHeight,
              resolution: getResolution(brWidth, brHeight),
              vcodec: isH265 ? 'h265' : 'h264',
              acodec: 'aac',
              bitrate: bitrate.bit_rate,
              fps: bitrate.FPS,
              filesize: bitrate.play_addr.data_size,
              quality: bitrate.quality_type || 'normal',
            });
          }
        }
      }

      // Sort formats by quality (higher resolution first)
      formats.sort((a, b) => {
        const heightA = a.height || 0;
        const heightB = b.height || 0;
        if (heightA !== heightB) return heightB - heightA;

        // If same height, prefer non-watermarked
        if (a.has_watermark !== b.has_watermark) {
          return a.has_watermark ? 1 : -1;
        }

        return 0;
      });
    } catch (error) {
      console.error('Error extracting video formats:', error);
    }

    return formats;
  }

  private createImageResponse(
    content: TiktokAwemeItem,
    author: TiktokAuthor,
    statistics: TiktokStatistics,
    music: TiktokMusic,
  ): TiktokImageResult {
    try {
      return {
        type: 'image',
        id: content.aweme_id || '',
        createTime: content.create_time || 0,
        desc: content.desc || '',
        isTurnOffComment: content.item_comment_settings === 3,
        hashtag: Array.isArray(content.text_extra)
          ? content.text_extra
              .filter((x: any) => x?.hashtag_name !== undefined)
              .map((v: any) => v.hashtag_name)
          : [],
        isADS: content.is_ads || false,
        author,
        statistics,
        images: Array.isArray(content.image_post_info?.images)
          ? content.image_post_info.images
              .map((v: any) => v?.display_image?.url_list?.[0] || '')
              .filter(Boolean)
          : [],
        music,
      };
    } catch {
      return {
        type: 'image',
        id: '',
        createTime: 0,
        desc: '',
        isTurnOffComment: false,
        hashtag: [],
        isADS: false,
        author,
        statistics,
        images: [],
        music,
      };
    }
  }

  private createVideoResponse(
    content: TiktokAwemeItem,
    author: TiktokAuthor,
    statistics: TiktokStatistics,
    music: TiktokMusic,
    formats?: TiktokVideoFormat[],
  ): TiktokVideoResult {
    // Parse video inline with error handling
    let video: TiktokVideo;
    try {
      video = {
        ratio: content.video?.ratio || '',
        duration: content.video?.duration || 0,
        playAddr: content.video?.play_addr?.url_list || [],
        downloadAddr: content.video?.download_addr?.url_list || [],
        cover: content.video?.cover?.url_list || [],
        dynamicCover: content.video?.dynamic_cover?.url_list || [],
        originCover: content.video?.origin_cover?.url_list || [],
        formats: formats || [],
      };
    } catch {
      video = {
        ratio: '',
        duration: 0,
        playAddr: [],
        downloadAddr: [],
        cover: [],
        dynamicCover: [],
        originCover: [],
        formats: [],
      };
    }

    try {
      return {
        type: 'video',
        id: content.aweme_id || '',
        createTime: content.create_time || 0,
        desc: content.desc || '',
        isTurnOffComment: content.item_comment_settings === 3,
        hashtag: Array.isArray(content.text_extra)
          ? content.text_extra
              .filter((x: any) => x?.hashtag_name !== undefined)
              .map((v: any) => v.hashtag_name)
          : [],
        isADS: content.is_ads || false,
        author,
        statistics,
        video,
        music,
      };
    } catch {
      return {
        type: 'video',
        id: '',
        createTime: 0,
        desc: '',
        isTurnOffComment: false,
        hashtag: [],
        isADS: false,
        author,
        statistics,
        video,
        music,
      };
    }
  }

  private async fetchPost(
    itemId: string,
    overrides?: RequestOverrides,
  ): Promise<TiktokPostDetailAPIResponse | null> {
    const axiosConfig = this.buildAxiosConfig(overrides);
    const region = this.resolveRegion(overrides);
    let activeMsToken = this.resolveMsToken(overrides);
    const retryOptions = this.resolveRetryOptions(overrides?.retryOptions);

    return retry(async (bail) => {
      try {
        const params = getPostParams({
          userAgent: USER_AGENT,
          region,
          itemId,
          msToken: activeMsToken,
        });

        const signedUrl = signUrl({
          url: `${TIKTOK_URL}/api/item/detail/`,
          params,
          userAgent: USER_AGENT,
        });

        const { data, headers } =
          await this.axios.get<TiktokPostDetailAPIResponse>(
            signedUrl,
            axiosConfig,
          );

        const newMsToken = headers['x-ms-token'] as string | undefined;
        if (newMsToken) {
          this.msToken = newMsToken;
          activeMsToken = newMsToken;
        }

        if (!data || (typeof data === 'string' && data === '')) {
          throw new Error('EMPTY_RESPONSE');
        }

        return data;
      } catch (error: any) {
        if (
          error.response?.status === 400 ||
          error.response?.data?.statusCode === TiktokError.INVALID_ENTITY ||
          error.response?.data?.status_code === TiktokError.INVALID_ENTITY
        ) {
          const invalidError: any = new Error('INVALID_ENTITY');
          invalidError.status = 400;
          bail(invalidError);
          return null;
        }
        throw error;
      }
    }, retryOptions);
  }
}
