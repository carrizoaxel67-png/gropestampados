const { getStore } = require("@netlify/blobs");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  try {
    const store = getStore("catalog");
    const data = await store.get("products", { type: "json" });
    
    // Si data no existe (o es array por la version anterior), lo adaptamos
    let result = { products: [], categories: ["Remeras", "Canguros", "Gorros", "Sublimados", "Regalos"], reviews: [] };
    
    if (data) {
      if (Array.isArray(data)) {
        // Migración automática de old format a new format
        result.products = data;
      } else {
        result.products = data.products || [];
        result.categories = data.categories || result.categories;
        result.reviews = data.reviews || [];
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error("get-products error:", err);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ products: [], categories: ["Remeras", "Canguros", "Gorros", "Sublimados", "Regalos"], reviews: [] }),
    };
  }
};
