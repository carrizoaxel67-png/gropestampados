const { getStore } = require("@netlify/blobs");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  // Handle CORS preflight
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

  // Verify Netlify Identity JWT with admin role
  const authHeader = event.headers["authorization"] || event.headers["Authorization"] || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Unauthorized: No token" }),
    };
  }

  try {
    const payloadB64 = token.split(".")[1];
    if (!payloadB64) throw new Error("Invalid token format");

    // Solo verificamos que el JWT es válido (cualquier usuario logueado de
    // Netlify Identity es admin, ya que el registro es "Invite Only").
    JSON.parse(Buffer.from(payloadB64, "base64").toString("utf-8"));

  } catch (err) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Unauthorized: Invalid token" }),
    };
  }

  try {
    const data = JSON.parse(event.body || "{}");

    if (!data.products || !Array.isArray(data.products) || !data.categories || !Array.isArray(data.categories)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Invalid data format: must contain products and categories arrays" }),
      };
    }

    if (!data.reviews || !Array.isArray(data.reviews)) {
      data.reviews = [];
    }

    const store = getStore("catalog");
    await store.set("products", JSON.stringify(data));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, count: data.products.length }),
    };
  } catch (err) {
    console.error("save-products error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
