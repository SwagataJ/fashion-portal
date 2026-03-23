# Fashion AI Platform

> **AI-Powered Concept-to-Commerce Platform for Fashion Retail Teams**

A production-grade fashion intelligence platform that unifies design, merchandising, photography, catalog, and marketing workflows into one connected AI workspace. Built for **designers, buyers, merchandisers, and marketing teams** who need to move faster, collaborate better, and make data-backed creative decisions.

---

## What Problem Does This Solve?

Fashion teams operate in silos:

| Team | The Problem |
|------|-------------|
| **Designer** | Trend research takes 2–3 days. Concepts get lost in translation. Color choices are gut-feel. |
| **Buyer** | Waits weeks for product photography and catalog copy. No visibility into design rationale. |
| **Merchandiser** | VM layouts planned in Excel with no visual preview. Design intent never reaches the store. |
| **Marketing** | Campaigns take 2–3 weeks via agencies. Photo shoots cost ₹50K–₹5L per session. |

**Fashion AI Platform** replaces fragmented tools with one intelligent, connected workspace — cutting task times from days to minutes.

---

## Platform at a Glance

| Metric | Value |
|--------|-------|
| AI Modules | 9 |
| API Endpoints | 75+ |
| Frontend Pages | 12 |
| Backend Services | 15 |
| Time Saved (avg) | 95%+ per task |
| Avg Task Time | < 2 minutes |

---

## Modules

### 1. Artifax — AI Design Concept Studio
**For:** Designers, Creative Directors, Brand Strategists

The end-to-end design workspace that takes a brief and produces presentation-ready concepts.

| Panel | What It Does |
|-------|-------------|
| **Research** | AI scans seasonal trends, runway data, regional signals, and competitor positioning in 30 seconds. Returns structured insights with actionable direction. |
| **Moodboard Canvas** | Drag-and-drop visual collage builder. Upload inspiration images, place them on a Konva canvas, add text overlays. Replaces Pinterest + Figma + folder chaos. |
| **Moodboard AI** | Generate atmospheric editorial imagery directly from the canvas. The AI reads the images already on your board — matching colour palette, mood, and texture — and generates 2 new coherent images (wide editorial + macro detail). Theme, mood, and colour story are optional overrides. |
| **Color Studio** | Generate AI palettes from season/mood, or extract colors directly from uploaded images. Returns hex codes and Pantone-ready values. |
| **Concept Visualisation** | Generates 2 distinct AI concept variations from a single brief. High-fidelity renders ready for internal presentations. Powered by Gemini + Vertex AI. |

---

### 2. Trend Radar — Fashion Intelligence Engine
**For:** Buyers, Designers, Merchandisers, Brand Strategists

Four analysis modes grounded in **live Google Trends data** (90-day rolling window) + **Gemini Google Search grounding** for real-time web intelligence:

| Mode | Description |
|------|-------------|
| **Trend Radar** | Seasonal & market trend analysis. Returns 8–12 trends per scan with scores (0–100), growth trajectory (rising/stable/declining), descriptions, and color hex codes. Scores are calibrated against real Google Search interest data. |
| **Trend Scout** | Free-text search across trend categories and geographies. Surfaces niche and emerging micro-trends. Filters breakout/rising queries from live search data. |
| **Brand Compare** | Side-by-side competitive analysis — positioning, strengths, gaps, and white-space opportunities across price segments. |
| **Top Trends** | Global trend snapshot across all categories. Perfect for weekly team alignment meetings. |

**Categories supported:** Womenswear · Menswear · Ethnicwear · Kidswear · Innerwear · Footwear · Accessories

**Markets supported:** Global · India · US · UK · France · Italy · Japan · China · Australia

**Data pipeline:**
1. Google Trends (pytrends) fetches 90-day interest scores, rising queries, and breakout terms for the category + market
2. Gemini receives this as structured context alongside the prompt
3. Gemini Google Search grounding adds real-time web intelligence from fashion media, runway coverage, and retail signals
4. Output trend scores reflect actual consumer search momentum — not just training data

**UX:** Click any trend card to see the full description, colour swatch, and hex code in a modal.

- Covers seasons SS25 through AW27
- Full scan completes in under 60 seconds
- Growth indicators: rising / stable / declining

---

### 3. VM Tower — Visual Merchandising Platform
**For:** Visual Merchandisers, Store Designers, Buyers, VM Teams

The only tool that enforces design intent at store level. A 7-panel sequential workflow:

```
Design Intent → AI Layout Gen → Products & Fixtures → Concept Lock → Buyer Flex → VM Output → Shoot Plan
```

