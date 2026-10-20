#!/usr/bin/env node

/**
 * Keep Neon database active by making periodic queries.
 * Run with: node scripts/keep-db-warm.js
 * Or: node scripts/keep-db-warm.js --once
 */

const https = require("https");

const VERCEL_URL = process.env.VERCEL_URL || "plotamour.vercel.app";
const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

function keepWarm() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Pinging database to keep it active...`);

  // Make a simple GET request to a lightweight endpoint
  // Using /api/projects as a read-only endpoint
  https
    .get(`https://${VERCEL_URL}/api/projects`, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        console.log(
          `[${new Date().toISOString()}] ✓ Database ping successful (status: ${res.statusCode})`
        );
      });
    })
    .on("error", (err) => {
      console.error(
        `[${new Date().toISOString()}] ✗ Ping failed:`,
        err.message
      );
    });
}

// Run once if --once flag is passed, otherwise run periodically
if (process.argv.includes("--once")) {
  keepWarm();
  process.exit(0);
} else {
  console.log(`Starting database warmth monitor (every 30 minutes)...`);
  console.log(`Press Ctrl+C to stop.\n`);

  // Run immediately, then every 30 minutes
  keepWarm();
  setInterval(keepWarm, INTERVAL_MS);
}
