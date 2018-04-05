FROM node:8.1

RUN apt-get update -q
RUN apt-get install -y apt-transport-https icnsutils graphicsmagick xz-utils rpm bsdtar libsecret-1-dev rsync
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update -q 
RUN apt-get install -y yarn
RUN npm i -g npm@^4
RUN yarn config set yarn-offline-mirror /yarnmirror
COPY yarnmirror /yarnmirror
RUN yarn cache clean

RUN mkdir /cache

# install core
COPY core/ /core
WORKDIR /core
RUN du -ch /yarnmirror
RUN yarn config list --verbose
RUN yarn --offline || rm -rif node_modules yarn.lock && yarn
RUN du -ch /yarnmirror
RUN node_modules/.bin/tsc

# install desktop packages
COPY app/package.json /cache/
COPY app/yarn.lock /cache/
WORKDIR /cache
RUN yarn config list --verbose
RUN yarn --offline || rm -rif node_modules yarn.lock && yarn
WORKDIR /app

CMD dev/linux/docker_linux_build.sh
