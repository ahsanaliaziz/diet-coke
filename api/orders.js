/**
 * Vercel Serverless Function: Diet Coke Order Management API
 * Price: ₹40 per can
 */

// Simulated persistent storage across invocations
let orders = [
  {
    id: "DC-9042",
    customer: "Aarav Sharma",
    pack: "The Chic Sleek 6-Pack",
    cans: 6,
    pricePerCan: 40,
    total: 240,
    status: "Out for Delivery",
    address: "Bandra West, Mumbai",
    phone: "+91 98201 44521",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: "DC-9041",
    customer: "Rohan Mehra",
    pack: "Classic 12-Pack Chiller",
    cans: 12,
    pricePerCan: 40,
    total: 480,
    status: "Chilled & Packed",
    address: "Indiranagar, Bangalore",
    phone: "+91 98450 33119",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    id: "DC-9040",
    customer: "Priya Verma",
    pack: "The Silver Subscription",
    cans: 24,
    pricePerCan: 40,
    total: 960,
    status: "Delivered",
    address: "Defence Colony, New Delhi",
    phone: "+91 98110 99882",
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString()
  },
  {
    id: "DC-9039",
    customer: "Ananya Patel",
    pack: "The Chic Sleek 6-Pack",
    cans: 6,
    pricePerCan: 40,
    total: 240,
    status: "Delivered",
    address: "Koregaon Park, Pune",
    phone: "+91 97640 11203",
    timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString()
  }
];

const DEFAULT_KEY = "DC_PROD_LIVE_KEY_8204";

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // GET: Retrieve all orders and summary stats
  if (req.method === "GET") {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalCans = orders.reduce((sum, o) => sum + o.cans, 0);

    return res.status(200).json({
      success: true,
      pricePerCan: 40,
      currency: "INR (₹)",
      totalRevenue,
      totalCans,
      ordersCount: orders.length,
      orders
    });
  }

  // POST: Create a new order (at ₹40 per can)
  if (req.method === "POST") {
    try {
      let body = req.body;
      if (typeof body === "string") {
        body = JSON.parse(body);
      }

      const { 
        id = `DC-${Math.floor(1000 + Math.random() * 9000)}`,
        customer = "Guest Chiller", 
        pack = "The Chic Sleek 6-Pack", 
        cans = 6, 
        address = "Metropolitan Hub", 
        phone = "+91 99999 00000",
        total,
        utr = "UPI-DIRECT",
        gateway = "PhonePe UPI (8102899986@ybl)"
      } = body || {};

      const canCount = parseInt(cans, 10) || 6;
      const totalAmount = total ? parseInt(total, 10) : canCount * 40; // ₹40 per can

      const newOrder = {
        id,
        customer: customer.trim() || "Guest Customer",
        pack,
        cans: canCount,
        pricePerCan: 40,
        total: totalAmount,
        status: "Sub-Zero Chilled",
        address: address.trim(),
        phone: phone.trim(),
        utr,
        gateway,
        payee: "Ahsan Aziz (8102899986@ybl)",
        timestamp: new Date().toISOString()
      };

      orders.unshift(newOrder);

      return res.status(201).json({
        success: true,
        message: "Order placed successfully at ₹40 per can!",
        order: newOrder
      });
    } catch (err) {
      return res.status(400).json({ success: false, error: "Invalid order data" });
    }
  }

  // PATCH: Update order status
  if (req.method === "PATCH") {
    try {
      let body = req.body;
      if (typeof body === "string") {
        body = JSON.parse(body);
      }

      const { id, status } = body || {};
      const target = orders.find(o => o.id === id);
      if (!target) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }

      if (status) target.status = status;

      return res.status(200).json({ success: true, order: target });
    } catch (err) {
      return res.status(400).json({ success: false, error: "Failed to update order" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
