import type { NextConfig } from "next";

// The tracker data changes at most daily (T9). Next already caches its hashed
// chunks immutably.
const daily = [
  {
    key: "Cache-Control",
    value: "public, max-age=3600, stale-while-revalidate=86400",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/data/tracker/bills/:id*", headers: daily },
      { source: "/data/:file*.csv", headers: daily },
    ];
  },
};

export default nextConfig;
