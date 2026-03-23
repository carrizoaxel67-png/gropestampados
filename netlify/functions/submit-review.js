const { neon } = require('@neondatabase/serverless');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: corsHeaders, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: "Method not allowed" }) };

  try {
    const body = JSON.parse(event.body || "{}");
    const name  = (body.name || "").trim().slice(0, 50);
    const text  = (body.text || "").trim().slice(0, 500);
    const stars = Math.min(5, Math.max(1, parseInt(body.stars, 10) || 5));

    if (!name || !text) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Nombre y texto obligatorios" }) };
    }

    const dbUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    if (!dbUrl) throw new Error("Neon Database URL missing");
    
    // Conectar a la DB
    const sql = neon(dbUrl);

    // Asegurar tabla
    await sql`
      CREATE TABLE IF NOT EXISTS store_table (
        id VARCHAR(50) PRIMARY KEY,
        data JSONB
      );
    `;

    // Fetch catalog_data
    const result = await sql`SELECT data FROM store_table WHERE id = 'catalog'`;
    let catalogData = result.length > 0 ? result[0].data : null;

    if (!catalogData) catalogData = { products: [], categories: [], reviews: [] };
    if (!Array.isArray(catalogData.reviews)) catalogData.reviews = [];

    // Formatear review
    const newReview = {
      id: "rev_" + Date.now(),
      name, stars, text,
      date: new Date().toISOString(),
      status: "pending"
    };

    catalogData.reviews.unshift(newReview);

    // Guardar nuevo JSONB (UPSERT)
    await sql`
      INSERT INTO store_table (id, data)
      VALUES ('catalog', ${JSON.stringify(catalogData)}::jsonb)
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;
    `;

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("submit-review DB error:", err);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message, detail: err.message }) };
  }
};
