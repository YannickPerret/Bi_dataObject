FROM node:20-alpine

WORKDIR /src

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 28468

CMD ["npm", "run", "dev"]