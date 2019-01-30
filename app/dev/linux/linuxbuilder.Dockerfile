FROM node:11.7

RUN apt-get update -q
RUN apt-get install -y apt-transport-https icnsutils graphicsmagick xz-utils rpm bsdtar libsecret-1-dev rsync
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update -q 
RUN apt-get install -y yarn

# install Nim
RUN git clone https://github.com/nim-lang/Nim.git /nim
WORKDIR /nim
RUN git checkout v0.19.2
# 7920dc2898b9518a89c4a588dac2bcdea5658a92
RUN sh build_all.sh
ENV PATH="${PATH}:/nim/bin"


ENV PATH="${PATH}:node_modules/.bin"

# configure npm and yarn
RUN npm i -g npm@^4
RUN npm i -g node-gyp
RUN yarn config set yarn-offline-mirror /proj/cache/yarnmirror
RUN yarn cache clean

COPY ./cache/yarnmirror /proj/cache/yarnmirror

COPY ccore /build/ccore

COPY nodebuckets /build/nodebuckets
WORKDIR /build/nodebuckets
RUN npm i --ignore-scripts
RUN ls node_modules
RUN make clean && make && make test

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
