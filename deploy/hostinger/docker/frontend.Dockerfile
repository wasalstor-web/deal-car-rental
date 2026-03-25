# syntax=docker/dockerfile:1
# Build frontend with public API URL (and optional Supabase) for Hostinger / Traefik deploy.
FROM node:lts-alpine AS build
WORKDIR /bookcars/frontend

ARG API_PUBLIC_URL
ARG SUPABASE_URL=
ARG SUPABASE_ANON_KEY=

COPY ./frontend ./
COPY ./packages /bookcars/packages

RUN set -eux; \
  if [ -z "${API_PUBLIC_URL}" ]; then echo "ERROR: API_PUBLIC_URL build-arg is required" >&2; exit 1; fi; \
  sed -e "s|http://localhost:4002|${API_PUBLIC_URL}|g" .env.docker > .env.step1; \
  if [ -n "${SUPABASE_URL}" ]; then \
    sed -e "s|http://localhost:8010|${SUPABASE_URL}|g" .env.step1 > .env.step2; \
  else \
    cp .env.step1 .env.step2; \
  fi; \
  if [ -n "${SUPABASE_ANON_KEY}" ]; then \
    grep -v '^VITE_BC_SUPABASE_ANON_KEY=' .env.step2 > .env && \
    printf '%s\n' "VITE_BC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}" >> .env; \
  else \
    mv .env.step2 .env; \
  fi; \
  rm -f .env.step1 .env.step2

RUN npm install --force
RUN npm run build

FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf -- *
COPY --from=build /bookcars/frontend/build .
COPY ./frontend/nginx.conf /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
EXPOSE 80
