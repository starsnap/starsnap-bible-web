FROM node:22.22.0-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
RUN mkdir -p \
    /tmp/nginx/client_temp \
    /tmp/nginx/proxy_temp \
    /tmp/nginx/fastcgi_temp \
    /tmp/nginx/uwsgi_temp \
    /tmp/nginx/scgi_temp \
    && chown -R nginx:nginx /tmp/nginx \
    && sed -i '/^user  nginx;$/d' /etc/nginx/nginx.conf \
    && sed -i 's#pid        /run/nginx.pid;#pid /tmp/nginx/nginx.pid;#' /etc/nginx/nginx.conf
COPY --chmod=0644 nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html
USER nginx
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=6 \
  CMD wget -qO- http://127.0.0.1:3000/ | grep -q '<title>' || exit 1
CMD ["nginx", "-g", "daemon off;"]
