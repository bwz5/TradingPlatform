This directory hosts a node.js server that serves the client-side routing AND the API endpoints for the user database 

# Production build:
npm start → serves these static files in client/ and responds at GET /api/users.

# setting up .env 

Please create a /ui_service/.env file with entries to the following: 

API_GATEWAY_URL=
JWT_SECRET=
JWT_TTL=           # access token time‑to‑live
PORT=
DATABASE_URL=