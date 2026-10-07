/**
 * Vercel Serverless Function: Diet Coke Silver Circle Newsletter API
 */

let subscribers = [
  "aarav.sharma@example.com",
  "priya.design@fashion.in",
  "rohan.m@lifestyle.com"
];

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({ success: true, count: subscribers.length });
  }

  if (req.method === "POST") {
    try {
      let body = req.body;
      if (typeof body === "string") body = JSON.parse(body);
      const { email } = body || {};

      if (!email || !email.includes("@")) {
        return res.status(400).json({ success: false, error: "Valid email is required" });
      }

      const cleanEmail = email.trim().toLowerCase();
      if (!subscribers.includes(cleanEmail)) {
        subscribers.unshift(cleanEmail);
      }

      return res.status(200).json({
        success: true,
        message: "Welcome to the Silver Circle! Pure crisp updates coming your way.",
        subscribersCount: subscribers.length
      });
    } catch (e) {
      return res.status(400).json({ success: false, error: "Invalid request" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
