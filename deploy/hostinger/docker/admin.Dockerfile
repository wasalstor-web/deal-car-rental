# syntax=docker/dockerfile:1
# Build admin with public API URL for Hostinger / Traefik deploy.
FROM node:lts-alpine AS build
WORKDIR /bookcars/admin

ARG API_PUBLIC_URL

COPY ./admin ./
COPY ./packages /bookcars/packages

RUN set -eux; \
  if [ -z "${API_PUBLIC_URL}" ]; then echo "ERROR: API_PUBLIC_URL build-arg is required" >&2; exit 1; fi; \
  sed -e "s|http://localhost:4002|${API_PUBLIC_URL}|g" .env.docker.example > .env

RUN npm install --force
RUN npm run build

FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf -- *
COPY --from=build /bookcars/admin/build .
COPY ./admin/nginx.conf /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
EXPOSE 3001
