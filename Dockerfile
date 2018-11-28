FROM node:10-alpine

RUN mkdir /repo
WORKDIR /repo

COPY package.json yarn.lock ./
RUN yarn install --pure-lockfile

COPY @types src tsconfig.json ./
RUN yarn build

CMD ["yarn", "start"]