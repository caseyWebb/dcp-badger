FROM node:10-alpine as builder

LABEL maintainer="notcaseywebb@gmail.com"

WORKDIR /repo

COPY package.json yarn.lock ./
RUN yarn install --pure-lockfile

COPY . ./
RUN yarn build
RUN yarn optimize

FROM node:10-alpine

WORKDIR /app

COPY --from=builder /repo/dist/index.js ./

RUN yarn global add micro

EXPOSE 3000

CMD ["micro", "./index.js"]