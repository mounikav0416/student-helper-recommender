Prerequisites
Node.js (v14 or higher)
Neo4j Database (running with your student data)
npm or yarn
Installation
1. Backend Setup
cd backend
npm install
copy .env.example .env   # On Windows (or: cp .env.example .env on macOS/Linux)
Edit .env with your Neo4j credentials:

NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
PORT=3001
Start the backend:

npm start
2. Frontend Setup
Open a new terminal:

cd frontend
npm install
npm start
The application will open at http://localhost:3000

Usage
Enter your register number (e.g., 22MIA1028)
Enter target drop location (e.g., CAMPUS)
Click "Find Helpers"
View recommended students ranked by social proximity
API Endpoints
POST /api/find-helpers - Get helper recommendations
GET /api/locations - Get all drop locations
GET /api/verify-student/:registerNumber - Verify student exists
GET /api/health - Check database connectivity
Social Proximity Scoring
Score 4: Same batch AND department (highest)
Score 3: Same department, different batch
Score 2: Same batch, different department
Score 1: Different batch AND department (lowest)
Notes
Tailwind is included via CDN in frontend/public/index.html so tailwind.config.js is a stub.
If you run into CORS issues, ensure backend is on http://localhost:3001 and frontend uses that base URL in App.jsx.
