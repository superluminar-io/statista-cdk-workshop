FROM public.ecr.aws/docker/library/node:22-alpine

WORKDIR /app

COPY . .

RUN npm install

CMD ["npm", "start"]
