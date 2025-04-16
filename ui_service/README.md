This directory hosts a node.js server that serves the client-side routing AND the API endpoints for the user database 

Local dev:
cd ui_service && npm run dev starts Express on port 3000 or 3001 (you can change it)—you’d proxy /api requests to Express.

Production build:
cd ui_service && npm start → serves those static files and responds at GET /api/users.