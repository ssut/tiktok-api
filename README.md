# @ssut/tiktok-api

Fully-typed TikTok web API client that REALLY works—handles URL signing, msToken rotation, retries, and helpers for profiles, posts, and challenges.

## Highlights

- Official TikTok web endpoints with automatic URL signing handled for you
- msToken extraction/rotation, retry with backoff, proxy support
- Dual builds (ESM + CJS) with full TypeScript types
- Pagination helpers for posts, followers, following, comments, and challenges

## Installation

```bash
npm install @ssut/tiktok-api
npm install axios async-retry https-proxy-agent
```

## Quick Start

```typescript
import { TikTokClient, PostItemRequestType } from "@ssut/tiktok-api";

const client = new TikTokClient({ region: "US" });

const user = await client.getUser("username");
const posts = await client.getUserPosts(user.data?.userInfo.user.secUid ?? "", {
  postLimit: 10,
  requestType: PostItemRequestType.Popular,
});
const comments = await client.getPostComments("7574735526134058262", 20);
```

## API Overview

- `new TikTokClient({ region, proxy?, msToken? })`
- `getUser(username)`
- `getUserPosts(secUid, { postLimit?, nextCursor?, requestType? })`
- `getUserFollowers(secUid, { followerLimit?, count?, cursor? })`
- `getUserFollowing(secUid, { followingLimit?, count?, cursor? })`
- `getPost(itemId)`
- `getPostComments(awemeId, count?, { cursor? })`
- `getCommentReplies(awemeId, commentId, count?, { cursor? })`
- `getChallenge(hashtag)`

## Client Options

- `region` (required) – e.g. `"US"`
- `proxy` (optional) – HTTP proxy URL
- `msToken` (optional) – seed token; auto-rotates afterward

## Types

All exports are fully typed:

```typescript
import type {
  TiktokStalkUserResponse,
  TiktokUserDetailResponse,
  TiktokUserFollowersResponse,
  TiktokUserFollowingResponse,
  TiktokUserPostsResponse,
  TiktokPostItem,
  TiktokChallengeResponse,
  PostItemRequestType,
  TiktokError,
} from "@ssut/tiktok-api";
```

## Error Codes

```typescript
enum TiktokError {
  HASHTAG_NOT_EXIST = 10205,
  HASHTAG_BLACK_LIST = 10209,
  HASHTAG_SENSITIVITY_WORD = 10211,
  HASHTAG_UNSHELVE = 10212,
  USER_BAN = 10221,
  USER_PRIVATE = 10222,
  USER_NOT_EXIST = 10202,
  INVALID_ENTITY = 10201,
}
```

## References

- [tiktok-web-reverse-engineering](https://github.com/justbeluga/tiktok-web-reverse-engineering) — X-Bogus and X-Gnarly implementation details

## License

ISC

Forked from `@rediska1114/tiktok-api` (ISC); credits to the original authors.
