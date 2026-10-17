/**
 * Aaradhya Orders API — Cloudflare Workers + D1
 *
 * Routes:
 *   GET  /health
 *   POST /create-order
 *   GET  /admin/orders                 (Authorization: Bearer <ADMIN_KEY>)
 *   PATCH /admin/orders/:orderId       (Authorization: Bearer <ADMIN_KEY>)
 *
 * Required Worker bindings:
 *   DB: Cloudflare D1 database (apply schema.sql)
 *   ADMIN_KEY: long random secret in Worker secrets
 *   ALLOWED_ORIGIN: your website origin, e.g. https://www.aradhya.co
 *
 * Never trust product prices sent by the browser. Totals are calculated from
 * the server-side catalogue below. This version records order requests and
 * does not process online payments or deduct inventory.
 */
const PRODUCTS = {
  1: { name: "White Lily", price: 299, active: true },
  2: { name: "White Oudh", price: 299, active: true },
  3: { name: "Mysore Chandan", price: 299, active: true },
  4: { name: "Lavender", price: 299, active: true },
  5: { name: "Pineapple", price: 299, active: true },
  6: { name: "Mysore Kewda", price: 299, active: true },
  7: { name: "Mix – Rose, Bela, Chandan & Kewda", price: 499, active: true },
  8: { name: "Mix – White Lily, Chandan, White Oudh, Mysore Kewda & Pineapple", price: 499, active: true }
};
const ORDER_STATUSES = new Set(["new", "confirmed", "preparing", "processing", "shipped", "delivered", "cancelled"]);
const PAYMENT_STATUSES = new Set(["pending", "paid", "failed", "refunded", "cod"]);

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const configured = (env.ALLOWED_ORIGIN || "").split(",").map(x => x.trim()).filter(Boolean);
  const allowOrigin = configured.length ? (configured.includes(origin) ? origin : configured[0]) : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Admin-Key",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}
