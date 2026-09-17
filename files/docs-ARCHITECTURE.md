# LEGO Builder Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         LEGO Builder Stack                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Browser    │
│  (React)     │ :3000
└────────┬─────┘
         │ HTTP
         ▼
┌──────────────────────────────┐
│   Frontend (React)            │
│  - SetSelector Component      │
│  - Results Component          │
│  - API Integration            │
└────────┬─────────────────────┘
         │ REST API
         ▼
┌──────────────────────────────┐
│   Backend (Node.js/Express)  │ :5000
│  - /api/sets                 │
│  - /api/builder/findBuildable│
│  - Algorithm Logic           │
│  - Data Validation           │
└────────┬─────────────────────┘
         │ Mongoose ODM
         ▼
┌──────────────────────────────┐
│   MongoDB                     │ :27017
│  - sets collection           │
│  - colors collection         │
│  - indexes & queries         │
└──────────────────────────────┘

┌──────────────────────────────┐
│   Python Data Pipeline       │ (runs on demand)
│  - Rebrickable API Client    │
│  - Data Normalization        │
│  - MongoDB Insert/Update     │
└──────────────────────────────┘
```

---

## Component Breakdown

### Frontend (React) - localhost:3000

**Purpose**: User interface for set selection and results

**Key Components** (to be built):
- `App.jsx` - Main container, state management
- `SetSelector.jsx` - Checkbox list of 200 sets
- `Results.jsx` - Display buildable sets with details
- `SetCard.jsx` - Individual set display component

**Data Flow**:
```
User clicks checkboxes
    ↓
SetSelector updates parent state
    ↓
User clicks "Find Buildable"
    ↓
Send POST /api/builder/findBuildable with selected set IDs
    ↓
Display results in Results component
```

---

### Backend (Node.js) - localhost:5000

**Purpose**: API, business logic, database queries

**Key Endpoints** (to be built):
- `GET /api/health` - Server status ✅ (exists)
- `GET /api/sets` - List all sets
- `GET /api/sets/:setId` - Get single set details
- `POST /api/builder/findBuildable` - Main algorithm

**Key Features**:
- Express.js server with CORS enabled
- Mongoose for MongoDB ODM
- Input validation
- Error handling
- Hot reload with nodemon

---

### Database (MongoDB) - localhost:27017

**Purpose**: Persistent storage of LEGO set data

**Collections**:

#### sets collection
```javascript
{
  _id: ObjectId(...),
  setId: "10320",           // Unique set identifier
  name: "Back to the Future Time Machine",
  year: 2023,
  theme: "Ideas",
  piecesCount: 1658,
  imageUrl: "https://...",
  rebrickableUrl: "https://...",
  
  brickList: [
    {
      brickId: "3001",      // Brick part number
      brickName: "Brick 2x4",
      colorId: 1,           // Color ID
      colorName: "Red",
      quantity: 15          // How many of this brick
    },
    {
      brickId: "3002",
      brickName: "Brick 2x2",
      colorId: 5,
      colorName: "White",
      quantity: 8
    },
    // ... 100+ more bricks
  ],
  
  fetchedAt: 2024-01-15T...
}
```

**Indexes**:
- `setId`: unique, for fast lookups

#### colors collection (future)
```javascript
{
  colorId: 1,
  name: "Red",
  hexCode: "#C4281C"
}
```

---

### Data Pipeline (Python)

**Purpose**: Fetch LEGO data from Rebrickable API and populate MongoDB

**Process**:
```
1. Authenticate with Rebrickable API
2. Fetch 200 most recent sets
3. For each set:
   - Fetch its brick inventory
   - Normalize data
   - Insert/update in MongoDB
4. Create indexes
5. Report summary
```

**Rate Limiting**: 
- Rebrickable free tier: 100 requests/hour
- Script adds delays to respect limits
- Respects `next` pagination token

**Run Command**:
```bash
docker-compose exec python python scripts/fetch_lego_data.py
```

---

## The Matching Algorithm (Core Logic)

This runs in the backend when user clicks "Find Buildable".

**Input**: Array of set IDs user owns
```javascript
{
  setIds: ["10320", "71044", "75936"]
}
```

**Process**:
```
1. Fetch all bricks from owned sets
   ↓
   Aggregate into a "parts inventory":
   {
     "3001:1": 45,    // 45 red 2x4 bricks
     "3002:5": 18,    // 18 white 2x2 bricks
     ...
   }

