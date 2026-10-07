/**
 * Vercel Serverless Function: Diet Coke Admin Dashboard Stats API
 */

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Live Simulated Inventory & Analytics
  const stats = {
    pricePerCan: 40,
    currencySymbol: "₹",
    currencyCode: "INR",
    totalRevenue: 18480, // in Rupees
    todayOrders: 38,
    activeChillers: 12,
    chillerTemperature: "-2.4°C",
    inventoryRemainingCans: 4850,
    inventoryMaxCapacity: 6000,
    subscribersCount: 2840,
    apiKeyConfig: {
      keyId: "DC_LIVE_KEY_8204",
      status: "ACTIVE",
      environment: "production",
      rateLimit: "10,000 req/min"
    },
    warehouseHubs: [
      { city: "Mumbai (West Hub)", status: "Optimal (-3°C)", stock: 1600 },
      { city: "Delhi NCR (Central)", status: "Optimal (-2°C)", stock: 1450 },
      { city: "Bengaluru (South Hub)", status: "Optimal (-2.5°C)", stock: 1800 }
    ]
  };

  return res.status(200).json({ success: true, data: stats });
};