| Panel | Description |
|-------|-------------|
| **Design Intent** | Define theme, season, color flow, category mix, styling rules, store type, and visual mood. Upload a range image — AI auto-detects all parameters. |
| **AI Layout Generation** | AI generates 4 layout suggestions (wall story, fixture plan, mannequin grouping, focal display) constrained to your design intent. |
| **Products & Fixtures** | Upload SKUs with images. AI auto-groups into range stories. Add fixture specs (gondolas, wall units, mannequins). Batch upload supported. |
| **Concept Lock** | Lock approved layouts with enforced rules: color continuity, focal hierarchy, category balance, placement constraints. Three levels: Strict / Moderate / Flexible. |
| **Buyer Flex** | Buyers make controlled edits within approved flexibility rules. Every change is validated against the concept lock in real time. |
| **VM Output** | Export finalized merchandising specs, VM guidelines, floor plans, and product-placement maps — ready for store teams. |
| **Shoot Plan** | Auto-generates a photography brief mapping each product to its fixture and scene. Feeds directly into Scene Builder and Model Studio. |

**Workflow States:**
```
Intent Defined → AI Layout Suggested → Designer Approved → Concept Locked → Buyer Editing → Finalized → VM Ready
```

---

### 4. Photogenix — AI Product Photography Engine
**For:** Buyers, E-commerce Managers, Merchandisers

Transforms raw product images into studio-quality e-commerce photography — no photographer, no studio, no retoucher.

**Two-step AI pipeline:**

1. **Vision Analysis** — Gemini analyses the uploaded image: garment type, silhouette, colors, fabric texture, cut, patterns, embellishments, hardware, and style aesthetic.
2. **Image Generation** — Using the description + user preferences, Vertex AI renders a new studio-quality image.

**Available options:**

| Option | Choices |
|--------|---------|
| Backgrounds | White Studio · Lifestyle · Gradient · Outdoor · Minimal |
| Shooting Styles | Studio · Lifestyle · Editorial · E-commerce |

- 20 total combinations (5 backgrounds × 4 styles)
- Only the most prominent garment is featured
- Ghost mannequin or flat lay presentation
- No logos, no people, no mannequins in output
- ~98% time saved vs. traditional photo shoot

---

### 5. Catalogix — SEO-Optimised Catalog Generator
**For:** Merchandisers, E-commerce Managers, Content Teams

Generates complete catalog copy per SKU in 60 seconds.

**Inputs:**
- Product name
- Department (Menswear · Womenswear · Ethnicwear · Kidswear · Innerwear · Beauty · Footwear)
- Category (Tops · Bottoms · Dresses · Outerwear · Knitwear · Denim · Activewear · Footwear · Bags · Accessories · Swimwear · Lingerie)
- Product attributes (free text)
- Product image *(optional — enables vision-enhanced copy)*

**AI-Generated Output:**
- SEO title (max 60 characters, keyword-optimised)
- 150-word product description (style, fit, occasion, USPs)
- 5 bullet feature points for PDPs
- 10 SEO keywords
- 8 hashtags / taxonomy tags
- Confidence score (0–100%)

All fields are fully editable before export. Human-in-the-loop by default.

---

### 6. Campaign Builder — Marketing Asset Creator
**For:** Marketing Managers, Social Media Teams, Brand Managers

AI-generated campaign visuals across 6 formats and 6 style presets.

**Formats:** Hero Banner · Lookbook Page · Social Post · Email Header · Ad Creative · Editorial

**Styles:** Premium · Minimal · Bold · Editorial · Playful · Luxury

**Inputs:** Headline, subheadline, CTA text, product description, custom prompt override

**Output rules:**
- No logos or brand marks generated
- No watermarks or email addresses
- Clean, brand-neutral output every time

Campaign history is saved with full config for versioning and reuse. Generation time: under 2 minutes.

---

### 7. Model Studio — AI Fashion Model Generation
**For:** Photographers, Buyers, E-commerce Teams, Casting Directors

Generate diverse, professional fashion models — no casting agency, no studio booking.

| Parameter | Options |
|-----------|---------|
| Gender | Male · Female · Non-binary |
| Age Range | 18–24 · 25–30 · 31–40 · 40+ |
| Ethnicity | South Asian · East Asian · Black · White · Hispanic · Middle Eastern · Mixed |
| Body Type | Slim · Athletic · Curvy · Plus-size |
| Pose | Standing · Walking · Seated · Editorial · Dynamic |
| Expression | Neutral · Smiling · Serious · Confident · Candid |
| Shoot Mood | Editorial · E-commerce · Lifestyle · Street · Luxury |

