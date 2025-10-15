# 1. Usar una imagen base oficial de Node.js (versión LTS Alpine para un tamaño reducido)
FROM node:18-alpine

# 2. Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiar los archivos de dependencias
COPY package.json package-lock.json ./

# 4. Instalar las dependencias de producción de forma optimizada
RUN npm ci --only=production

# 5. Copiar el resto del código de la aplicación
COPY . .

# 6. Exponer el puerto en el que corre la aplicación
EXPOSE 5000

# 7. Comando para iniciar la aplicación
CMD [ "node", "server.js" ]
