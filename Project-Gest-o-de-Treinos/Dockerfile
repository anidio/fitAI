FROM node:24-slim

# Instala openssl para o Prisma funcionar corretamente no ambiente Linux Slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia os arquivos de definição de dependências
COPY package*.json ./

# Instala todas as dependências (incluindo as devDependencies para poder compilar o código)
RUN npm install

# Copia o restante dos arquivos do projeto para dentro do container
COPY . .

# Gera o Prisma Client com base no seu schema.prisma antes de compilar o código
RUN npx prisma generate

# Compila o código TypeScript para JavaScript nativo
RUN npm run build

# Expõe a porta usada pela aplicação
EXPOSE 8081

# Executa as migrações pendentes no banco de dados de produção e inicia o servidor nativamente
CMD sh -c "npx prisma migrate deploy && node dist/index.js"