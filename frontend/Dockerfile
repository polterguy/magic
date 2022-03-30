
# Stage 1
FROM node:16 as node
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build-prod

# Stage 2
FROM nginx:alpine
COPY --from=node /app/dist/Magic /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
