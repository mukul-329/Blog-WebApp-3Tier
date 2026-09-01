FROM dhi.io/node:26-dev AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dhi.io/node:26 AS runner
COPY . .
COPY --from=build /app/node_modules ./node-modules
EXPOSE 5000
CMD ["node","index.js"]