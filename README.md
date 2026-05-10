# 📡 TV Empire

A TV network simulation game built with React + Vite.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Then open http://localhost:5173 in your browser.

## Build for production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── main.jsx          # React entry point
├── App.jsx           # Root component + game state
├── theme.js          # Design tokens (colors)
├── constants.js      # All game data (networks, pools, tiers)
├── engine.js         # Pure game logic (no React)
├── index.css         # Global styles + animations
└── components/
    ├── ui.jsx         # Shared atoms (HTag, Bar, KV, Ticker, etc.)
    ├── ProgRow.jsx    # Individual program display
    ├── StationCard.jsx # Expandable station card
    ├── AwardsPanel.jsx # Year-end awards ceremony
    └── StatsTab.jsx   # Stats & history tab
```

## How to Play

Each year has 4 seasons (Spring → Summer → Autumn → Winter).

**Each season has 3 phases:**
1. **Budget** — Review budgets, see which shows are up for renewal
2. **Announce Schedules** — All 14 networks set their programs. Costs are revealed.
3. **Run the Season** — Ratings computed, revenue awarded, budgets updated.

After all 4 seasons: **Year-End Awards** with public prizes and critics awards.

### Revenue Model
Programs compete within segments (Primetime, Weekend, Morning, News):
- **Segment winner** → $10/viewer
- **2nd place** → $9/viewer  
- **Everyone else** → $8/viewer

### Franchise Rules
Networks can renew shows season-over-season, but back-to-back runs decay hype:
- S2 fresh renewal: no penalty
- S3 back-to-back: −1 hype tier
- S4 back-to-back: −2 hype tiers
- Leave a gap season to reset

### Hype Tiers
| Tier | Rarity | Rating Mult | Base Cost |
|------|--------|-------------|-----------|
| Legendary | ~2% | ×5.5 | $28M+ |
| Epic | ~6% | ×3.2 | $14M+ |
| Rare | ~17% | ×2.0 | $6M+ |
| Uncommon | ~35% | ×1.4 | $2.8M+ |
| Common | ~40% | ×1.0 | $1.2M+ |
