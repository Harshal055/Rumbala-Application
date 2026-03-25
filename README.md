# Rumbala 🥂
**The Ultimate Date-Night & LDR Companion**

Rumbala is a high-performance React Native application designed for couples to deepen their connection through interactive dares, daily questions, and real-time synchronized play. Whether you're in the same room or thousands of miles apart, Rumbala bridges the gap with a premium, glassmorphic UI and seamless real-time technology.

## 🚀 Key Features

### 📡 LDR Mode (Long-Distance Relationship)
- **Real-time Synchronization**: Powered by Supabase Realtime, actions like drawing a card or completing a dare are synchronized instantly between partners.
- **Face-to-Face Video Calls**: Integrated **Agora SDK** for high-quality, low-latency video streaming directly within the game session.
- **Live Reactions**: Integrated chat and emoji reactions to stay connected during play.
- **Vibe Filtering**: Choose from categories like *Fun*, *Romantic*, or *Spicy* to tailor the experience.

### 🏠 Together Mode
- **Dynamic Dares**: Hundreds of curated cards categorized by intensity and vibe.
- **Confetti & Haptics**: Rich visual feedback and tactile sensations for a premium feel.
- **Score Tracking**: Keep a history of your plays and points in a beautiful glassmorphic interface.

### 🔐 Modern Infrastructure
- **Authentication**: Secure Google Sign-In and Email auth via Supabase.
- **Store & Inventory**: In-app purchases managed through **RevenueCat**.
- **State Management**: Lightweight and lightning-fast state using **Zustand**.
- **Animations**: Silky-smooth transitions and micro-interactions powered by **React Native Reanimated**.

## 🛠 Tech Stack
- **Frontend**: React Native, Expo (Router, Camera, Haptics)
- **Styling**: Vanilla CSS with Glassmorphism-inspired design system
- **Backend**: Supabase (PostgreSQL, Realtime, Auth, Storage)
- **Video/RTC**: Agora SDK
- **Monetization**: RevenueCat
- **State**: Zustand

## 📦 Getting Started

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd rumbala
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure Environment**:
   Copy `.env.example` to `.env` and fill in your Supabase, Agora, and RevenueCat keys.

4. **Run the app**:
   ```bash
   npx expo run:android # For Android
   npx expo run:ios     # For iOS
   ```

## 🎨 Design Philosophy
Rumbala uses a custom **Glassmorphism** design system (`src/constants/glass.ts`) to provide a modern, airy, and "premium" aesthetic. Every component is built with accessibility and responsiveness in mind.

---
*Built for couples who value connection, built with the latest React Native ecosystem.*
