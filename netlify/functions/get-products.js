const { neon } = require('@neondatabase/serverless');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  try {
    const dbUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    if (!dbUrl) throw new Error("Neon Database URL is not configured in Netlify Envs");
    
    // Conectar a Neon Serverless
    const sql = neon(dbUrl);

    // Asegurar tabla
    await sql`
      CREATE TABLE IF NOT EXISTS store_table (
        id VARCHAR(50) PRIMARY KEY,
        data JSONB
      );
    `;

    // Fetch records
    const result = await sql`SELECT data FROM store_table WHERE id = 'catalog'`;
    let catalogData = result.length > 0 ? result[0].data : null;

    let finalData = { products: [], categories: ["Remeras", "Canguros", "Gorros", "Sublimados", "Regalos"], reviews: [], visual_config: {} };
    
    if (catalogData) {
      if (Array.isArray(catalogData)) {
        finalData.products = catalogData;
      } else {
        finalData.products = catalogData.products || [];
        finalData.categories = catalogData.categories || finalData.categories;
        finalData.reviews = catalogData.reviews || [];
        finalData.visual_config = catalogData.visual_config || {};
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(finalData),
    };
  } catch (err) {
    console.error("Neon DB error get-products:", err);
    return {
      statusCode: 200, // Devolvemos 200 con arrays vacíos para que no rompa el frontend
      headers: corsHeaders,
      body: JSON.stringify({ products: [], categories: ["Remeras", "Canguros", "Gorros", "Sublimados", "Regalos"], reviews: [], visual_config: {}, _error: err.message }),
    };
  }
};
