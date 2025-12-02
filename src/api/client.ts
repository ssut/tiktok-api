import retry from 'async-retry';
import Axios, { type AxiosInstance } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { TiktokError } from '../constants/errors';
import { RETRY_OPTIONS } from '../constants/retry';
import { TIKTOK_URL, USER_AGENT } from '../constants/urls';
import { extractMsToken } from '../utils/helpers';
import { signUrl } from '../utils/signUrl';
import { getChallengeParams } from './getChallenge/params';
import type { TiktokChallengeResponse } from './getChallenge/types';
// Params builders
import { getUserParams } from './getUser/params';

// Types
import type { TiktokStalkUserResponse } from './getUser/types';
import { getUserPostsParams } from './getUserPosts/params';
import type {
  TiktokPostItem,
  TiktokUserPostsAPIResponse,
  TiktokUserPostsResponse,
} from './getUserPosts/types';

type ClientOptions = {
  proxy?: string | null;
  region: string;
  msToken?: string;
};

const DEFAULT_POST_COUNT = 16;
const FIRST_PAGE_POST_COUNT = 35;

export class TikTokClient {
  private readonly axios: AxiosInstance;
  private readonly region: string;
  private msToken?: string;

  constructor(options: ClientOptions) {
    this.region = options.region;
    this.msToken = options.msToken;

    this.axios = Axios.create({
      headers: { 'user-agent': USER_AGENT },
      httpsAgent: options.proxy
        ? new HttpsProxyAgent(options.proxy)
        : undefined,
    });
  }

  /**
   * Fetch user profile details.
   */
  public async getUser(username: string): Promise<TiktokStalkUserResponse> {
    try {
      const sanitizedUsername = username.replace('@', '');
      let extractedMsToken: string | undefined;

      const data = await retry(async (bail) => {
        try {
          const params = getUserParams({
            username: sanitizedUsername,
            userAgent: USER_AGENT,
            msToken: this.msToken,
            region: this.region,
          });

          const signedUrl = signUrl({
            url: `${TIKTOK_URL}/api/user/detail`,
            params,
            body: '',
            userAgent: USER_AGENT,
          });

          const { data, headers } = await this.axios.get(signedUrl);

          const newMsToken = extractMsToken(headers['set-cookie']);
          if (newMsToken) {
            extractedMsToken = newMsToken;
            this.msToken = newMsToken;
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
      }, RETRY_OPTIONS);

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
  public async getChallenge(hashtag: string): Promise<{
    error?: string;
    statusCode?: number;
    data: TiktokChallengeResponse | null;
  }> {
    try {
      const data = await retry(async (bail) => {
        try {
          const params = getChallengeParams({
            hashtag,
            userAgent: USER_AGENT,
            msToken: this.msToken,
            region: this.region,
          });

          const signedUrl = signUrl({
            url: `${TIKTOK_URL}/api/challenge/detail`,
            params,
            body: '',
            userAgent: USER_AGENT,
          });

          const { data } =
            await this.axios.get<TiktokChallengeResponse>(signedUrl);

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
      }, RETRY_OPTIONS);

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
   * Fetch user posts with pagination.
   */
  public async getUserPosts(
    secUid: string,
    postLimit?: number,
    options?: { nextCursor?: number },
  ): Promise<TiktokUserPostsResponse> {
    try {
      const posts: TiktokPostItem[] = [];
      const seenIds = new Set<string>();
      let hasMore = true;
      let cursor = options?.nextCursor ?? 0;
      let isFirstPage = cursor === 0;
      let lastCursor: string | undefined;

      while (hasMore) {
        const count = isFirstPage ? FIRST_PAGE_POST_COUNT : DEFAULT_POST_COUNT;
        const pageResult = await this.fetchUserPostsPage(secUid, count, cursor);

        const list = pageResult?.itemList ?? [];
        for (const item of list) {
          if (seenIds.has(item.id)) continue;
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

  private async fetchUserPostsPage(
    secUid: string,
    count: number,
    cursor: number,
  ): Promise<TiktokUserPostsAPIResponse | null> {
    return retry(async (bail) => {
      try {
        const params = getUserPostsParams({
          userAgent: USER_AGENT,
          count,
          cursor,
          secUid,
          region: this.region,
          msToken: this.msToken,
        });

        const signedUrl = signUrl({
          url: `${TIKTOK_URL}/api/post/item_list`,
          params,
          userAgent: USER_AGENT,
        });

        const { data, headers } =
          await this.axios.get<TiktokUserPostsAPIResponse>(signedUrl);

        const newMsToken = headers['x-ms-token'] as string | undefined;
        if (newMsToken) {
          this.msToken = newMsToken;
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
    }, RETRY_OPTIONS);
  }
}
