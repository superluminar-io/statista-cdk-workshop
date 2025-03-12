FROM public.ecr.aws/docker/library/node:23-alpine

WORKDIR /app

COPY . .

RUN npm install

CMD ["npm", "start"]
