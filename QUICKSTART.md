# 🟧 Quick Start (TL;DR)

## 1️⃣ Prerequisites (30 sec)

- Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Install [Git](https://git-scm.com/)

## 2️⃣ Create Project (2 min)

```bash
mkdir lego-builder
cd lego-builder
git init
```

## 3️⃣ Add All These Files

From the setup package, copy to your `lego-builder/` directory:

**Root:**
- `docker-compose.yml`
- `README.md`
- `SETUP_GUIDE.md`
- `.gitignore`

**Backend/** (create folder):
- `Dockerfile`
- `package.json`
- `.env.example`
- **src/**: `index.js`

**Frontend/** (create folder):
- `Dockerfile`
- `package.json`
- `index.html`
- **src/**: `main.jsx`, `App.jsx`, `App.css`, `index.css`

**Python-data/** (create folder):
- `Dockerfile`
- `requirements.txt`
- `.env.example`
- **scripts/**: `fetch_lego_data.py`

**Docs/** (create folder):
- `ARCHITECTURE.md`
- `DATA_MODEL.md`

**data/**: (empty folder for MongoDB)

## 4️⃣ Start Everything (1 min)

```bash
docker-compose up -d
```

Check status:
```bash
docker-compose ps
```

All 4 services should show "Up"

## 5️⃣ Fetch Data (3 min)

```bash
docker-compose exec python python scripts/fetch_lego_data.py
```

Wait for "✅ Data fetch complete!"

## 6️⃣ Verify (1 min)

**Backend ready?**
```bash
curl http://localhost:5000/api/health
```
Should return JSON with `"status": "ok"`

**Frontend ready?**
Open `http://localhost:3000` in browser

**Database ready?**
```bash
docker-compose exec mongodb mongosh -u admin -p password
```
Then: `db.sets.count()`

## 7️⃣ Make First Commit (1 min)

```bash
git add .
git commit -m "Initial setup"
```

---

## 📚 Full Docs

- **SETUP_GUIDE.md** - Detailed step-by-step (read if stuck)
- **ARCHITECTURE.md** - How everything fits together
- **DATA_MODEL.md** - Database schema details
- **README.md** - Project overview

---

## 🚀 What's Running

| Service | Port | Status |
|---------|------|--------|
| React Frontend | :3000 | http://localhost:3000 |
| Node.js Backend | :5000 | http://localhost:5000/api/health |
| MongoDB | :27017 | mongodb://localhost:27017 |
| Python (on demand) | - | `docker-compose exec python python ...` |

---

## 🛑 Troubleshooting

**Services won't start?**
```bash
docker-compose logs
```

**Port already in use?**
Edit `docker-compose.yml` and change ports

**MongoDB connection fails?**
```bash
docker-compose restart mongodb
```

**Can't run data fetch?**
```bash
docker-compose logs python
```

---

## ⏭️ Next Steps

1. ✅ You now have 200 LEGO sets in MongoDB
2. ⬜ Build the Set Selector component
3. ⬜ Implement matching algorithm
4. ⬜ Build results display
5. ⬜ Deploy!

See **ARCHITECTURE.md** for how these fit together.

---

## 💡 Command Cheat Sheet

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# Run command in container
docker-compose exec python python scripts/fetch_lego_data.py

# Fresh start
docker-compose down -v && docker-compose up -d
```

---

**Any issues?** Check SETUP_GUIDE.md for detailed instructions!