700+ unique combinations. 4K quality output. ~1 minute per model.

---

### 8. Scene Builder — Photography Environment Generator
**For:** Set Designers, Photographers, VM Teams

Generate professional photography backdrops — no set build, no location fee.

| Control | Options |
|---------|---------|
| Environments | Studio · Outdoor · Urban Street · Luxury Interior · Runway · Beach · Cafe · Rooftop · Boutique · Desert · Editorial · Custom |
| Lighting | Softbox · Natural Daylight · Warm Golden · Dramatic · High-Fashion · Moody |
| Camera Angles | Full Body · Close-up · Editorial Crop · E-commerce · 3/4 Angle |
| Fine Controls | Warmth slider (0–100) + Intensity slider (0–100) |

360+ setting combinations. Empty scenes ready for product or model compositing. ~30 seconds per scene.

---

### 9. AI Copilot — Conversational Fashion Assistant
**For:** Everyone — all four teams

An always-on creative director, trend analyst, copywriter, and VM advisor in one chat interface.

**Capabilities:**
- Trend analysis and seasonal direction
- Color palette suggestions with rationale
- Styling recommendations by target audience
- Campaign brief writing and ideation
- VM layout advice and display planning
- Competitive intelligence queries
- Product description drafting
- Design feedback and critique

**Smart features:**
- Season-aware (always knows the current active season — SS26 as of 2026)
- Markdown-formatted responses rendered in the UI
- 3 auto-suggested follow-up prompts per response
- Full conversation history maintained

**Example prompts by role:**

```
Designer:      "Suggest a color palette for SS26 with a nature + tech duality"
Buyer:         "What silhouettes are trending in menswear for AW26?"
Merchandiser:  "How should I build a wall story for an ethnic kurta range?"
Marketing:     "Write a campaign brief for our new luxury innerwear launch"
```

---

## Architecture

```
Fashion AI Platform
├── Frontend (Next.js 14 App Router)
│   ├── 12 page routes
│   ├── Dark/light theme system via CSS variables
│   ├── Zustand state management (persisted)
│   └── Framer Motion animations throughout
│
├── Backend (FastAPI)
│   ├── 11 API routers / 70+ endpoints
│   ├── 14 service layer modules
│   ├── SQLAlchemy ORM + SQLite
│   └── JWT authentication (24-hour tokens)
│
└── AI Layer
    ├── Google Gemini 2.0 Flash
    │   ├── Text generation (trends, copy, guidelines)
    │   ├── JSON generation (structured outputs)
    │   └── Vision analysis (product/range image understanding)
    │
    └── Vertex AI — Image Generation
        └── Gemini image model (multimodal generation)
            Used for: product photos, campaign visuals,
            AI models, scene backdrops, VM mockups
```

---

## Tech Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| Next.js 14 | React framework with App Router |
| TypeScript | Type safety across all components |
| Tailwind CSS | Utility-first styling with custom dark theme |
| Framer Motion | Animations and page transitions |
| Zustand | Global state management with persistence |
| Axios | HTTP client with JWT interceptors |
| Lucide React | Icon library |
| React Konva | Canvas-based moodboard in Artifax |
| React Markdown | Markdown rendering for AI Copilot responses |

### Backend

| Technology | Purpose |
|-----------|---------|
| Python 3.11+ | Runtime |
| FastAPI | Async web framework with auto-generated API docs |
| SQLAlchemy 2.0 | ORM with declarative models |
| Pydantic v2 | Request/response validation and serialization |
| python-jose | JWT token generation and verification |
| passlib + bcrypt | Password hashing |
| google-genai | Google Gemini AI SDK |
| google-auth | GCP service account authentication |
| pytrends | Google Trends data (real-time search interest) |
| Pillow | Image processing |

### AI & Cloud

| Service | Usage |
|---------|-------|
| Google Gemini 2.0 Flash | All text/JSON/vision tasks |
| Gemini Google Search Grounding | Real-time web search for Trend Radar |
| Vertex AI (Gemini image model) | All image generation tasks |
| Google Trends (pytrends) | 90-day search interest data for trend scoring |
| GCP Service Account | Authentication for AI API access |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Google Cloud service account with **Vertex AI User** role

### 1. Clone the repo

```bash
git clone https://github.com/SwagataJ/fashion-portal.git
cd fashion-portal
```

### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Mac/Linux
# .\venv\Scripts\activate       # Windows

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure credentials

Place your GCP service account JSON at:
```
backend/credentials/service-account.json
```

