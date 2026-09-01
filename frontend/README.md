# Blogify Frontend

React single-page application for Blogify. Production builds are served by Nginx.

## Requirements

- Node.js and npm

## Local Development

Install dependencies and start the React development server:

```sh
npm install
npm start
```

The application runs at `http://localhost:3000`. Its development proxy forwards same-origin `/api` requests to `http://localhost:5000`, so start the backend locally as well.

Build a production bundle with:

```sh
npm run build
```

## API Access

The frontend never calls a public backend address. All browser API requests use the same-origin `/api` prefix:

```text
/api/posts
/api/posts/search
/api/user/signin
/api/user/signup
```

In the Docker image, [nginx.conf](nginx.conf) proxies `/api/` to the backend container at `http://blog-bck:5000/`. The trailing slash removes the `/api` prefix before forwarding, so `/api/posts` reaches the Express route `/posts`.

React application routes such as `/posts`, `/post/:id`, and `/auth` are served through the Nginx SPA fallback.

## Docker Deployment

From the repository root, create the backend environment file and start the stack:

```sh
cp backend/.env.example backend/.env
docker compose up --build
```

On Windows PowerShell, use:

```powershell
Copy-Item backend/.env.example backend/.env
docker compose up --build
```

The Compose file exposes only `3000:80` for the frontend. The backend on port `5000` and MongoDB are internal to the Docker network. For EC2, allow inbound traffic only to the frontend port you publish (typically `80` or `3000`) and do not open port `5000` in the security group.

## Environment Variables

No frontend runtime environment variables are required for the Dockerized setup. The API base path is fixed to `/api` so requests remain on the frontend origin.
