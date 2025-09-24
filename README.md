

# Voice-Enabled Retail App using AI

## Overview

This project is a **voice-based retail application** built with **React Native**, designed to allow users to search, add, and order products using both text and voice commands. The app includes AI-powered natural language understanding (NLU) to interpret user queries and automate shopping tasks.

---

## Features

### Core Features (Must-Do)

1. **Product Search (Text + Voice)**

   * **Text Search**: Users can search for products using natural queries.
     Example:

     ```
     "Show me breakfast items under 200"
     ```
   * **Voice Search**: Users can press a microphone button to speak queries. The app converts speech to text, understands intent, and adds products to the cart.
     Example:

     ```
     "Order 2 packs of dosa batter"
     ```
   * **Natural Language Understanding (NLU)**:

     * Converts human queries into machine-friendly search objects.
       Example:

     ```json
     {
       "category": "breakfast",
       "price": { "max": 200 }
     }
     ```

2. **Cart & Checkout Flow**

   * Add items to the cart
   * View cart items with total price
   * Place orders, which are saved to backend (Firebase/SupaBase)

3. **Order Tracking Chat Bot (In-App)**

   * Users enter an order ID
   * App fetches status from backend and shows updates:

     ```
     "Order received" → "Out for delivery" → "Delivered"
     ```

---

### Bonus Features (Optional)

* **Telegram Bot for Ordering**

  * `/products` → Shows the product list
  * `/order <product_id>` → Place order via Telegram

---

## Technology Stack

* **Frontend**: React Native
* **Voice Recognition**: `react-native-voice`
* **Backend**: Firebase or SupaBase
* **AI/NLP**: Simple keyword extraction & regex OR OpenAI API for intent parsing

---

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/voice-retail-app.git
   cd voice-retail-app
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Run the app:

   ```bash
   npx react-native run-android
   # or
   npx react-native run-ios
   ```

---

## Usage

1. **Text Search**: Enter a query in the search bar.
2. **Voice Search**: Tap the microphone button and speak your order or query.
3. **Add to Cart**: Select products to add to your cart.
4. **Checkout**: Review your cart and place the order.
5. **Track Order**: Enter your order ID to view order status.

---

## Project Structure

```
/src
  /components   # Reusable components
  /screens      # App screens (Dashboard, Cart, Checkout, Order Tracking)
  /services     # API & AI/NLP logic
  /assets       # Images, icons
App.js
```

---

## Contributing

Feel free to fork this project and submit pull requests for improvements or additional features.

---

## License

This project is open-source and available under the MIT License.

---

## Working Video Link

https://drive.google.com/file/d/1sZRJ1BCquGmmdWz9M2xywhCB8PJ3sXtf/view?usp=drive_link

---