Optionally create `backend/.env` to override defaults:
```env
GCP_PROJECT_ID=your-gcp-project-id
GCP_LOCATION=global
GEMINI_TEXT_MODEL=gemini-2.0-flash
JWT_SECRET=your-secret-key-here
```

### 4. Start the backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

On first run, the backend will:
- Create the SQLite database (`fashion_platform.db`)
- Create all storage directories (`uploads/`, `generated/`)
- Seed the default admin user

API docs available at: **http://localhost:8000/docs**

### 5. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:3000**

### 6. Login

| Field | Value |
|-------|-------|
| Email | `admin@fashion.ai` |
| Password | `admin123` |

---

## Project Structure

```
fashion-portal/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI entry point + lifespan
│   │   ├── api/                        # Route handlers
│   │   │   ├── auth.py
│   │   │   ├── artifax.py
│   │   │   ├── photogenix.py
│   │   │   ├── catalogix.py
│   │   │   ├── dashboard.py
│   │   │   ├── vm_tower.py
│   │   │   ├── model_studio.py
│   │   │   ├── scene_builder.py
│   │   │   ├── trend_radar.py
│   │   │   ├── campaign_builder.py
│   │   │   └── copilot.py
│   │   ├── core/
│   │   │   ├── config.py               # All settings (env-configurable)
│   │   │   ├── database.py             # SQLAlchemy engine + session
│   │   │   ├── dependencies.py         # Auth dependency injection
│   │   │   ├── gemini_client.py        # Shared AI client helpers
│   │   │   └── gcp_auth.py             # GCP service account auth
│   │   ├── models/                     # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── artifax.py
│   │   │   ├── photogenix.py
│   │   │   ├── catalogix.py
│   │   │   ├── vm_tower.py             # 9 VM tables
│   │   │   └── campaign.py
│   │   ├── schemas/                    # Pydantic schemas
│   │   └── services/                   # Business logic
│   │       ├── auth_service.py
│   │       ├── artifax_research_service.py
│   │       ├── artifax_concept_service.py
│   │       ├── artifax_visualization_service.py
│   │       ├── photogenix_service.py
│   │       ├── catalogix_service.py
│   │       ├── design_intent_service.py
│   │       ├── layout_generation_service.py
│   │       ├── concept_lock_service.py
│   │       ├── ai_validation_service.py
│   │       ├── vm_guideline_service.py
│   │       ├── google_trends_service.py
│   │       └── nano_banana_service.py
│   ├── credentials/                    # GCP credentials (not committed)
│   ├── uploads/                        # User-uploaded files (not committed)
│   ├── generated/                      # AI-generated outputs (not committed)
│   └── requirements.txt
│
├── frontend/
│   ├── app/                            # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── artifax/page.tsx
│   │   ├── photogenix/page.tsx
│   │   ├── catalogix/page.tsx
│   │   ├── vm-tower/page.tsx
│   │   ├── model-studio/page.tsx
│   │   ├── scene-builder/page.tsx
│   │   ├── trend-radar/page.tsx
│   │   ├── campaign-builder/page.tsx
│   │   └── copilot/page.tsx
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── ThemeToggle.tsx
│   ├── hooks/useAuth.ts
│   ├── lib/
│   │   ├── api.ts                      # Axios instance + JWT interceptors
│   │   ├── auth.ts                     # Token management
│   │   └── utils.ts
│   ├── store/
│   │   ├── artifaxStore.ts
│   │   └── vmTowerStore.ts
│   ├── types/index.ts
│   ├── globals.css                     # Theme variables + utility classes
│   ├── tailwind.config.ts
│   └── next.config.js
│
└── README.md
```

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Artifax
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/artifax/research/trends` | AI trend analysis |
| POST | `/api/artifax/research/competitor` | Competitor analysis |
| POST | `/api/artifax/research/runway` | Runway analysis |
| POST | `/api/artifax/concept/generate` | Generate concept images |
| POST | `/api/artifax/concept/color` | Generate color palette |
| POST | `/api/artifax/concept/extract-colors` | Extract colors from image |
| POST | `/api/artifax/moodboard/generate` | Generate moodboard imagery from canvas images |
| POST | `/api/artifax/visualization/generate` | Product visualization |

### VM Tower (40+ endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/vm-tower/analyze-range-image` | AI auto-detect from range image |
| POST | `/api/vm-tower/intents` | Create design intent |
| PUT | `/api/vm-tower/intents/{id}` | Update intent |
| PATCH | `/api/vm-tower/intents/{id}/status` | Update workflow status |
| POST | `/api/vm-tower/layouts/generate` | AI generate layouts |
| POST | `/api/vm-tower/intents/{id}/layouts/approve` | Approve layout |
| PUT | `/api/vm-tower/layouts/{id}/zones` | Update drag-drop zones |
| POST | `/api/vm-tower/concept-lock` | Activate concept lock |
| POST | `/api/vm-tower/buyer-edit` | Submit buyer edit (AI validated) |
| POST | `/api/vm-tower/intents/{id}/guidelines` | Generate VM guidelines |
| POST | `/api/vm-tower/intents/{id}/shoot-plan` | Generate shoot plan |
| POST | `/api/vm-tower/intents/{id}/export` | Export full VM plan |

