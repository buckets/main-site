FROM node:8.1

RUN apt-get update -q
RUN apt-get install -y apt-transport-https icnsutils graphicsmagick xz-utils rpm bsdtar
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update -q 
RUN apt-get install -y yarn

RUN mkdir /cache
COPY package.json /cache/
COPY yarn.lock /cache/
WORKDIR /cache
RUN yarn

WORKDIR /code

CMD dev/linux/docker_linux_build.sh
