# 🟧 LEGO Builder - Complete Setup Guide

This guide walks you through setting up the LEGO Builder project from scratch with Docker.

---

## Phase 1: Prerequisites (10 minutes)

### 1.1 Install Docker Desktop

**What is Docker?** 
Docker lets you run applications in isolated containers without installing Node, Python, MongoDB locally.

- **Windows/Mac**: [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux**: [Install Docker Engine](https://docs.docker.com/engine/install/)

After installation:
```bash
docker --version
docker-compose --version
```

Both should show version numbers (✅ you're good).

### 1.2 Install Git

- **Windows**: [Git for Windows](https://git-scm.com/)
- **Mac**: `brew install git`
- **Linux**: `sudo apt-get install git`

Verify:
```bash
git --version
```

### 1.3 Code Editor

Recommended: [VS Code](https://code.visualstudio.com/)

Optional useful VS Code extensions:
- ES7+ React/Redux/React-Native snippets
- MongoDB for VS Code
- Python

---

## Phase 2: Create Project Structure (5 minutes)

### 2.1 Create the main directory

```bash
mkdir lego-builder
cd lego-builder
```

### 2.2 Create subdirectories

```bash
# Create folder structure
mkdir -p backend/src/{routes,models}
mkdir -p frontend/src/{components,assets}
mkdir -p python-data/scripts
mkdir -p data
mkdir docs
```

### 2.3 Initialize Git

```bash
git init
git config user.name "Your Name"
git config user.email "you@example.com"
```

---

## Phase 3: Add Files to Project (10 minutes)

You'll now download/copy all the files I created. Here's the mapping:

### 3.1 Root level files

Copy these to your `lego-builder/` directory:

1. **docker-compose.yml** → `./docker-compose.yml`
2. **README.md** → `./README.md`
3. **.gitignore** → `./.gitignore`

### 3.2 Backend files

Create these in `backend/` :

1. **backend-Dockerfile** → `./backend/Dockerfile`
2. **backend-package.json** → `./backend/package.json`
3. **backend-.env.example** → `./backend/.env.example`
4. **backend-src-index.js** → `./backend/src/index.js`

### 3.3 Frontend files

Create these in `frontend/` :

1. **frontend-Dockerfile** → `./frontend/Dockerfile`
2. **frontend-package.json** → `./frontend/package.json`
3. **frontend-src-main.jsx** → `./frontend/src/main.jsx`
4. **frontend-src-App.jsx** → `./frontend/src/App.jsx`

Add this CSS file too:
```bash
touch frontend/src/App.css
touch frontend/src/index.css
touch frontend/index.html
```

For `frontend/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LEGO Set Builder</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### 3.4 Python files

Create these in `python-data/` :

1. **python-Dockerfile** → `./python-data/Dockerfile`
2. **python-requirements.txt** → `./python-data/requirements.txt`
3. **python-.env.example** → `./python-data/.env.example`
4. **python-fetch_lego_data.py** → `./python-data/scripts/fetch_lego_data.py`

Add an empty init file:
```bash
touch python-data/__init__.py
touch python-data/scripts/__init__.py
```

### 3.5 Documentation files

```bash
touch docs/ARCHITECTURE.md
touch docs/DATA_MODEL.md
```

---

## Phase 4: Start Docker (3 minutes)

### 4.1 Start all services

```bash
docker-compose up -d
```

This will:
- ✅ Pull images (first time only, ~2 minutes)
- ✅ Build containers
- ✅ Start MongoDB, Python, Node backend, React frontend

### 4.2 Check if everything started

```bash
docker-compose ps
```

You should see 4 containers, all with status "Up":
```
CONTAINER ID   IMAGE     COMMAND                  STATUS
xxxxx          mongo:7.0 "docker-entrypoint.s…"   Up 2 minutes
xxxxx          lego-python  "tail -f /dev/null"      Up 2 minutes
xxxxx          lego-backend "npm run dev"            Up 2 minutes
xxxxx          lego-frontend "npm run dev"           Up 2 minutes
```

### 4.3 View logs

```bash
# Watch all logs
docker-compose logs -f

# Or specific service
docker-compose logs -f backend
docker-compose logs -f python
```

Look for:
- Backend: `Listening on http://localhost:5000`
- Frontend: `VITE v... ready in ... ms`

---

## Phase 5: Fetch Initial Data (5 minutes)

### 5.1 Run the data fetch script

```bash
docker-compose exec python python scripts/fetch_lego_data.py
```

This will:
- 🟧 Fetch 200 most recent LEGO sets from Rebrickable API
- 📦 Extract all parts for each set
- 💾 Store in MongoDB

**First run takes ~2-5 minutes** (respects API rate limits)

Output should look like:
```
🟧 Starting LEGO data fetch from Rebrickable...
Target: 200 sets

Fetching page 1...
✅ Fetched 200 sets

Processing set 1/200: Harry Potter Hogwarts Castle
Processing set 2/200: Star Wars Millennium Falcon
...
✅ Successfully stored 200 sets (0 errors)

✅ Data fetch complete!

Database Summary:
  Total sets: 200
  Total pieces: 1,234,567
```

**If you get an error**: Make sure MongoDB is ready. Run:
```bash
docker-compose logs mongodb
```

---

## Phase 6: Verify It's Working (2 minutes)

### 6.1 Check the API

```bash
curl http://localhost:5000/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T...",
  "mongodb": "connected"
}
```

### 6.2 Check the Frontend

Open in browser:
```
http://localhost:3000
```

You should see the LEGO Builder interface (will say "Sets endpoint coming soon")

### 6.3 Check MongoDB

```bash
docker-compose exec mongodb mongosh -u admin -p password --authenticationDatabase admin
```

Then inside mongosh:
```
use lego_builder
db.sets.count()  // Should show 200
db.sets.findOne() // Should show a set with brickList
```

Type `exit` to leave.

---

## Phase 7: Create First Git Commit (2 minutes)

```bash
git add .
git status  # Verify what's staged
git commit -m "Initial project setup with Docker and data pipeline"
git log  # Verify commit created
```

---

## Phase 8: Set Up Claude Code (optional but recommended)

Install Claude Code CLI:

```bash
# Install globally
npm install -g @anthropic-ai/claude-code

# Or use npx (no installation)
npx @anthropic-ai/claude-code
```

Start a Claude Code session:
```bash
npx @anthropic-ai/claude-code
```

This opens Claude in your terminal, ready to help you code!

---

## Troubleshooting

### Docker containers won't start

```bash
# Check Docker status
docker ps -a

# View specific container logs
docker-compose logs mongodb

# Restart everything fresh
docker-compose down -v
docker-compose up -d
```

### Port already in use

If ports 3000, 5000, or 27017 are taken:

Edit `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change 3000 to 3001
```

### MongoDB connection fails

```bash
# Ensure MongoDB is healthy
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Data fetch script hangs

```bash
# Check if it's rate-limited (Rebrickable has 100 req/hour free)
docker-compose logs python

# Kill it and retry
docker-compose exec python bash
# Ctrl+C
```

---

## What's Next?

✅ **Setup Complete!** You now have:
- MongoDB with 200 LEGO sets
- Node.js backend API (localhost:5000)
- React frontend (localhost:3000)
- Python data pipeline ready

Next phases:
1. **Build Set Selector Component** - Let users pick which sets they own
2. **Build Matching Algorithm** - Find which sets they can build
3. **Build Results Component** - Display buildable sets
4. **Add Recommendations** - Show sets they're "close" to building

---

## Useful Docker Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Execute command in container
docker-compose exec [service] bash

# Rebuild after changing Dockerfile
docker-compose build

# Fresh start (removes volumes)
docker-compose down -v && docker-compose up -d
```

---

## File Structure (Final)

```
lego-builder/
├── docker-compose.yml
├── README.md
├── SETUP_GUIDE.md
├── .gitignore
├── data/
│   └── [MongoDB persists here]
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js
│       ├── routes/
│       └── models/
├── frontend/
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── components/
├── python-data/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   └── scripts/
│       └── fetch_lego_data.py
└── docs/
    ├── ARCHITECTURE.md
    └── DATA_MODEL.md
```

---

## Questions?

At each step, if something doesn't work:
1. Check the service logs: `docker-compose logs [service]`
2. Verify Docker is running
3. Ensure ports 3000, 5000, 27017 are free

You got this! 🟧
