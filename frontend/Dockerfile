FROM dhi.io/node:26-dev AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci 
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
WORKDIR /app
# COPY package.json package-lock.json ./
# COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]