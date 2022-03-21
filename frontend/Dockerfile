
# Stage 1
FROM node:16 as node
WORKDIR /app
COPY . .
RUN npm i -g typescript@next
RUN npm i --save @types/node
RUN npm i
RUN npm run build-prod

# Stage 2
FROM nginx:alpine
COPY --from=node /app/dist/frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
