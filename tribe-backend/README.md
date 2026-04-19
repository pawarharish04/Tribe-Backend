# Tribe

**Tribe** is a next-generation creative compatibility network where creators connect based on shared interests, geographical proximity, and creative output. Enhanced with **Advanced AI & AWS Cloud Integration**, Tribe delivers an ultra-personalized, safe, and frictionless networking experience inside a high-end "Warm Sand & Ink" editorial design aesthetic.

## 🚀 Ultra-Capabilities (AI & Cloud)

Tribe uses state-of-the-art Generative AI and Cloud Machine Learning to handle matching, discoverability, and moderation seamlessly in the background.

- **Vector Semantic Matchmaking:** The `Compatibility Engine` uses AI Models (Google Gemini) to transform user bios and interests into 768-dimensional embeddings. PostgreSQL's `pgvector` runs real-time cosine-similarity mathematics (`<=>`) to instantly connect creators with synergistic vibes, looking past raw keywords into the actual meaning of their profiles.
- **Visual Auto-Tagging:** When a user uploads an image, the backend streams the image blob directly to **AWS Rekognition**. The AI automatically detects objects in the scenery (e.g., "Surfboard", "Music Studio") and attaches relevant Interest Tags to the post seamlessly.
- **Autonomous Content Policeman:** The platform requires zero human moderation for initial safety. **AWS Rekognition** scans all incoming visual media and automatically blocks Explicit/Suggestive imagery before it hits the database.
- **Real-Time Toxic Chat Filtering:** The `Socket.io` chat server inherently protects the community by running all incoming messages through **AWS Comprehend**. Hate speech, harassment, and spam are blocked from being broadcasted and flagged instantly.
- **Algorithmic Feeds:** Every Like, Pass, and Superlike interaction is streamed directly to **AWS Personalize**. This enables TikTok-style Recommendation Engines to power the "For You" discovery feeds.

## ✨ Core Features

- **Interest-Based Discovery:** A dynamic algorithm combining Vector AI score (40%), Shared Interests (30%), Content (20%), and Past Interactions (10%).
- **Editorial Aesthetics:** Unique visual identity utilizing a Warm Sand & Ink palette (creams, subtle sepias, muted sage/clay/indigo) and sophisticated typography (Fraunces and Cormorant Garamond).
- **Interactive Profiles (ScrollStack):** Profiles utilize a vertical storytelling layout, where expressive cards stack, scale, and blur smoothly as you scroll—like flipping through a magazine.
- **Real-Time Encounters:**
  - Instantly swipe/like creators.
  - Mutual likes create a "Match."
  - Real-time chatting powered by WebSockets (`socket.io`), complete with online presence and typing indicators.

## 🛠 Tech Stack

- **Frontend:** Next.js (App Router), React, CSS Modules / JSX styling, framer-motion.
- **Backend:** Node.js / Next.js API Routes.
- **Database:** PostgreSQL accessed via Prisma ORM (utilizing `pgvector`).
- **AI & ML Cloud:** AWS SDK (Rekognition, Comprehend, Personalize), Google Generative AI (Gemini).
- **Real-Time:** Socket.IO server.
- **Authentication:** Custom JWT-based Authentication seamlessly integrated through `/api/auth`.

## ⚙️ Getting Started

1. **Clone the repository:**
   ```bash
   git clone <repo_url>
   cd tribe-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment (`.env`):**
   Create a `.env` file in the root directory. You will need:
   ```env
   # Database & Auth
   DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
   JWT_SECRET="your_secret"

   # AWS & AI Integration Keys
   AWS_REGION="us-east-1"
   AWS_ACCESS_KEY_ID="your_aws_key"
   AWS_SECRET_ACCESS_KEY="your_aws_secret"
   PERSONALIZE_TRACKING_ID="your_tracker_id"
   GEMINI_API_KEY="your_gemini_key"
   ```

4. **Initialize the Database (Requires PostgreSQL with `pgvector` enabled):**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to interact with the platform.

6. **Run the WebSocket Server:**
   ```bash
   npm run socket
   ```

---

*Made with intention for the creative community.*
