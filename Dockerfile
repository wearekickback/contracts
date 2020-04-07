FROM node:10.18.0-buster AS build-env
ADD . /kickback/contracts
WORKDIR /kickback/contracts

# Clone and install utils
RUN apt-get update
RUN apt-get install -y libsecret-1-dev
RUN git clone https://github.com/vishnubob/wait-for-it \
    && cp wait-for-it/wait-for-it.sh /usr/local/bin \
    && chmod +x /usr/local/bin/wait-for-it.sh \
    && rm -rf wait-for-it

# Deploy contracts

RUN yarn \ 
    && cp .deployment-sample.js .deployment.js

# Setup Subgraph

RUN cd /kickback \
    && git clone https://github.com/wearekickback/kickback-subgraph.git \
    && cd kickback-subgraph \
    && yarn

