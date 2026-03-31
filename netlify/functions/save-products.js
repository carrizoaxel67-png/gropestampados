const { neon } = require('@neondatabase/serverless');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: corsHeaders, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: "Method not allowed" }) };

  const authHeader = event.headers["authorization"] || event.headers["Authorization"] || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: "Unauthorized" }) };
  
  try {
    const payloadB64 = token.split(".")[1];
    if (!payloadB64) throw new Error("Invalid token");
    JSON.parse(Buffer.from(payloadB64, "base64").toString("utf-8"));
  } catch (e) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: "Unauthorized signature" }) };
  }

  try {
    const data = JSON.parse(event.body || "{}");

    if (!data.products || !Array.isArray(data.products) || !data.categories || !Array.isArray(data.categories)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Invalid data format" }),
      };
    }
    
    // Safety check on server side (5.8MB max)
    const payloadStr = JSON.stringify(data);
    if (Buffer.byteLength(payloadStr, 'utf8') > 5.8 * 1024 * 1024) {
      return { statusCode: 413, headers: corsHeaders, body: JSON.stringify({ error: "Payload too large, max 5.8MB allowed" }) };
    }

    if (!data.reviews || !Array.isArray(data.reviews)) data.reviews = [];
    if (!data.visual_config || typeof data.visual_config !== 'object') data.visual_config = {};

    // Basic structural length limits
    data.products = data.products.map(p => ({
      ...p,
      name: p.name ? String(p.name).substring(0, 150) : "",
      category: p.category ? String(p.category).substring(0, 50) : ""
    }));

    const dbUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    if (!dbUrl) throw new Error("Neon Database URL missing");
    
    const sql = neon(dbUrl);

    // Asegurar tabla
    await sql`
      CREATE TABLE IF NOT EXISTS store_table (
        id VARCHAR(50) PRIMARY KEY,
        data JSONB
      );
    `;

    // UPSERT (Insert or Update si ya existe)
    await sql`
      INSERT INTO store_table (id, data)
      VALUES ('catalog', ${JSON.stringify(data)}::jsonb)
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;
    `;

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, count: data.products.length }) };
  } catch (err) {
    console.error("Neon DB Error save-products:", err);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "DB Error", detail: err.message }) };
  }
};
