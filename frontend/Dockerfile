FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci || npm install

COPY . .

EXPOSE 5500

CMD ["npm", "start", "--", "--port=5500", "--host=0.0.0.0", "--no-browser"]