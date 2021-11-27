# Build stage
FROM node:16.11.1-alpine3.14 as build

RUN apk add --update --no-cache \
    curl \
    alpine-sdk \
    python3

WORKDIR /var/www

COPY package.json yarn.lock /var/www/

RUN yarn install --pure-lockfile

COPY . /var/www

RUN yarn build

RUN npm prune --production

# Final image
FROM node:16.11.1-alpine3.14

ARG UID=1001
ARG GID=1001

RUN addgroup -S auth -g $GID && adduser -D -S auth -G auth -u $UID

WORKDIR /var/www

RUN chown -R $UID:$GID .

USER auth

COPY --from=build /var/www /var/www

ENTRYPOINT [ "docker/entrypoint.sh" ]

CMD [ "start-web" ]
