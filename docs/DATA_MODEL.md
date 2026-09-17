# Data Model Documentation

## Database Schema

### Sets Collection

Stores complete information about each LEGO set, including all parts.

```javascript
db.sets.insertOne({
  // Unique Identifiers
  setId: "10320",                    // Primary key (unique)
  
  // Basic Info
  name: "Back to the Future Time Machine",
  year: 2023,
  theme: "Ideas",
  piecesCount: 1658,
  
  // Media
  imageUrl: "https://cdn.rebrickable.com/media/sets/10320-1/...",
  rebrickableUrl: "https://rebrickable.com/sets/10320-1/",
  
  // Parts (The crucial part!)
  brickList: [
    {
      brickId: "3001",              // Part number (e.g., "Brick 2x4")
      brickName: "Brick 2x4",       // Human-readable name
      colorId: 1,                   // Color ID (standardized by LEGO)
      colorName: "Red",             // Human-readable color
      quantity: 15                  // How many of this brick/color combo
    },
    {
      brickId: "3002",
      brickName: "Brick 2x2",
      colorId: 5,
      colorName: "White",
      quantity: 8
    },
    {
      brickId: "3001",
      brickName: "Brick 2x4",
      colorId: 5,                   // Same brick, different color = separate entry
      colorName: "White",
      quantity: 12
    },
    // ... 100+ more bricks
  ],
  
  // Metadata
  fetchedAt: ISODate("2024-01-15T10:30:00Z")
})
```

### Important Notes About brickList

**Brick Identity** = `brickId` + `colorId` combination
- Brick 2x4 in Red = different from Brick 2x4 in White
- Each color of the same brick = separate array entry

**Sample Real Data**:
```javascript
"10320": {
  brickList: [
    { brickId: "3001", colorId: 1, quantity: 45 },  // 45 red 2x4
    { brickId: "3001", colorId: 5, quantity: 22 },  // 22 white 2x4
    { brickId: "3001", colorId: 14, quantity: 8 },  // 8 yellow 2x4
    { brickId: "3002", colorId: 1, quantity: 30 },  // 30 red 2x2
    // etc...
  ]
}
```

---

## Colors Reference (Future)

Future optional collection for UI enhancement (showing actual brick colors):

```javascript
db.colors.insertOne({
  colorId: 1,
  name: "Red",
  hexCode: "#C4281C",
  rgb: { r: 196, g: 40, b: 28 }
})
```

---

## Brick Identification System

LEGO has a standardized system for identifying bricks:

### Common Brick IDs

| Brick ID | Name | Example |
|----------|------|---------|
| `3001` | Brick 2x4 | Basic building block |
| `3002` | Brick 2x2 | Smaller variant |
| `3003` | Brick 1x2 | Long thin brick |
| `3004` | Brick 1x4 | Longer thin brick |
| `3021` | Plate 2x3 | Flat piece |
| `3023` | Plate 1x2 | Small flat piece |

