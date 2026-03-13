export function parseUrl(url) {
  const platformList = ["instagram", "youtube", "tiktok", "twitter", "x"]; // twitter, x

  const platform_domains = (platform) => [
    `${platform}.com`,
    `www.${platform}.com`,
    `${platform.substr(0, 5)}.${platform.substr(5)}`,
    `m.${platform}.com`,
  ];

  const platform = platformList.find((p) =>
    platform_domains(p).some((domain) => url.includes(domain))
  );

  if (platform === "instagram") {
    const patterns = [
      { type: "post", regex: /\/p\/([^/?]+)/ },
      { type: "reel", regex: /\/reel\/([^/?]+)/ },
      { type: "igtv", regex: /\/tv\/([^/?]+)/ },
      { type: "story", regex: /\/stories\/([^/?]+)\/([^/?]+)/ },
      { type: "reels", regex: /\/reels\/([^/?]+)/ },
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern.regex);
      if (match) {
        return {
          platform: platform,
          type: pattern.type,
          id: match[1],
          fullMatch: match[0],
        };
      }
    }
  }

  if (platform === "youtube") {
    const patterns = [
      {
        type: "video",
        regex:
          /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      },
      { type: "shorts", regex: /youtube\.com\/shorts\/([^&\n?#]+)/ },
      { type: "live", regex: /youtube\.com\/live\/([^&\n?#]+)/ },
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern.regex);
      if (match) {
        return {
          platform: platform,
          type: pattern.type,
          id: match[1],
          fullMatch: match[0],
        };
      }
    }
  }

  if (platform === "tiktok") {
    const patterns = [{ type: "video", regex: /\/video\/([^/?]+)/ }];

    for (const pattern of patterns) {
      const match = url.match(pattern.regex);
      if (match) {
        return {
          platform: platform,
          type: pattern.type,
          id: match[1],
          fullMatch: match[0],
        };
      }
    }
  }

  if (platform === "x") {
    const patterns = [{ type: "tweet", regex: /\/status\/([^/?]+)/ }];

    for (const pattern of patterns) {
      const match = url.match(pattern.regex);
      if (match) {
        return {
          platform: platform,
          type: pattern.type,
          id: match[1],
          fullMatch: match[0],
        };
      }
    }
  }

  return null;
}
