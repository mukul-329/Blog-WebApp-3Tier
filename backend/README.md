# Blogify Backend

Express and MongoDB API for Blogify.

## Requirements

- Node.js 14.x for the current backend package configuration
- MongoDB, either locally or through Docker Compose

## Setup

1. Copy `.env.example` to `.env`.
2. Set the required values:

```env
CONNECTION_URL=mongodb://localhost:27017/blogify
JWT_SECRET_KEY=replace-with-a-long-random-secret
CLIENT_ORIGIN=http://localhost:3000
```

`CLIENT_ORIGIN` is optional. Set it only when a browser accesses this API from a separate origin during development. In the Docker deployment, the browser uses the frontend origin and Nginx forwards requests internally, so CORS is not required.

3. Install and start the API:

```sh
npm install
npm start
```

The server listens on port `5000` by default. Set `PORT` to override it.

## API Routes

When running the backend directly, use these routes at `http://localhost:5000`.

| Method | Route | Authentication | Description |
| --- | --- | --- | --- |
| GET | `/posts?limit=6&page=1` | No | List paginated posts |
| GET | `/posts/search?searchQuery=value&tags=value&limit=6&page=1` | No | Search posts |
| GET | `/posts/:id` | No | Read one post |
| POST | `/posts` | Bearer token | Create a post |
| PATCH | `/posts/:id` | Bearer token | Update a post |
| DELETE | `/posts/:id` | Bearer token | Delete a post |
| POST | `/user/signup` | No | Register a user |
| POST | `/user/signin` | No | Sign in and receive a token |

Authenticated routes expect `Authorization: Bearer <token>`.

## Docker Network Design

With the repository-level Docker Compose setup, this service is intentionally not published to the host. It is available only to services on `blog-network` at `http://blog-bck:5000`.

The public request flow is:

```text
Browser -> frontend Nginx (/api/*) -> blog-bck:5000 -> MongoDB
```

For example, a browser request to `/api/posts` is forwarded internally to this API as `/posts`. Do not add a `ports` mapping for the backend when deploying to EC2; publish only the frontend web port and configure the EC2 security group accordingly.
