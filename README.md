# @ssut/tiktok-api

TikTok API library for fetching user profiles, posts, and challenges using official TikTok API endpoints with URL signing (X-Bogus and X-Gnarly).
Forked from `@rediska1114/tiktok-api` (ISC); credits to the original authors.

## Installation

```bash
npm install @ssut/tiktok-api
```

## Peer Dependencies

This library requires the following peer dependencies:

```bash
npm install axios async-retry https-proxy-agent
```

## Usage

### ES Modules

```typescript
import { TikTokClient } from "@ssut/tiktok-api";

const client = new TikTokClient({ region: "US" });

// Get user profile
const userResult = await client.getUser("username");
if (userResult.error) {
  console.error("Error:", userResult.error);
} else if (userResult.data) {
  console.log("User:", userResult.data.userInfo.user);
  console.log("Stats:", userResult.data.userInfo.stats);
}

// Get user posts (pass msToken automatically managed by the client)
const postsResult = await client.getUserPosts(userResult.data?.userInfo.user.secUid ?? "", 10);
if (postsResult.error) {
  console.error("Error:", postsResult.error);
} else {
  console.log("Posts:", postsResult.data);
}

// Get comments for a post
const commentsResult = await client.getPostComments("7574735526134058262", 20);
if (commentsResult.error) {
  console.error("Comments error:", commentsResult.error);
} else {
  console.log("First comment text:", commentsResult.data?.[0]?.text);
  console.log("Next cursor:", commentsResult.cursor);
}

// Get replies for a specific comment
const repliesResult = await client.getCommentReplies("7574735526134058262", commentsResult.data?.[0]?.cid ?? "", 10);
if (repliesResult.error) {
  console.error("Replies error:", repliesResult.error);
} else {
  console.log("First reply:", repliesResult.data?.[0]?.text);
}

// Get challenge/hashtag info
const challengeResult = await client.getChallenge("fyp");
if (challengeResult.error) {
  console.error("Error:", challengeResult.error);
} else {
  console.log("Challenge:", challengeResult.data);
}
```

### CommonJS

```javascript
const { TikTokClient } = require("@ssut/tiktok-api");

const client = new TikTokClient({ region: "US" });

client.getUser("username").then((userResult) => {
  if (userResult.error) {
    console.error("Error:", userResult.error);
  } else if (userResult.data) {
    console.log("User:", userResult.data.userInfo.user);
  }
});
```

## API

### `new TikTokClient(options)`

Create a client with shared Axios instance, proxy, region, and msToken.

**Options:**

- `region` (string, required) - Region code, e.g. `'US'`
- `proxy` (string | null, optional) - HTTP proxy URL
- `msToken` (string, optional) - Initial msToken; will rotate automatically

### `client.getUser(username: string): Promise<TiktokStalkUserResponse>`

Fetch user profile information.

### `client.getUserPosts(secUid: string, postLimit?: number, options?: { nextCursor?: number }): Promise<TiktokUserPostsResponse>`

Fetch user posts with automatic msToken rotation and paginated cursor support (35 on first page, 16 afterwards). Items are returned as-is from the API; duplicates are filtered by `id`.

### `client.getPostComments(awemeId: string, count = 20, options?: { cursor?: number }): Promise<TiktokPostCommentsResponse>`

Fetch comments for a specific post. Items are returned as-is from the API; duplicates are filtered by `cid`. Returns `hasMore` and the last `cursor` when available.

### `client.getCommentReplies(awemeId: string, commentId: string, count = 20, options?: { cursor?: number }): Promise<TiktokPostCommentsResponse>`

Fetch replies for a given comment `commentId` under a post `awemeId`. Items are returned as-is from the API; duplicates filtered by `cid`, with pagination via `cursor`.

### `client.getChallenge(hashtag: string): Promise<{ error?: string; statusCode?: number; data: TiktokChallengeResponse | null }>`

Fetch challenge/hashtag details.

## Features

- ✅ Official TikTok API endpoints
- ✅ URL signing with X-Bogus (RC4) and X-Gnarly (ChaCha20)
- ✅ Automatic msToken extraction and rotation
- ✅ Retry logic with exponential backoff
- ✅ Proxy support
- ✅ Full TypeScript support
- ✅ Dual module format (ESM + CommonJS)
- ✅ Preserves directory structure for better tree-shaking

## Types

All TypeScript types are exported from the main module:

```typescript
import type {
  TiktokStalkUserResponse,
  TiktokUserDetailResponse,
  UserProfile,
  StatsUserProfile,
  StatsV2UserProfile,
  TiktokUserPostsAPIResponse,
  TiktokUserPostsResponse,
  TiktokPostItem,
  Posts,
  TiktokChallengeResponse,
  TiktokError,
} from "@ssut/tiktok-api";
```

## Error Handling

The library uses error codes from TikTok API:

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

This library uses URL signing techniques based on research from:

- [tiktok-web-reverse-engineering](https://github.com/justbeluga/tiktok-web-reverse-engineering) - X-Bogus and X-Gnarly signature implementation

## License

ISC
