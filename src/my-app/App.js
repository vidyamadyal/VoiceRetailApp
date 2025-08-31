import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator, // 👈 added
} from "react-native";
import { supabase } from "./supabaseClient";

export default function App() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [cart, setCart] = useState([]);
  const [viewCart, setViewCart] = useState(false);

  // Chatbot state
  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: "bot", text: "Hi! 👋 How can I help you today?" },
  ]);
  const [chatInput, setChatInput] = useState("");

  // NEW state for mic spinner
  const [listening, setListening] = useState(false);

  // -------------------- Load Products from Supabase --------------------
  useEffect(() => {
    const loadProducts = async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) {
        console.error(error);
      } else {
        console.log("Fetched products:", data);
        setProducts(data);
        setFiltered(data);
      }
    };
    loadProducts();
  }, []);

  // -------------------- NLU (basic parsing) --------------------
  const STOPWORDS = new Set([
    "show","me","items","item","please","find","give","want","need","search",
    "under","below","less","than","for","of","the","a","an","with","and","or",
    "to","in","buy","order","cart","checkout","offer","offers","help"
  ]);
  const CATEGORY_WORDS = new Set(["breakfast","spice","spices","side","sides"]);

  const parseQuery = (text) => {
    const lower = (text || "").toLowerCase();
    const words = lower.match(/[a-z0-9]+/g) || [];

    const parsed = { category: null, price: null, productTokens: [] };

    if (lower.includes("breakfast")) parsed.category = "breakfast";
    if (lower.includes("spice")) parsed.category = "spices";
    if (lower.includes("side")) parsed.category = "sides";

    const priceMatch = lower.match(/(?:under|below|less\s*than)\s*(\d+)/);
    if (priceMatch) parsed.price = { max: parseInt(priceMatch[1]) };

    parsed.productTokens = words.filter(
      (w) =>
        w.length >= 3 &&
        !STOPWORDS.has(w) &&
        !CATEGORY_WORDS.has(w) &&
        isNaN(Number(w))
    );

    return parsed;
  };

  const handleSearch = (text) => {
    setQuery(text);
    const parsed = parseQuery(text);
    let results = products;

    if (parsed.category) {
      results = results.filter((p) => p.category === parsed.category);
    }
    if (parsed.price) {
      results = results.filter((p) => p.price <= parsed.price.max);
    }
    if (parsed.productTokens.length > 0) {
      results = results.filter((p) => {
        const name = p.name.toLowerCase();
        return parsed.productTokens.every((tok) => name.includes(tok));
      });
    }

    setFiltered(results.length ? results : []);
  };

  // -------------------- Fake Voice Input with spinner --------------------
  const fakeVoiceInput = () => {
    setListening(true); // show spinner + text
    setQuery("");       // clear input

    setTimeout(() => {
      setListening(false); // hide spinner
      const spokenText = "Show me breakfast under 200";
      setQuery(spokenText);
      handleSearch(spokenText);
    }, 2000); // simulate 2s listening
  };

  // -------------------- Cart functions --------------------
  const addToCart = (item) => {
    setCart((prev) => [...prev, item]);
    Alert.alert("Cart", `${item.name} added to cart`);
  };
  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  // -------------------- Place Order --------------------
  const placeOrder = async () => {
    if (cart.length === 0) {
      Alert.alert("Cart", "Your cart is empty.");
      return;
    }

    const order = { user_id: "guest", items: cart, status: "Order received" };
    const { data, error } = await supabase.from("orders").insert([order]).select();
    if (error) {
      console.error(error);
      Alert.alert("Error", "Could not place order.");
    } else {
      const orderId = data[0].id;
      Alert.alert("✅ Success", `Order placed! Your Order ID: ${orderId}`);
      setCart([]);
      setViewCart(false);

      // Simulate status updates
      setTimeout(async () => {
        await supabase.from("orders").update({ status: "Out for delivery" }).eq("id", orderId);
      }, 10000);
      setTimeout(async () => {
        await supabase.from("orders").update({ status: "Delivered" }).eq("id", orderId);
      }, 20000);
    }
  };

  // -------------------- Chatbot --------------------
  const botReply = async (message) => {
    let reply = "Sorry, I didn’t understand that. Try options below 👇";

    if (message.includes("hello") || message.includes("hi")) {
      reply = "Hello! 👋 You can ask me about your cart, checkout, or offers.";
    } else if (message.includes("cart")) {
      reply = `You have ${cart.length} item(s) in your cart.`;
    } else if (message.includes("checkout")) {
      reply = `Your total is ₹${totalPrice}. Ready to checkout?`;
    } else if (message.includes("offer")) {
      reply = "🎉 Today’s offer: Get 10% off on orders above ₹200!";
    } else if (message.includes("help")) {
      reply = "You can try: 'View Cart', 'Checkout', 'Offers', or 'Track order <id>'.";
    } else if (message.includes("order") || message.includes("track")) {
      const match = message.match(/order\s+([a-z0-9-]+)/);
      if (match) {
        const orderId = match[1];
        const { data, error } = await supabase
          .from("orders")
          .select("status")
          .eq("id", orderId)
          .single();
        if (error || !data) reply = "❌ Order not found. Please check the ID.";
        else reply = `📦 Order ${orderId} status: ${data.status}`;
      } else {
        reply = "Please provide an Order ID (e.g., 'Track order <id>').";
      }
    }

    return reply;
  };

  const sendMessage = async (text) => {
    const msg = (text || chatInput).trim();
    if (!msg) return;
    setChatMessages((prev) => [...prev, { sender: "user", text: msg }]);

    setTimeout(async () => {
      const reply = await botReply(msg.toLowerCase());
      setChatMessages((prev) => [...prev, { sender: "bot", text: reply }]);
    }, 600);

    setChatInput("");
  };

  // -------------------- UI --------------------
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        {viewCart ? "🛒 Your Cart" : "🎤 Product Search"}
      </Text>

      {viewCart ? (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Text style={styles.item}>
                {item.name} - ₹{item.price}
              </Text>
            )}
            ListEmptyComponent={
              <Text style={{ color: "#666", marginVertical: 10 }}>
                Your cart is empty.
              </Text>
            }
          />
          <Text style={styles.total}>Total: ₹{totalPrice}</Text>

          <TouchableOpacity style={styles.checkoutButton} onPress={placeOrder}>
            <Text style={styles.checkoutText}>Checkout</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => setViewCart(false)}>
            <Text style={styles.backText}>🔙 Back to Products</Text>
          </TouchableOpacity>

          {/* Floating Chatbot Icon */}
          <TouchableOpacity style={styles.chatButton} onPress={() => setChatVisible(true)}>
            <Text style={styles.chatIcon}>💬</Text>
          </TouchableOpacity>

          {/* Chatbot Modal */}
          <Modal visible={chatVisible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.chatWindow}>
                <Text style={styles.chatHeader}>🤖 Chatbot</Text>
                <ScrollView style={styles.chatMessages}>
                  {chatMessages.map((msg, index) => (
                    <View
                      key={index}
                      style={[
                        styles.chatBubble,
                        msg.sender === "user" ? styles.userBubble : styles.botBubble,
                      ]}
                    >
                      <Text style={msg.sender === "user" ? styles.userText : styles.botText}>
                        {msg.text}
                      </Text>
                    </View>
                  ))}
                </ScrollView>

                {/* Quick suggestions */}
                <View style={styles.suggestionRow}>
                  {["View Cart", "Checkout", "Offers", "Help"].map((s, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.suggestionButton}
                      onPress={() => sendMessage(s)}
                    >
                      <Text style={styles.suggestionText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Input row */}
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.chatInput}
                    placeholder="Type a message..."
                    value={chatInput}
                    onChangeText={setChatInput}
                  />
                  <TouchableOpacity style={styles.sendButton} onPress={() => sendMessage()}>
                    <Text style={styles.sendText}>➤</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.closeChat} onPress={() => setChatVisible(false)}>
                  <Text style={styles.closeText}>Close Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      ) : (
        <>
          {/* Search bar + mic */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              placeholder="Search for products..."
              value={query}
              onChangeText={handleSearch}
            />

            <TouchableOpacity style={styles.micButton} onPress={fakeVoiceInput}>
              {listening ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.micText}>🎤</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* "Listening..." feedback */}
          {listening && (
            <Text style={{ textAlign: "center", color: "#007bff", marginBottom: 10 }}>
              Listening...
            </Text>
          )}

          {/* Product List */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.productRow}>
                <Text style={styles.item}>
                  {item.name} - ₹{item.price}
                </Text>
                <TouchableOpacity style={styles.addButton} onPress={() => addToCart(item)}>
                  <Text style={styles.addText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={{ color: "#666", marginVertical: 10 }}>No products found.</Text>
            }
          />

          {/* Go to Cart */}
          <TouchableOpacity style={styles.cartButton} onPress={() => setViewCart(true)}>
            <Text style={styles.cartText}>🛒 View Cart ({cart.length})</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, marginTop: 40, backgroundColor: "#fff" },
  heading: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  searchRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
  },
  micButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 50,
  },
  micText: { fontSize: 20, color: "#fff" },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  item: { fontSize: 18 },
  addButton: {
    backgroundColor: "green",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  addText: { color: "#fff" },
  cartButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#ff9800",
    borderRadius: 8,
    alignItems: "center",
  },
  cartText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  total: { fontSize: 20, fontWeight: "bold", marginVertical: 10 },
  checkoutButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  checkoutText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  backButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  backText: { fontSize: 16 },
  chatButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 50,
    elevation: 5,
  },
  chatIcon: { fontSize: 22, color: "#fff" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  chatWindow: {
    width: "90%",
    height: "65%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    elevation: 10,
  },
  chatHeader: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  chatMessages: { flex: 1, marginBottom: 10 },
  chatBubble: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
    maxWidth: "75%",
  },
  userBubble: { backgroundColor: "#007bff", alignSelf: "flex-end" },
  botBubble: { backgroundColor: "#eee", alignSelf: "flex-start" },
  userText: { color: "#fff" },
  botText: { color: "#000" },
  suggestionRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  suggestionButton: {
    backgroundColor: "#f1f1f1",
    padding: 8,
    margin: 4,
    borderRadius: 20,
  },
  suggestionText: { fontSize: 14 },
  inputRow: { flexDirection: "row", alignItems: "center" },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 20,
  },
  sendText: { color: "#fff", fontWeight: "bold" },
  closeChat: {
    marginTop: 10,
    backgroundColor: "#ff9800",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  closeText: { color: "#fff", fontWeight: "bold" },
});
