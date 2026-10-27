FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_MODE=live
ARG VITE_KEYCLOAK_URL=http://localhost:8180
ENV VITE_MODE=$VITE_MODE VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
RUN npm run build
FROM nginxinc/nginx-unprivileged:1.28-alpine
USER root
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
USER 101
EXPOSE 8080