### Other Modules
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/photogenix/generate` | Generate enhanced product photo |
| POST | `/api/catalogix/generate` | Generate catalog content |
| GET | `/api/dashboard/stats` | Dashboard stats |
| POST | `/api/model-studio/generate` | Generate AI fashion model |
| POST | `/api/scene-builder/generate` | Generate scene/backdrop |
| POST | `/api/trend-radar/analyze` | Analyze trends |
| POST | `/api/trend-radar/scout` | Search-based trend discovery |
| POST | `/api/trend-radar/compare` | Compare brands |
| GET | `/api/trend-radar/top` | Top global trends |
| POST | `/api/campaign-builder/generate` | Generate campaign visual |
| POST | `/api/campaign-builder/save` | Save campaign |
| POST | `/api/copilot/chat` | Chat with AI Copilot |

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | Authentication — email, hashed password |
| `artifax_projects` | Design projects — research, palette, concepts as JSON |
| `photogenix_projects` | Photo history — original, generated, background, style |
| `catalogix_projects` | Catalog history — input config, output as JSON |
| `campaign_projects` | Saved campaigns — format, config, result image URL |

### VM Tower Tables (9 tables)

| Table | Purpose |
|-------|---------|
| `design_intents` | VM workflows — theme, season, colors, categories, mood, status |
| `vm_layouts` | Layout configs — type, placement, zone data, mockup, approval |
| `product_ranges` | Products — SKU, name, category, color, fabric, image |
| `vm_fixtures` | Store fixtures — type, positions, labels, dimensions |
| `concept_locks` | Design constraints — color, hierarchy, balance, flexibility level |
| `buyer_edits` | Edit history — type, data, AI validation result |
| `vm_guidelines` | Output docs — instructions, shot list, styling notes |
| `layout_versions` | Version snapshots for rollback |
| `shoot_plans` | Photography plan — outfit combos, shot sequence, checklist |

---

## Configuration

All backend settings live in `backend/app/core/config.py` and can be overridden via environment variables or `backend/.env`:

| Setting | Default | Description |
|---------|---------|-------------|
| `JWT_SECRET` | *(change in prod)* | JWT signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | 24-hour token lifetime |
| `DATABASE_URL` | `sqlite:///./fashion_platform.db` | Swap for PostgreSQL in prod |
| `UPLOAD_DIR` | `uploads` | User upload storage |
| `GENERATED_DIR` | `generated` | AI output storage |
| `SERVICE_ACCOUNT_PATH` | `credentials/service-account.json` | GCP credentials |
| `GCP_PROJECT_ID` | — | Your Google Cloud project ID |
| `GCP_LOCATION` | `global` | Vertex AI location |
| `GEMINI_TEXT_MODEL` | `gemini-2.0-flash` | Text generation model |

---

## Theme System

The platform supports **dark mode** (default) and **light mode** via CSS custom properties on a `data-theme` attribute.

Key utility classes:
- `bg-primary`, `bg-surface`, `bg-card` — theme-aware backgrounds
- `t-heading`, `t-primary`, `t-secondary`, `t-muted` — theme-aware text
- `card`, `btn-gradient`, `btn-secondary`, `input-base` — component styles
- `shimmer`, `gradient-text` — visual effects

---

## Scalability Notes

- **Database** — SQLAlchemy ORM abstracts the DB layer; swap SQLite → PostgreSQL by changing `DATABASE_URL`
- **File Storage** — Local filesystem can be replaced with S3 or GCS by abstracting the storage layer
- **AI Models** — All model IDs are configurable via environment variables
- **Auth** — JWT-based auth is multi-user ready with role-based access control
- **API** — FastAPI runs with Uvicorn workers; production-ready with Gunicorn

---

## License

Licensed under the **Apache License, Version 2.0**.
You may not use this project except in compliance with the License.
A copy of the License is included in this repository as [LICENSE](./LICENSE).

```
Copyright 2026 SwagataJ

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
