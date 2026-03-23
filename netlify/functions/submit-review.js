const { getStore } = require("@netlify/blobs");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  // CORS Preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const name  = (body.name  || "").trim().slice(0, 50);
    const text  = (body.text  || "").trim().slice(0, 500);
    const stars = Math.min(5, Math.max(1, parseInt(body.stars, 10) || 5));

    if (!name || !text) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Nombre y texto son obligatorios" }),
      };
    }

    // Igual que get-products.js: getStore simple, funciona en Netlify automáticamente
    const store = getStore("catalog");

    // Leer datos existentes
    let catalogData = await store.get("products", { type: "json" });

    if (!catalogData) {
      catalogData = { products: [], categories: [], reviews: [] };
    }
    if (Array.isArray(catalogData)) {
      catalogData = { products: catalogData, categories: [], reviews: [] };
    }
    if (!Array.isArray(catalogData.reviews)) {
      catalogData.reviews = [];
    }

    // Crear la reseña pendiente
    const newReview = {
      id: "rev_" + Date.now(),
      name,
      stars,
      text,
      date: new Date().toISOString(),
      status: "pending",
    };

    catalogData.reviews.unshift(newReview);

    // Guardar — usamos set() con string porque setJSON no existe en v8
    await store.set("products", JSON.stringify(catalogData));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true }),
    };

  } catch (err) {
    console.error("submit-review error:", err.message || err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Error interno", detail: err.message }),
    };
  }
};
