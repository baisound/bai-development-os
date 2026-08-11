FROM node:22-alpine
WORKDIR /app
COPY deploy/knowledge-hub/runtime/package.json ./deploy/knowledge-hub/runtime/package.json
RUN cd deploy/knowledge-hub/runtime && npm install --omit=dev --ignore-scripts
COPY package.json ./package.json
COPY src ./src
COPY schemas ./schemas
COPY deploy/knowledge-hub ./deploy/knowledge-hub
ENV NODE_ENV=production
USER node
CMD ["node", "deploy/knowledge-hub/runtime/server.mjs"]