These are part of the [LEGO Part Catalog](https://rebrickable.com/parts/).

### Common Color IDs

| Color ID | Name | Hex |
|----------|------|-----|
| 0 | Black | #1B2A34 |
| 1 | Red | #C4281C |
| 5 | White | #FFFFFF |
| 14 | Yellow | #F5CD2F |
| 16 | Green | #2E8B57 |
| 272 | Dark Blue | #0055B5 |

[Full Rebrickable Color Catalog](https://rebrickable.com/colors/)

---

## Indexing Strategy

### Current Indexes

```javascript
db.sets.createIndex({ setId: 1 }, { unique: true })
```

**Why**: 
- Fast lookups by set ID
- Prevents duplicate sets
- Used in query: `db.sets.findOne({ setId: "10320" })`

### Future Indexes

```javascript
// Search by name
db.sets.createIndex({ name: "text" })

// Filter by year
db.sets.createIndex({ year: 1 })

// Filter by piece count
db.sets.createIndex({ piecesCount: 1 })

// Combined for common queries
db.sets.createIndex({ year: -1, piecesCount: -1 })
```

---

## Query Patterns

### 1. Get Single Set's Parts

```javascript
db.sets.findOne(
  { setId: "10320" },
  { brickList: 1, name: 1 }
)
```

**Returns**: Just the set name and its brickList

### 2. Get All Sets User Owns

```javascript
db.sets.find(
  { setId: { $in: ["10320", "71044", "75936"] } },
  { brickList: 1 }
)
```

**Returns**: All three sets' brick inventories

### 3. Aggregate User's Total Inventory

```javascript
// This would be done in backend code
let userSetIds = ["10320", "71044", "75936"];
let sets = db.sets.find({ setId: { $in: userSetIds } });

let inventory = {};
for (let set of sets) {
  for (let brick of set.brickList) {
    let key = `${brick.brickId}:${brick.colorId}`;
    inventory[key] = (inventory[key] || 0) + brick.quantity;
  }
}
// Now inventory = { "3001:1": 45, "3002:5": 18, ... }
```

### 4. Check If User Can Build Set

```javascript
// Backend pseudocode
let targetSet = db.sets.findOne({ setId: "71044" });
let canBuild = true;

for (let neededBrick of targetSet.brickList) {
  let key = `${neededBrick.brickId}:${neededBrick.colorId}`;
  if ((inventory[key] || 0) < neededBrick.quantity) {
    canBuild = false;
    break;
  }
}
return canBuild; // true or false
```

---

## Data Volume

### Current Dataset (200 Sets)

- **Number of sets**: 200
- **Average bricks per set**: ~600
- **Total bricks stored**: ~120,000
- **Average set size**: 500-2000 pieces
- **Database size**: ~20-30 MB (on disk)

### When Scaled to 1000+ Sets

- **Total bricks**: 600,000+
- **Database size**: 100-200 MB
- **Query time**: Still <2 seconds with indexes
- **Memory usage**: Minimal (MongoDB is lazy)

---

## Example Set Data

Here's a realistic small set to understand the structure:

```javascript
{
  setId: "75332",
  name: "Star Wars AT-ST",
  year: 2023,
  theme: "Star Wars",
  piecesCount: 478,
  imageUrl: "https://cdn.rebrickable.com/media/sets/75332-1/...",
  rebrickableUrl: "https://rebrickable.com/sets/75332-1/",
  
  brickList: [
    // Red/brown pieces
    { brickId: "3001", brickName: "Brick 2x4", colorId: 38, colorName: "Dark Orange", quantity: 12 },
    { brickId: "3002", brickName: "Brick 2x2", colorId: 38, colorName: "Dark Orange", quantity: 8 },
    
    // Black pieces (lots of them)
    { brickId: "3001", brickName: "Brick 2x4", colorId: 0, colorName: "Black", quantity: 24 },
    { brickId: "3021", brickName: "Plate 2x3", colorId: 0, colorName: "Black", quantity: 6 },
    { brickId: "3024", brickName: "Plate 1x1", colorId: 0, colorName: "Black", quantity: 15 },
    
    // Slopes (angled pieces)
    { brickId: "45°-3x1", brickName: "Slope 45° 2x1", colorId: 0, colorName: "Black", quantity: 18 },
    
    // Gray pieces
    { brickId: "3001", brickName: "Brick 2x4", colorId: 71, colorName: "Light Blue Gray", quantity: 6 },
    
    // Transparent pieces
    { brickId: "4297", brickName: "Windscreen 1x4x3", colorId: 41, colorName: "Trans Clear", quantity: 2 },
    
    // Special pieces (minifig, vehicle parts)
    { brickId: "970c00pb46", brickName: "Minifigure Torso Pilot", colorId: 0, colorName: "Black", quantity: 2 },
    { brickId: "3794", brickName: "Wheel 14mm D.", colorId: 0, colorName: "Black", quantity: 4 },
    
    // ... more pieces
  ],
  
  fetchedAt: ISODate("2024-01-15T10:30:00Z")
}
```

---

## Data Normalization Notes

When data is fetched from Rebrickable API, we normalize it to ensure consistency:

### What Gets Normalized:

1. **Duplicate handling**: Same brick/color combo gets summed
2. **Invalid entries**: Skip bricks with missing colorId
3. **Quantity validation**: Ensure quantity is positive integer
4. **String cleanup**: Trim whitespace from names

### Example Normalization:

**Raw from API** (might have duplicates):
```javascript
[
  { part_num: "3001", color_id: 1, quantity: 10 },
  { part_num: "3001", color_id: 1, quantity: 5 },  // Duplicate!
  { part_num: "3001", color_id: 5, quantity: 8 }
]
```

**After Normalization**:
```javascript
[
  { brickId: "3001", colorId: 1, quantity: 15 },  // Summed!
  { brickId: "3001", colorId: 5, quantity: 8 }
]
```

---

## Backup & Recovery

### Export Data

```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --archive=/data/backup.archive

# Restore from backup
docker-compose exec mongodb mongorestore --archive=/data/backup.archive
```

### Export as JSON

```bash
# Via mongoexport
docker-compose exec mongodb mongoexport \
  -u admin -p password \
  -d lego_builder \
  -c sets \
  --out /data/sets-backup.json
```

---

## Future Schema Enhancements

### Add User Collections

```javascript
db.users.insertOne({
  userId: "user123",
  email: "user@example.com",
  ownedSetIds: ["10320", "71044"],
  wishlistSetIds: ["75936"],
  createdAt: ISODate("2024-01-15T...")
})
```

### Add Reviews/Ratings

```javascript
db.reviews.insertOne({
  setId: "10320",
  userId: "user123",
  rating: 5,
  comment: "Amazing set!",
  createdAt: ISODate("2024-01-15T...")
})
```

### Track Missing Parts

```javascript
db.builds.insertOne({
  userId: "user123",
  targetSetId: "71044",           // Wants to build this
  ownedSetIds: ["10320"],         // Has these pieces
  missingParts: [                 // Needs to buy these
    { brickId: "3001", colorId: 1, quantity: 5 },
    { brickId: "3002", colorId: 5, quantity: 3 }
  ],
  missingPieceCost: 12.50,        // Estimated cost
  createdAt: ISODate("2024-01-15T...")
})
```

---

## Performance Tips

1. **Query only needed fields**
   ```javascript
   db.sets.find({}, { name: 1, brickList: 1 })  // Don't fetch imageUrl if not needed
   ```

2. **Use projections**
   ```javascript
   db.sets.find({ setId: "10320" }, { brickList: 1 })  // Only get brick data
   ```

3. **Paginate large results**
   ```javascript
   db.sets.find({}).skip(0).limit(20)  // Get 20 sets at a time
   ```

4. **Cache computations**
   - User's inventory (aggregate once per session)
   - Buildable sets (cache for 1 hour)

---

## Validation Rules

When inserting/updating sets:

```javascript
// Mongoose schema validation (backend)
{
  setId: { type: String, required: true, unique: true },
  name: { type: String, required: true, minlength: 1 },
  year: { type: Number, min: 1950, max: 2030 },
  piecesCount: { type: Number, min: 1, max: 100000 },
  brickList: [{
    brickId: { type: String, required: true },
    colorId: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 }
  }],
  fetchedAt: { type: Date, default: Date.now }
}
```

---

## Questions?

Need clarification on any schema aspect? This is a living document - feel free to update as your understanding grows!
