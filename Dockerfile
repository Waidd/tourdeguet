FROM node:9-slim

RUN export DEBIAN_FRONTEND=noninteractive \
    && apt-get update \
    && apt-get install --quiet --assume-yes --no-install-recommends python build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN mkdir /tourdeguet
RUN mkdir /tourdeguet/image

ADD bin /tourdeguet/bin/
ADD src /tourdeguet/src/
ADD configuration.js feeds.json globals.js package.json package-lock.json /tourdeguet/

RUN npm i -g npm@5.7.1
RUN cd /tourdeguet && npm ci

RUN apt-get remove --purge -y build-essential && apt-get autoremove -y

EXPOSE 8081
WORKDIR /tourdeguet

CMD npm run start