2. Loop through ALL sets in database
   ↓
   For each set:
     ✓ Check every brick in that set
     ✓ See if user has enough quantity
     ✗ If ANY brick is missing → skip this set
   
3. Return sets where user has 100% of bricks
   ↓
   Sort by piece count (most impressive first)
```

**Pseudocode**:
```javascript
function findBuildable(userOwnedSetIds) {
  // Get all bricks from owned sets
  let inventory = getAllBricksFromSets(userOwnedSetIds);
  
  // Find all sets in database
  let allSets = database.sets.find();
  
  let buildable = [];
  
  for (let candidateSet of allSets) {
    // Skip sets user already owns
    if (userOwnedSetIds.includes(candidateSet.setId)) continue;
    
    // Check if user has ALL parts for this set
    let canBuild = candidateSet.brickList.every(brick => {
      let key = `${brick.brickId}:${brick.colorId}`;
      return inventory[key] >= brick.quantity;
    });
    
    if (canBuild) {
      buildable.push(candidateSet);
    }
  }
  
  // Sort by piece count (descending)
  buildable.sort((a, b) => b.piecesCount - a.piecesCount);
  
  return buildable;
}
```

**Output**:
```javascript
{
  buildableCount: 3,
  buildableSets: [
    {
      setId: "71044",
      name: "Harry Potter Hogwarts Clock Tower",
      piecesCount: 922,
      imageUrl: "...",
      // ... other fields
    },
    // ... more sets
  ]
}
```

---

## Data Flow Diagram

### Initial Setup
```
python-data container (one-time)
    ↓
fetch_lego_data.py
    ↓
Rebrickable API
    ↓
Normalize to schema
    ↓
MongoDB (persistent)
```

### Runtime (User Interaction)
```
React Frontend
    ↓ (user selects sets)
User State
    ↓ (clicks "Find Buildable")
HTTP POST /api/builder/findBuildable
    ↓
Express Backend
    ↓
Query MongoDB for selected sets
    ↓
Aggregate bricks inventory
    ↓
Loop through all sets
    ↓
Check each set against inventory
    ↓
Return buildable sets
    ↓
HTTP Response
    ↓
React renders Results component
    ↓ (sorted by pieces)
User sees buildable sets
```

---

## Error Handling

**Frontend**:
- Catch API errors, display user message
- Validate at least 1 set selected
- Show loading state during query

**Backend**:
- Validate set IDs format
- Handle MongoDB connection errors
- Return 400/500 with error messages
- Log all errors

**Database**:
- Connection pooling
- Retry logic with timeouts
- Transaction support (future)

---

## Performance Considerations

**Query Optimization**:
- Index on `setId` for fast lookups
- Future: Cache frequently searched sets
- Aggregate pipeline for batch operations

**Algorithm**:
- O(n) complexity per set (n = number of bricks in set)
- O(m*n) total (m = number of sets in database)
- ~1-2 seconds for 200 sets on modern hardware
- Future: Add Redis caching for popular queries

**Scalability**:
- Current: Handles 200 sets smoothly
- Future: Add pagination for larger datasets
- Consider database sharding if >10k sets

---

## Technology Justification

| Tech | Why |
|------|-----|
| **React** | Fast UI updates, component reusability, large ecosystem |
| **Node.js** | JavaScript across stack, async I/O for API calls |
| **Express** | Lightweight, routing, middleware ecosystem |
| **MongoDB** | Flexible schema, nested arrays (perfect for brickList) |
| **Mongoose** | Schema validation, type safety, query helpers |
| **Python** | Best for data processing, Rebrickable has Python clients |
| **Docker** | Reproducible environments, easy deployment |

---

## Future Improvements

1. **Authentication**: User accounts to save collections
2. **Recommendations**: Show sets you're "close" to building
3. **Wishlist**: Track sets you want, price tracking
4. **Community**: Share collections, tips, modifications
5. **Mobile**: Native app for easier set management
6. **AI**: Suggest creative combinations
7. **Caching**: Redis for fast lookups
8. **Analytics**: Track popular combinations
