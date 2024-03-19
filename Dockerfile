FROM node:20-alpine as base

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

FROM base as test
CMD ["npm", "run", "test"]

FROM base as prod
EXPOSE 28468
CMD ["npm", "run", "dev"]

