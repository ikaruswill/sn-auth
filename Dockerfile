# Build stage
FROM node:15.11.0-alpine as build

RUN apk add --update --no-cache \
    curl \
    alpine-sdk \
    python

WORKDIR /var/www

COPY package.json yarn.lock /var/www/

RUN yarn install --pure-lockfile

COPY . /var/www

RUN yarn build

RUN npm prune --production

# Final image
FROM node:15.11.0-alpine

ARG UID=1001
ARG GID=1001

RUN addgroup -S auth -g $GID && adduser -D -S auth -G auth -u $UID

WORKDIR /var/www

RUN chown -R $UID:$GID .

USER auth

COPY --from=build /var/www /var/www

ENTRYPOINT [ "docker/entrypoint.sh" ]

CMD [ "start-web" ]
