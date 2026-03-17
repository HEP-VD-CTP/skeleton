FROM nginx:1.29.4-alpine

RUN mkdir -p /etc/nginx/ssl

ARG NGINX_CERTIFICATE_LOCATION
ARG NGINX_CERTIFICATE_KEY_LOCATION

# copy the nginx.conf file
COPY ./packages/nginx/nginx.conf /etc/nginx/nginx.conf

# copy the certificate and key
COPY ${NGINX_CERTIFICATE_LOCATION} /etc/nginx/ssl/nginx.crt
COPY ${NGINX_CERTIFICATE_KEY_LOCATION} /etc/nginx/ssl/nginx.key