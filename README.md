# @ssut/tiktok-api

Fully-typed TikTok web API client that REALLY works—handles URL signing, msToken rotation, retries, video downloads with format detection, and helpers for profiles, posts, and challenges.

## Highlights

- Official TikTok web endpoints with automatic URL signing handled for you
- msToken extraction/rotation, retry with backoff, proxy support
- Video download with detailed format information (resolution, codec, watermark status)
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

// Get user profile
const user = await client.getUser("username");

// Get user posts
const posts = await client.getUserPosts(user.data?.userInfo.user.secUid ?? "", {
  postLimit: 10,
  requestType: PostItemRequestType.Popular,
});

// Get post comments
const comments = await client.getPostComments("7574735526134058262", 20);

// Download video with format detection
const download = await client.downloadVideo("https://www.tiktok.com/@zachking/video/6768504823336815877");
if (download.status === "success" && download.result?.type === "video") {
  console.log("Available formats:", download.result.video.formats);
  // Formats include resolution, codec (h264/h265), watermark status, etc.
}
```

## API Overview

- `new TikTokClient({ region, proxy?, msToken?, tiktokApiHost? })`
- `getUser(username, overrides?)`
- `getUserPosts(secUid, { postLimit?, nextCursor?, requestType? } & overrides?)`
- `getUserFollowers(secUid, { followerLimit?, count?, cursor? } & overrides?)`
- `getUserFollowing(secUid, { followingLimit?, count?, cursor? } & overrides?)`
- `getPost(itemId, overrides?)`
- `getPostComments(awemeId, count?, { cursor? } & overrides?)`
- `getCommentReplies(awemeId, commentId, count?, { cursor? } & overrides?)`
- `getChallenge(hashtag, overrides?)`
- `downloadVideo(url, showOriginalResponse?, overrides?)`

## Client Options

- `region` (required) – e.g. `"US"`
- `proxy` (optional) – HTTP proxy URL for all requests
- `msToken` (optional) – seed token; auto-rotates afterward
- `tiktokApiHost` (optional) – custom API host (defaults to `"api16-normal-c-useast1a.tiktokv.com"`)

## Request Overrides

All methods support optional request overrides for per-request configuration:

```typescript
// Use proxy for specific request
await client.getUser("username", {
  proxy: "http://proxy.example.com:8080",
});

// Disable proxy for specific request (if set globally)
await client.downloadVideo(url, false, {
  proxy: null,
});

// Override region for specific request
await client.getPost(itemId, {
  region: "UK",
});
```

## Video Download Features

The `downloadVideo` method provides rich format information:

```typescript
const result = await client.downloadVideo(url);

if (result.status === "success" && result.result?.type === "video") {
  const formats = result.result.video.formats;

  // Each format includes:
  for (const format of formats || []) {
    console.log({
      url: format.url, // Direct download URL
      resolution: format.resolution, // e.g., "1080p", "720p", "480p"
      format_id: format.format_id, // e.g., "play_addr", "download_addr"
      format_note: format.format_note, // e.g., "Direct video", "Download video (watermarked)"
      vcodec: format.vcodec, // e.g., "h264", "h265"
      width: format.width, // Video width in pixels
      height: format.height, // Video height in pixels
      has_watermark: format.has_watermark, // Whether video has TikTok watermark
      quality: format.quality, // Quality level
      bitrate: format.bitrate, // Bitrate (if available)
      fps: format.fps, // Frames per second (if available)
    });
  }
}
```

## Types

All exports are fully typed:

```typescript
import type {
  // User types
  TiktokStalkUserResponse,
  TiktokUserDetailResponse,
  TiktokUserFollowersResponse,
  TiktokUserFollowingResponse,
  TiktokUserPostsResponse,
  TiktokPostItem,

  // Content types
  TiktokChallengeResponse,
  TiktokPostResponse,
  TiktokComment,

  // Download types
  TiktokDownloadResponse,
  TiktokVideoResult,
  TiktokImageResult,
  TiktokVideoFormat,
  TiktokAuthor,
  TiktokStatistics,
  TiktokMusic,
  TiktokVideo,

  // Enums
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
