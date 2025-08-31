const TelegramBot = require("node-telegram-bot-api");
const { createClient } = require("@supabase/supabase-js");

// =====================
// 🔑 Config
// =====================
const token = "8314164416:AAGuOs4zzhd2BLtV6jfMLT50P30LSIsyi9I"; // from BotFather
const supabaseUrl = "https://vjqjqcyglovugglhyzpk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqcWpxY3lnbG92dWdnbGh5enBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Nzk5ODcsImV4cCI6MjA3MjE1NTk4N30.Th-33qhp1udnmPgWsc8YpVmoUVtky6sGgcaZcHBXUJ0";
const supabase = createClient(supabaseUrl, supabaseKey);

// Create bot with polling
const bot = new TelegramBot(token, { polling: true });

// =====================
// 🛍 /products → Show product list
// =====================
bot.onText(/\/products/, async (msg) => {
  const chatId = msg.chat.id;

  const { data: products, error } = await supabase
    .from("products")
    .select("short_id, name, price"); // 👈 only fetch short_id

  if (error) {
    bot.sendMessage(chatId, "⚠️ Error fetching products.");
    console.error(error);
    return;
  }

  if (!products || products.length === 0) {
    bot.sendMessage(chatId, "❌ No products found.");
    return;
  }

  let productList = "🛍 Available Products:\n\n";
  products.forEach((p) => {
    productList += `${p.short_id}. ${p.name} - ₹${p.price}\n`;
  });

  bot.sendMessage(chatId, productList);
});

// =====================
// ➕ /addtocart <short_id>
// =====================
bot.onText(/\/addtocart (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const shortId = parseInt(match[1]);

  // fetch product by short_id
  const { data: product, error } = await supabase
    .from("products")
    .select("id, short_id, name, price") // fetch UUID for DB, short_id for display
    .eq("short_id", shortId)
    .single();

  if (error || !product) {
    bot.sendMessage(chatId, "❌ Product not found.");
    console.error(error);
    return;
  }

  await supabase.from("cart").insert([
    { user_id: chatId, product_id: product.id, quantity: 1 },
  ]);

  bot.sendMessage(chatId, `✅ Added ${product.name} to your cart.`);
});

// =====================
// ✅ /checkout → Place order
// =====================
bot.onText(/\/checkout/, async (msg) => {
  const chatId = msg.chat.id;

  const { data: cartItems, error } = await supabase
    .from("cart")
    .select("id, quantity, products(short_id, name, price)")
    .eq("user_id", chatId);

  if (error) {
    bot.sendMessage(chatId, "⚠️ Error fetching cart.");
    console.error(error);
    return;
  }

  if (!cartItems || cartItems.length === 0) {
    bot.sendMessage(chatId, "🛒 Your cart is empty.");
    return;
  }

  let total = 0;
  let summary = "🛒 Your Order:\n\n";
  cartItems.forEach((item) => {
    summary += `${item.products.short_id}. ${item.products.name} - ₹${item.products.price}\n`;
    total += item.products.price;
  });

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([{ user_id: chatId, total_price: total, status: "Order received" }])
    .select()
    .single();

  if (orderError) {
    bot.sendMessage(chatId, "⚠️ Could not place order.");
    console.error(orderError);
    return;
  }

  await supabase.from("cart").delete().eq("user_id", chatId);

  bot.sendMessage(
    chatId,
    `${summary}\n💰 Total: ₹${total}\n📦 Order #${order.id} placed successfully!`
  );
});

// =====================
// 📦 Track Order: "Where is my order #123"
// =====================
bot.onText(/where is my order #?(\d+)/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const orderId = match[1];

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    bot.sendMessage(chatId, "❌ Order not found.");
    console.error(error);
    return;
  }

  bot.sendMessage(chatId, `📦 Order #${orderId} status: ${order.status}`);
});

// =====================
// Debug Polling Errors
// =====================
bot.on("polling_error", (err) => console.error("Polling error:", err));
