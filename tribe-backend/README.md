# Tribe

**Tribe** is a creative compatibility network where creators connect based on shared interests, geographical proximity, and creative output. Built with a high-end "Warm Sand & Ink" editorial design aesthetic (inspired by Japanese design magazines and Kinfolk), the platform feels immersive, intentional, and curated.

## Features

- **Interest-Based Discovery:** A recommendation engine ranks creators based on shared interests, geographical distance, and activity factors.
- **Editorial Aesthetics:** Unique visual identity utilizing a Warm Sand & Ink palette (creams, subtle sepias, muted sage/clay/indigo) and sophisticated typography (Fraunces and Cormorant Garamond).
- **Interactive Profiles (ScrollStack):** Profiles utilize a vertical storytelling layout, where expressive cards stack, scale, and blur smoothly as you scroll—like flipping through a magazine.
- **Real-Time Encounters:**
  - Instantly swipe/like creators.
  - Mutual likes create a "Match."
  - Real-time chatting powered by WebSockets (`socket.io`), complete with online presence and typing indicators.
- **Responsive System:** A fluid, mobile-first container system featuring a sticky App-like bottom navigation on mobile devices, seamlessly scaling into a desktop layout.
- **Rich Portfolios:** Dedicated grids for images, videos, and multi-piece expression walls.

## Tech Stack

- **Frontend:** Next.js (App Router), React, CSS Modules / JSX styling, lucide-react (icons).
- **Backend:** Node.js / Next.js API Routes.
- **Database:** PostgreSQL accessed via Prisma ORM.
- **Real-Time Communication:** Socket.IO server.
- **Authentication:** Custom JWT-based Authentication seamlessly integrated through `/api/auth`.

## Core Project Architecture

- `src/app/(protected)`: The primary application shell containing the Feed (`/feed`), Matches & Chat (`/matches`), Profile (`/me` and `/profile/[id]`), and Settings (`/settings`).
- `src/components/`: Reusable, encapsulated UI components (`ScrollStack`, `Navbar`, `MobileBottomNav`, `MatchesList`).
- `src/styles/designTokens.ts`: The central nervous system for our Warm Sand & Ink CSS design specs (colors, shadows, spacing, typographic pairings).
- `src/api/`: REST endpoints handling matchmaking interactions, auth routines, profile updates, and compatibility engine signals.

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone <repo_url>
   cd tribe-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file in the root directory. You will need variables for:
   - `DATABASE_URL` for PostgreSQL.
   - `JWT_SECRET` for token signing.
   - Any other essential variables your Prisma instance or Next.js setup requires.

4. **Initialize the Database:**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to interact with the platform.

6. **Run the WebSocket Server (If external):**
   ```bash
   npm run socket
   ```

## Design Philosophy

We believe social networks don't have to feel corporate or visually sterile. Tribe embraces:
- **Serif over Sans:** Breaking web norms by using classic optical typography designed originally for physical print.
- **Earth Pigments over Neons:** Replacing standard blue links and active greens with parchment backgrounds, sage highlights, and deep clay/indigo accents.
- **Motion with Purpose:** Transitions scale and breathe cleanly via native CSS hardware acceleration without over-engineering layout jumps.

---

*Made with intention for the creative community.*
