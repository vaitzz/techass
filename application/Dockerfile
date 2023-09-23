FROM node:16

RUN NODE_ENV=development
RUN mkdir -p /app/node_modules && chown -R node:node /app
WORKDIR /app
USER node
COPY --chown=node:node . .
RUN npm install
EXPOSE 3000

CMD [ "npm", "run", "start:dev" ]
