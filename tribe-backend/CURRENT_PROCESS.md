# Tribe Backend - Architecture & Current Progress

## Architecture Overview
- **Framework**: Next.js App Router (serving as API backend via Route Handlers `src/app/api/...`)
- **Language**: TypeScript
- **Database**: PostgreSQL (hosted on Neon)
- **ORM**: Prisma Client (with Pg Adapter)
- **Authentication**: JWT-based (stateless)

## Database Schema (Prisma Models)
- **User**: Core entity holding credentials, profile info, and geo-location (`latitude`, `longitude`).
- **Interest**: Hierarchical taxonomy of interests (supports parent-child tree relationships).
- **UserInterest**: Join table explicitly linking Users and Interests with a proficiency `level`.
- **Interaction**: Records user swipes/actions (`LIKE`, `PASS`, `SUPERLIKE`).
- **MatchUnlock**: Represents a mutual match established between two users.
- **Media**: Abstracted media layer for storing isolated image/video metadata linked to users.
- **InterestPost**: "Expressed Identity". Associates a user, an interest, optional media, and a caption. Strongly typed with a constraint of **max 5 posts per interest per user**.
- **FeedImpression**: Tracks which candidates a user has already seen in their feed, allowing the system to progressively hide them and create a dynamic discovery experience without algorithmic fatigue.

## Core Systems & Implementation State

### 1. Authentication (`/api/auth`)
- `POST /api/auth/register`: Basic email/password registration with password hashing.
- `POST /api/auth/login`: Validates credentials and issues secure stateless JWT tokens for protected route access.

### 2. Algorithmic Matching Engine (`src/lib/matching.ts`)
A highly tuned three-layered scoring system (capped at 100 points) that ranks candidate compatibility:
1.  **Declared Identity (Base Scoring)**:
    -   Exact Match: `+30` points.
    -   Parent-Child Level Match: `+18` points.
    -   Same-Category (Sibling) Match: `+12` points.
    -   *Modifier*: Base scores receive a slight multiplier based on mutual interest proficiency (strength weight).
2.  **Expressed Identity (Behavioral Post Boost)**:
    -   Candidates gain a slight additive boost (`+2` points per post, max `+6` points) if they have actively posted content linked to interests shared with the observing user.
3.  **Geo-Location Scaling (Distance Factor)**:
    -   Matches are not subtractively punished by distance, but instead logarithmically scaled via a multiplicative falloff:
        -   `<= 5km`: `1.0x` (100% score retention)
        -   `<= 20km`: `0.9x`
        -   `<= 50km`: `0.8x`
        -   `<= 100km`: `0.7x`
        -   `> 100km`: `0.6x` (Global baseline)

### 3. Progressive Feed Generation (`/api/feed`)
The feed pipeline executes in a heavily optimized manner:
- Checks if the user has baseline interests.
- Fetches candidate pools from the database excluding past explicit interactions (`Interaction`).
- Filters out already exposed candidates (`FeedImpression`) within the **last 48 hours**, preventing immediate staleness while creating a soft re-introduction cycle over time.
- Performs a highly specific bounding-box geo-search (`~55km` radius) if the user has GPS coordinates; otherwise, executes a global fallback.
- Enriches the fetched candidates with their latest 3 `InterestPosts` in a **single nested Prisma query** to avoid N+1 retrieval problems.
- Iterates candidates, calculates their exact similarity distances and interest overlap using the Matching Engine.
- Sorts candidates descending by their `.finalScore` and truncates to a paginated Top 20 array.
- Injects a background bulk-write to `FeedImpression` exactly mapping the Top 20 array to log that the user has now visually seen these candidates.
- *Resilience Hook*: If the impression filter completely drains the local pool (length 0), the filter drops and safely reroutes back to evaluating all known candidates.

### 4. Expression Layer (`/api/media`, `/api/interest-post`)
- Isolated endpoints for storing raw media URLs and strongly defining `InterestPost` entities.
- Enforces strict depth control before DB insertion.

### 5. Telemetry & Sandbox Tooling (`/api/seed`, `/debug-feed`)
- `/api/seed`: Instantly purges and injects a deterministic synthetic test-bed of random users (scattered nearby) with randomly assigned hierarchical interest trees to allow accurate validation of changes to the matching algorithm.
- `/debug-feed`: A custom internal frontend UI harness. Displays candidates mirroring exact app conditions. Visually breaks down exact score derivations, exact distance scaling modifiers, categorical alignments, and previews their latest Interest Posts.
