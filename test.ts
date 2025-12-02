import { TikTokClient } from "./dist/index.mjs";

async function posts() {
	// Test username - you can change this to any TikTok username
	const username = "jzb19700dqs";

	console.log("=== Testing TikTok API Library ===\n");

	try {
		const client = new TikTokClient({ region: "US" });

		// Get user profile
		console.log(`Fetching user profile for @${username}...`);
		const userResult = await client.getUser(username);

		if (userResult.error) {
			console.error("Error getting user:", userResult.error);
			return;
		}

		if (!userResult.data) {
			console.error("No user data returned");
			return;
		}

		console.log("User Profile:");
		console.log("  Username:", userResult.data.userInfo.user.uniqueId);
		console.log("  Nickname:", userResult.data.userInfo.user.nickname);
		console.log("  Verified:", userResult.data.userInfo.user.verified);
		console.log("  Followers:", userResult.data.userInfo.stats.followerCount);
		console.log("  Following:", userResult.data.userInfo.stats.followingCount);
		console.log("  Total Hearts:", userResult.data.userInfo.stats.heartCount);
		console.log("  Total Videos:", userResult.data.userInfo.stats.videoCount);
		console.log("  SecUid:", userResult.data.userInfo.user.secUid);
		console.log("");

		// Get user posts
		console.log(`Fetching posts for @${username}...`);
		const postsResult = await client.getUserPosts(
			userResult.data.userInfo.user.secUid,
		);

		if (postsResult.error) {
			console.error("Error getting posts:", postsResult.error);
			return;
		}

		console.log(`Total posts fetched: ${postsResult.totalPosts}\n`);

		if (postsResult.data) {
			let index = 1;
			for (const post of postsResult.data) {
				console.log(`Post ${index}:`);
				console.log("  ID:", post.id);
				console.log(
					"  Description:",
					post.desc.substring(0, 50) + (post.desc.length > 50 ? "..." : ""),
				);
				console.log("  Views:", post.stats.playCount);
				console.log("  Likes:", post.stats.diggCount);
				console.log("  Comments:", post.stats.commentCount);
				console.log("  Shares:", post.stats.shareCount);
				console.log(
					"  Created:",
					new Date(post.createTime * 1000).toLocaleDateString(),
				);

				if (post.video) {
					console.log("  Type: Video");
					console.log("  Duration:", post.video.duration + "s");
				} else if (post.imagePost) {
					console.log("  Type: Image Post");
					console.log("  Images:", post.imagePost.length);
				}
				console.log("");
				index += 1;
			}
		}

		console.log("=== Test completed successfully ===");
	} catch (error) {
		console.error("Test failed:", error.message);
		console.error(error);
	}
}

async function challenge() {
	// Test hashtag - you can change this to any TikTok hashtag
	const hashtag = "fyp";

	console.log(`\nFetching challenge info for #${hashtag}...`);

	try {
		const client = new TikTokClient({ region: "US" });
		const challengeResult = await client.getChallenge(hashtag);

		if (challengeResult.error) {
			console.error("Error getting challenge:", challengeResult.error);
			return;
		}

		console.log("Challenge Info:");
		console.log("  Hashtag:", challengeResult);
		console.log("\n=== Challenge test completed successfully ===");
	} catch (error) {
		console.error("Challenge test failed:", error.message);
		console.error(error);
	}
}

// challenge()
posts();
