FROM node:8.1

RUN apt-get update -q
RUN apt-get install -y apt-transport-https icnsutils graphicsmagick xz-utils rpm bsdtar libsecret-1-dev rsync
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update -q 
RUN apt-get install -y yarn
RUN npm i -g npm@^4
RUN yarn config set yarn-offline-mirror /proj/yarnmirror
RUN yarn cache clean

COPY yarnmirror /proj/yarnmirror

RUN mkdir -p /build/core
COPY core/package.json /build/core/
COPY core/yarn.lock /build/core/
WORKDIR /build/core
RUN yarn --offline || yarn

RUN mkdir -p /build/app
COPY app/package.json /build/app/
COPY app/yarn.lock /build/app/
WORKDIR /build/app
RUN yarn --offline || yarn

COPY app/dev/linux /buildscripts
CMD /buildscripts/docker_linux_build.sh