function json(request, env, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...corsHeaders(request, env) }
  });
}
function clean(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}
function isAdmin(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const adminHeader = request.headers.get("X-Admin-Key") || "";
  const token = bearer || adminHeader;
  return Boolean(env.ADMIN_KEY && token && token === env.ADMIN_KEY);
}
function makeOrderId() {
  return "AR" + new Date().toISOString().slice(0,10).replaceAll("-","") + "-" +
    crypto.randomUUID().replaceAll("-","").slice(0,10).toUpperCase();
}
async function createOrder(request, env) {
  if (!env.DB) return json(request, env, {success:false, error:"Database is not configured."}, 503);
  let body;
  try { body = await request.json(); } catch { return json(request, env, {success:false,error:"Request body must be valid JSON."},400); }
  const customer = body.customer || {};
  const name = clean(customer.name || body.customer_name, 100);
  const phone = clean(customer.phone || body.customer_phone, 20).replace(/\s+/g,"");
  const email = clean(customer.email || body.customer_email, 150);
  const address = clean(customer.address || body.customer_address || body.address, 600);
  if (name.length < 2) return json(request, env, {success:false,error:"Please enter your full name."},400);
  if (!/^[6-9]\d{9}$/.test(phone)) return json(request, env, {success:false,error:"Enter a valid 10-digit Indian mobile number."},400);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(request, env, {success:false,error:"Enter a valid email address."},400);
  if (address.length < 8) return json(request, env, {success:false,error:"Please enter your full delivery address."},400);
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 8) return json(request, env, {success:false,error:"Your cart is empty or invalid."},400);

  const quantities = new Map();
  for (const row of body.items) {
    const id = Number(row.product_id ?? row.id);
    const qty = Number(row.quantity ?? row.qty);
    if (!Number.isInteger(id) || !PRODUCTS[id]?.active) return json(request, env, {success:false,error:"A product in your cart is unavailable."},400);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) return json(request, env, {success:false,error:"Product quantities must be between 1 and 99."},400);
    quantities.set(id, (quantities.get(id) || 0) + qty);
  }
  for (const qty of quantities.values()) if (qty > 99) return json(request, env, {success:false,error:"Maximum quantity per product is 99."},400);

  const items = [...quantities.entries()].map(([id, quantity]) => ({
    product_id:id, name:PRODUCTS[id].name, unit_price:PRODUCTS[id].price,
    quantity, line_total:PRODUCTS[id].price * quantity
  }));
  const total = items.reduce((sum, item) => sum + item.line_total, 0);
  const orderId = makeOrderId();
  const now = new Date().toISOString();
  const statements = [
    env.DB.prepare(`INSERT INTO orders
      (order_id, customer_name, customer_phone, customer_email, customer_address, total, payment_method, payment_status, order_status, customer_notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'cod', 'pending', 'new', ?, ?, ?)`)
      .bind(orderId, name, phone, email || null, address, total, clean(body.notes || customer.notes, 1000) || null, now, now),
    ...items.map(item => env.DB.prepare(`INSERT INTO order_items
      (order_id, product_id, product_name, quantity, unit_price, line_total)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(orderId, item.product_id, item.name, item.quantity, item.unit_price, item.line_total))
  ];
  try {
    await env.DB.batch(statements);
    return json(request, env, {success:true, order_id:orderId, total_amount:total, currency:"INR", order:{order_id:orderId,total,order_status:"new",payment_status:"pending",items}}, 201);
  } catch (error) {
    console.error("create-order failed", error);
    return json(request, env, {success:false,error:"We could not save your order right now. Please try again or contact support."},500);
  }
}
async function listOrders(request, env) {
  if (!isAdmin(request, env)) return json(request, env, {success:false,error:"Unauthorized."},401);
  if (!env.DB) return json(request, env, {success:false,error:"Database is not configured."},503);
  try {
    const { results = [] } = await env.DB.prepare(`
      SELECT o.*, COALESCE(json_group_array(json_object(
        'product_id', i.product_id, 'name', i.product_name, 'quantity', i.quantity,
        'unit_price', i.unit_price, 'line_total', i.line_total
      )) FILTER (WHERE i.id IS NOT NULL), '[]') AS items
      FROM orders o LEFT JOIN order_items i ON i.order_id=o.order_id
      GROUP BY o.order_id ORDER BY o.created_at DESC LIMIT 500
    `).all();
    const orders = results.map(o => {
      try { o.items = JSON.parse(o.items || "[]"); } catch { o.items = []; }
      return o;
    });
    return json(request, env, {success:true,orders});
  } catch (error) {
    console.error("list-orders failed", error);
    return json(request, env, {success:false,error:"Could not load orders."},500);
  }
}
async function updateOrder(request, env, orderId) {
  if (!isAdmin(request, env)) return json(request, env, {success:false,error:"Unauthorized."},401);
  if (!env.DB) return json(request, env, {success:false,error:"Database is not configured."},503);
  let body;
  try { body = await request.json(); } catch { return json(request, env, {success:false,error:"Request body must be valid JSON."},400); }

  let orderStatus = body.order_status == null ? null : clean(body.order_status,30);
  let paymentStatus = body.payment_status == null ? null : clean(body.payment_status,30);
  if (body.status != null && !orderStatus) orderStatus = clean(body.status,30);
  if (orderStatus === "preparing") orderStatus = "preparing";
  if (orderStatus && !ORDER_STATUSES.has(orderStatus)) return json(request, env, {success:false,error:"Invalid order status."},400);
  if (paymentStatus && !PAYMENT_STATUSES.has(paymentStatus)) return json(request, env, {success:false,error:"Invalid payment status."},400);
  if (!orderStatus && !paymentStatus) return json(request, env, {success:false,error:"No valid fields to update."},400);

  try {
    let result;
    try {
      result = await env.DB.prepare(`UPDATE orders SET
        order_status=COALESCE(?,order_status),
        payment_status=COALESCE(?,payment_status),
        updated_at=?
        WHERE order_id=?`).bind(orderStatus,paymentStatus,new Date().toISOString(),orderId).run();
    } catch (firstError) {
      // Some earlier D1 schemas used "processing" instead of "preparing".
      if (orderStatus === "preparing") {
        result = await env.DB.prepare(`UPDATE orders SET
          order_status=COALESCE(?,order_status),
          payment_status=COALESCE(?,payment_status),
          updated_at=?
          WHERE order_id=?`).bind("processing",paymentStatus,new Date().toISOString(),orderId).run();
        orderStatus = "preparing";
      } else {
        throw firstError;
      }
    }
    if (!result.meta?.changes) return json(request, env, {success:false,error:"Order not found."},404);
    return json(request, env, {success:true,order_id:orderId,order_status:orderStatus,payment_status:paymentStatus});
  } catch (error) {
    console.error("update-order failed", error);
    return json(request, env, {success:false,error:"Could not update order."},500);
  }
}
export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null,{status:204,headers:corsHeaders(request,env)});
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/,"") || "/";
    if (request.method === "GET" && path === "/health") return json(request,env,{success:true,service:"aaradhya-orders-api",timestamp:new Date().toISOString()});
    if (request.method === "POST" && path === "/create-order") return createOrder(request,env);
    if (request.method === "GET" && path === "/admin/orders") return listOrders(request,env);
    const match = path.match(/^\/admin\/orders\/([A-Za-z0-9_-]+)$/);
    if (request.method === "PATCH" && match) return updateOrder(request,env,decodeURIComponent(match[1]));
    return json(request,env,{success:false,error:"Not found."},404);
  }
};
