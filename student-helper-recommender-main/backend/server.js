require('dotenv').config();
const express = require('express');
const neo4j = require('neo4j-driver');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Neo4j connection configuration
const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  )
);

// Helper recommendation endpoint
app.post('/api/find-helpers', async (req, res) => {
  const { registerNumber, dropLocation } = req.body;
  
  if (!registerNumber || !dropLocation) {
    return res.status(400).json({ 
      error: 'Register number and drop location are required' 
    });
  }

  const session = driver.session();
  
  try {
    const result = await session.run(
      `
      MATCH (requester:Student {register_number: $regNum})
      MATCH (helper:Student)-[:DROPS_AT]->(l:Location {name: $location})
      WHERE helper.register_number <> $regNum
      WITH helper, requester,
        CASE
          WHEN helper.batch = requester.batch AND helper.department = requester.department THEN 4
          WHEN helper.department = requester.department THEN 3
          WHEN helper.batch = requester.batch THEN 2
          ELSE 1
        END AS proximityScore,
        CASE
          WHEN helper.batch = requester.batch AND helper.department = requester.department THEN 'Same Batch & Department'
          WHEN helper.department = requester.department THEN 'Same Department'
          WHEN helper.batch = requester.batch THEN 'Same Batch'
          ELSE 'Different Batch & Department'
        END AS proximityLabel
      RETURN 
        helper.register_number AS registerNumber,
        helper.name AS name,
        helper.batch AS batch,
        helper.department AS department,
        proximityScore,
        proximityLabel
      ORDER BY proximityScore DESC, helper.name ASC
      `,
      { 
        regNum: registerNumber.trim(), 
        location: dropLocation.trim() 
      }
    );

    const helpers = result.records.map(record => ({
      registerNumber: record.get('registerNumber'),
      name: record.get('name'),
      batch: record.get('batch'),
      department: record.get('department'),
      proximityScore: record.get('proximityScore').toNumber ? record.get('proximityScore').toNumber() : record.get('proximityScore'),
      proximityLabel: record.get('proximityLabel')
    }));

    res.json({ 
      success: true, 
      helpers,
      count: helpers.length 
    });

  } catch (error) {
    console.error('Neo4j query error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch helpers from database',
      details: error.message 
    });
  } finally {
    await session.close();
  }
});

// Get all available drop locations
app.get('/api/locations', async (req, res) => {
  const session = driver.session();
  
  try {
    const result = await session.run(
      `MATCH (l:Location)
       RETURN DISTINCT l.name AS name
       ORDER BY l.name ASC`
    );

    const locations = result.records.map(record => record.get('name'));
    res.json({ success: true, locations });

  } catch (error) {
    console.error('Neo4j query error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch locations',
      details: error.message 
    });
  } finally {
    await session.close();
  }
});

// Verify student exists
app.get('/api/verify-student/:registerNumber', async (req, res) => {
  const { registerNumber } = req.params;
  const session = driver.session();
  
  try {
    const result = await session.run(
      `MATCH (s:Student {register_number: $regNum})
       RETURN s.register_number AS registerNumber, 
              s.name AS name,
              s.batch AS batch,
              s.department AS department,
              s.drop_location AS dropLocation`,
      { regNum: registerNumber.trim() }
    );

    if (result.records.length === 0) {
      return res.json({ 
        success: false, 
        exists: false,
        message: 'Student not found' 
      });
    }

    const student = result.records[0];
    res.json({ 
      success: true,
      exists: true,
      student: {
        registerNumber: student.get('registerNumber'),
        name: student.get('name'),
        batch: student.get('batch'),
        department: student.get('department'),
        dropLocation: student.get('dropLocation')
      }
    });

  } catch (error) {
    console.error('Neo4j query error:', error);
    res.status(500).json({ 
      error: 'Failed to verify student',
      details: error.message 
    });
  } finally {
    await session.close();
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await driver.verifyConnectivity();
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await driver.close();
  process.exit(0);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  POST http://localhost:${PORT}/api/find-helpers`);
  console.log(`  GET  http://localhost:${PORT}/api/locations`);
  console.log(`  GET  http://localhost:${PORT}/api/verify-student/:registerNumber`);
  console.log(`  GET  http://localhost:${PORT}/api/health`);
});

module.exports = app;
