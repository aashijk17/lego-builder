# LEGO Set Builder

A web application that helps LEGO enthusiasts discover which sets they can fully build with bricks from their existing collection.

## Vision

**MVP**: "I own sets X, Y, Z. What other sets can I fully build?"

**Future**: Recommend sets where you only need to buy a few bricks individually.

---

## Tech Stack

- **Frontend**: React
- **Backend**: Node.js + Express
- **Data Pipeline**: Python
- **Database**: MongoDB
- **Deployment**: Docker Compose (local dev), expandable to cloud

---

## Quick Start

### Prerequisites
- Docker & Docker Compose (install from [docker.com](https://www.docker.com/products/docker-desktop))
- Git
- Code editor (VS Code recommended)

### Setup (5 minutes)

```bash
# 1. Clone repo
git clone <your-repo>
cd lego-builder

# 2. Start all services with Docker
docker-compose up -d

# 3. Check logs
docker-compose logs -f

# 4. Fetch initial data (run this once)
docker-compose exec python python scripts/fetch_lego_data.py

# 5. Backend should be at http://localhost:5000
# 6. Frontend will be at http://localhost:3000 (once we build it)
```

### Project Structure

```
lego-builder/
├── docker-compose.yml          # Docker configuration
├── .dockerignore
├── .gitignore
├── README.md
├── data/
│   └── .gitkeep               # MongoDB data persists here
├── backend/                    # Node.js + Express
│   ├── Dockerfile
│   ├── src/
│   │   ├── index.js           # Entry point
│   │   ├── routes/
│   │   │   ├── sets.js        # Set endpoints
│   │   │   └── builder.js     # Main algorithm
│   │   └── models/
│   │       └── Set.js         # MongoDB schema
│   ├── package.json
│   └── .env.example
├── frontend/                   # React
│   ├── Dockerfile
│   ├── src/
│   │   ├── index.js
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── SetSelector.jsx
│   │       └── Results.jsx
│   └── package.json
├── python-data/                # Python data pipeline
│   ├── Dockerfile
│   ├── scripts/
│   │   └── fetch_lego_data.py # Fetch from Rebrickable
│   ├── requirements.txt
│   └── config.py
└── docs/
    ├── ARCHITECTURE.md
    └── DATA_MODEL.md
```

---

## Environment Variables

See `.env.example` files in each service directory.

---

## Development Workflow

```bash
# Terminal 1: Watch logs
docker-compose logs -f

# Terminal 2: Make code changes (hot-reload enabled)
# Edit files in ./backend, ./frontend, ./python-data
# Changes auto-reload in containers

# Stop everything
docker-compose down

# Reset everything (careful!)
docker-compose down -v  # Removes volumes too
```

---

## Next Steps

1. ✅ Set up Docker & repo structure
2. ⬜ Fetch LEGO data from Rebrickable
3. ⬜ Build backend API
4. ⬜ Build React frontend
5. ⬜ Implement matching algorithm
6. ⬜ Deploy

---

## Learning Goals

- [x] Docker & containerization
- [ ] Node.js + Express API design
- [ ] Python data pipelines
- [ ] MongoDB + Mongoose ODM
- [ ] React state management
- [ ] Algorithm optimization (set matching)
- [ ] Frontend component design
- [ ] API testing & debugging

