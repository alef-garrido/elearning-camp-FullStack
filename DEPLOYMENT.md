# Deployment Guide

This project is fully containerized using Docker and Docker Compose. You can run the entire application in either development mode (with hot-reloading) or production mode.

## Prerequisites

*   [Docker](https://docs.docker.com/get-docker/) installed and running on your machine.
*   [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop).

## Environment Configuration

Before running the application, you need to set up the backend environment variables.

1.  Navigate to the `backend` directory.
2.  Create a file named `.env` by copying the example file:
    ```bash
    cp .env.example .env
    ```
3.  Open `backend/.env` and fill in the required values (e.g., your MongoDB connection string, JWT secret, etc.).

## Running the Application

You can run the application using one of the following profiles:

### Development Mode

The `dev` profile is configured for local development. It mounts your local source code into the containers and enables hot-reloading.

To start the application in development mode, run the following command from the root of the project:

```bash
docker compose --profile dev up --build
```

*   **Backend**: Available at `http://localhost:5000`
*   **Frontend**: Available at `http://localhost:3000`

### Production Mode

The `prod` profile builds and runs the production-ready containers. This is suitable for deployment or for testing the production build locally.

To start the application in production mode, run the following command:

```bash
docker compose --profile prod up --build
```

*   **Backend**: Available at `http://localhost:5000`
*   **Frontend**: Available at `http://localhost:3000`

## Stopping the Application

To stop the running containers, press `Ctrl + C` in the terminal where `docker compose` is running.

To stop and remove the containers, you can run:
```bash
docker compose down
```
If you specified a profile when starting, you may need to do so when stopping:
```bash
docker compose --profile dev down
```
```bash
docker compose --profile prod down
```
