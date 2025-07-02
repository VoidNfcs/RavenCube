import { aj } from "../config/arcjet.js";

export const arcjetMiddleware = async (req, res, next) => {
  try {
    const decision = await aj.protect(req, { requested: 1 });

    // Denied outright
    if (decision.isDenied()) {
      const reason = decision.reason;

      if (reason.isRateLimit()) {
        return res
          .status(429)
          .json({ message: "Too many requests, please try again later." });
      }

      if (reason.isBot()) {
        return res.status(403).json({ message: "Access denied for bots." });
      }

      return res.status(403).json({ message: "Access denied." });
    }

    // Spoofed bot detection
    const isSpoofedBot = decision.results.some(
      (result) => result.reason?.isBot?.() && result.reason?.isSpoofed?.()
    );

    if (isSpoofedBot) {
      return res
        .status(403)
        .json({ message: "Access denied for spoofed bots." });
    }

    next();
  } catch (error) {
    console.error("Arcjet Middleware Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
