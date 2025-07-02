import arcjet, { tokenBucket, shield, detectBot } from "@arcjet/node";
import { ENV } from "./env.js";

export const aj = arcjet({
  key: ENV.ARCJET_KEY,

  // Identify clients by source IP
  characteristics: ["ip.src"],

  // Protection rules
  rules: [
    // General protection shield
    shield({ mode: "LIVE" }),

    // Allow known bots like search engines
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),

    // Rate limiting
    tokenBucket({
      mode: "LIVE",
      refillRate: 10, // tokens per interval
      interval: 10, // interval in seconds
      capacity: 15, // maximum burst capacity
    }),
  ],
});
