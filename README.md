# ARtifact

**ARtifact** is a sophisticated React Native museum companion app built with Expo and AWS Amplify. Designed to enhance museum visits, it blends augmented reality, image recognition, and gamified exploration into a seamless mobile experience.

## 🏛️ Application Overview

ARtifact enhances in-person museum experiences through features like:

- Artwork discovery and rich detail views
- Augmented reality visualization of exhibits
- Gamified quests and ranking system
- Image recognition to identify artworks via camera

Built with modern tooling and cloud services for scalability, performance, and an engaging user experience.

## 🧱 Architecture & Tech Stack

### Frontend (Expo/React Native)

- **React Native** with **Expo SDK v53.0.11**
- **Expo Router** for file-based navigation (v5.1.0)
- **TypeScript** for static typing and maintainability
- **AWS Amplify** SDK for backend integration

### Backend (AWS via Amplify)

- **Cognito** for auth (user pools + identity pools)
- **AppSync** + **GraphQL** API for data querying
- **DynamoDB** for persistent NoSQL storage
- **S3** for media (images, AR content)
- **Lambda** for serverless image analysis
- **Rekognition** for custom artwork identification
- **API Gateway** for managing and routing RESTful endpoints where needed
- **IAM** (Identity and Access Management) for securing access to AWS resources
- **CloudWatch** for logging, monitoring, and debugging Lambda and Amplify services

## 📦 Key Dependencies

- `expo-camera` — advanced camera functionality
- `react-native-webview` — AR experience rendering via 8th Wall
- `react-native-reanimated-carousel` — featured artwork slider
- `expo-image` — optimized image rendering

## 🧭 Navigation Architecture

Built using **Expo Router**, the app has clear routing and screen organization:

```
├── index.tsx                # Landing / Welcome
├── (dashboard)/             # Main Tab Navigation
│   ├── home.tsx             # Home (featured, entry point)
│   ├── explore.tsx          # Explore (search, browse, filter)
│   ├── scan.tsx             # Camera & image recognition
│   ├── artQuest.tsx         # Gamified quests & challenges
│   ├── profile.tsx          # User profile & stats
├── artDetail.tsx            # Artwork detail view
├── collection.tsx           # Collection detail view
├── arViewer.tsx             # Augmented reality viewer
├── questDetail.tsx          # Quest detail view
├── favorites.tsx            # User's favorite artworks
├── artworksVisited.tsx      # Artworks visited history
├── questsCompleted.tsx      # Completed quests list
```

- **Tab navigation** is handled in `(dashboard)/`, with Home, Explore, Scan, ArtQuest, and Profile tabs.
- **Stack navigation** is used for detail and modal screens (artwork, AR, collection, favorites, etc.).
- All navigation is managed via file-based routing for clarity and scalability.

## 🧬 Data Models (GraphQL)

### Core Entities

- **User** — Profile, XP, scan limits
- **Artwork** — Data enriched by the MET Museum API
- **Department** — Museum departments/collections
- **Quest** — Challenges for gamified experiences
- **Rank** — User levels based on XP

### User Interaction

- **Favorited** — User's favorite artworks
- **Visited** — Visit history of IRL scan of Artworks
- **UserQuest** — Quest progress tracking
- **UserXP** — Experience tracking over time

### Content Management

- **DidYouKnow** — Educational trivia
- **GalleryMap** — Indoor navigation
- **ArtFact** — Curated artwork fun facts

## 🔑 Key Features

### 1. Authentication

- Email Sign-In via **AWS Cognito**
- Secure session handling using **Identity Pools** and **IAM**

### 2. Artwork Discovery

- Featured artwork carousel with data fetched via **AWS AppSync** and **GraphQL API**
- Department-based and searchable browsing using **DynamoDB**
- Rich artwork detail pages, with media assets served from **AWS S3**

### 3. Augmented Reality (AR)

- `react-native-webview` integration for **8th Wall** AR viewer
- High-quality 3D scans of artworks captured using Polycam, a mobile app for creating detailed 3D models
- AR content URLs dynamically pulled from DynamoDB and stored in S3
- Transitions managed with native navigation + dynamic content delivery

### 4. Camera + Image Recognition

- Camera via `expo-camera@16`
- Images securely uploaded to AWS S3 with signed IAM credentials
- **AWS Lambda** triggers post-upload to process images
- **AWS Rekognition** performs real-time artwork identification
- Orchestration handled via **API Gateway** and logged through **CloudWatch**

### 5. Gamification

- Quest challenges with XP rewards
- Rank progression system
- Premium-only quests and rewards

### 6. Social & Progress Tracking

- Favorites, visited history, and XP dashboards managed in DynamoDB
- Updates pushed via AppSync for low-latency UI responsiveness
- Global state synced with custom React hooks and secure backend logic

## 🧩 Custom Hook Architecture

All major logic modules are abstracted into hooks with consistent, reusable patterns.

### Core Hooks

- `useAuth` — Auth context and session control
- `useArtwork(s)` — Data fetch and caching
- `useFavorites` — Global favorite state
- `useQuests`, `useUserQuests` — Quest logic and progress
- `useDidYouKnow`, `useGalleryMaps` — Educational content + maps

### Context

- `FavoritesContext` manages global favorite state with:
  - Optimistic updates
  - Cross-component refresh control

## ✅ Current App Status

The application is **fully functional** and production-ready with:

- Complete authentication & session control
- Dynamic, database-powered artwork browsing
- Image recognition & scanning
- Augmented reality experiences
- XP-based gamified quests
- Social features (favorites, progress, stats)

The codebase reflects:

- Great separation of concerns
- Clean error handling
- Scalable patterns for growth
- Tight integration between React Native and AWS

## 📞 Contact

Want to learn more or connect with us? Meet the team behind ARtifact:

- <a href="https://www.linkedin.com/in/manfredjoa/" target="_blank" rel="noopener">Manfred Joa</a>
- <a href="https://www.linkedin.com/in/norman8823/" target="_blank" rel="noopener">Norman Li</a>
- <a href="https://www.linkedin.com/in/raul-jiminian/" target="_blank" rel="noopener">Raul Jiminian</a>

We'd love to hear from you!

---

> Built with ❤️ using React Native, Expo, and AWS Amplify
