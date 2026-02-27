FROM ghcr.io/puppeteer/puppeteer:latest

USER root

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY index.js ./

# Switch back to the non-root user provided by the puppeteer image
USER pptruser

EXPOSE 3002

CMD ["npm", "start"]
