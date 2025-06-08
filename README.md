# Soozoo Kaizoku Hunter

Soozoo Kaizoku Hunter is a content protection platform that combines reverse image search, vector search and blockchain storage. The project is composed of a React frontend, an Express API server and a Python FastAPI service along with auxiliary services (PostgreSQL, IPFS, Milvus, etc.) orchestrated via `docker-compose`.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Python 3.9+

Clone the repository and prepare an `.env` file based on the included sample. The environment file contains credentials for the various services and is required for both Docker and local development.

## Setup with Docker Compose

Build and start all services:

```bash
docker-compose up --build
```

The stack includes PostgreSQL, the Express API server, FastAPI, React frontend, IPFS, Milvus, etc. The frontend will be served by Nginx on port `80` while the API services expose ports `3000` (Express) and `8000` (FastAPI).

## Running the Frontend Locally

To work on the React application without Docker:

```bash
cd frontend
npm install
npm start
```

The development server runs on <http://localhost:3000> by default.

## Running the Backend Locally

### Express API

```bash
cd express
cp ../.env .env   # copy environment variables
npm install
npm start
```

The Express server listens on port `3000`.

### FastAPI Service

```bash
cd fastapi
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The FastAPI service will be available at <http://localhost:8000>.

