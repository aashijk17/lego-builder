const express = require('express');
const router = express.Router();
const Set = require('../models/Set');

// POST - Find buildable sets
router.post('/findBuildable', async (req, res) => {
  try {
    const { setIds } = req.body;
    
    if (!setIds || !Array.isArray(setIds) || setIds.length === 0) {
      return res.status(400).json({ error: 'setIds array required' });
    }

    // Get owned sets
    const ownedSets = await Set.find({ setId: { $in: setIds } });
    if (ownedSets.length === 0) {
      return res.status(400).json({ error: 'No valid sets found' });
    }

    // Count all available bricks
    const brickInventory = {};
    ownedSets.forEach(set => {
      set.brickList.forEach(brick => {
        const key = `${brick.brickId}-${brick.colorId}`;
        brickInventory[key] = (brickInventory[key] || 0) + brick.quantity;
      });
    });

    // Get all sets in database
    const allSets = await Set.find({});

    // Check which ones we can build
    const buildable = [];
    const almostBuildable = [];

    allSets.forEach(candidateSet => {
      if (setIds.includes(candidateSet.setId)) return; // Skip owned sets
      if (candidateSet.piecesCount === 0) return; // Skip sets with 0 pieces
      if (!candidateSet.brickList || candidateSet.brickList.length === 0) return; // Skip sets with no bricks

      let canBuild = true;
      let missingParts = [];
      let totalNeeded = 0;
      let totalHave = 0;

      candidateSet.brickList.forEach(brick => {
        const key = `${brick.brickId}-${brick.colorId}`;
        const have = brickInventory[key] || 0;
        totalNeeded += brick.quantity;
        totalHave += Math.min(have, brick.quantity);

        if (have < brick.quantity) {
          canBuild = false;
          missingParts.push({
            brickId: brick.brickId,
            brickName: brick.brickName,
            colorName: brick.colorName,
            needed: brick.quantity,
            have: have
          });
        }
      });

      if (canBuild) {
        buildable.push({
          setId: candidateSet.setId,
          name: candidateSet.name,
          year: candidateSet.year,
          piecesCount: candidateSet.piecesCount,
          imageUrl: candidateSet.imageUrl
        });
      } else if (totalNeeded > 0 && totalHave / totalNeeded >= 0.75) {
        // "Almost buildable" - have 75%+ of parts
        almostBuildable.push({
          setId: candidateSet.setId,
          name: candidateSet.name,
          progress: Math.round((totalHave / totalNeeded) * 100),
          missingParts: missingParts.slice(0, 5)
        });
      }
    });

    res.json({
      ownedCount: ownedSets.length,
      buildableCount: buildable.length,
      almostBuildableCount: almostBuildable.length,
      buildable: buildable.sort((a, b) => b.piecesCount - a.piecesCount),
      almostBuildable: almostBuildable.sort((a, b) => b.progress - a.progress)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
