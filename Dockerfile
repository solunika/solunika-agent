# Usar una imagen base oficial de Node.js
FROM node:18

# Establecer el directorio de trabajo en el contenedor
WORKDIR /app

# Instalar node-pre-gyp globalmente
RUN npm install -g node-pre-gyp

#isntalar ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

#Instalamos nodemon	
RUN npm install -g nodemon


# Copiar el package.json y package-lock.json (o yarn.lock)
COPY package*.json ./

# Instalar dependencias
#RUN npm install
#RUN npm install @roamhq/wrtc

# Copia la carpeta node_modules/sip.js desde tu proyecto al contenedor
#COPY node_modules/sip.js /app/node_modules/sip.js

# Copiar el resto del código fuente del proyecto
COPY . .

# Exponer el puerto que usa tu aplicación
EXPOSE 9230
EXPOSE 3000

# Comando para ejecutar la aplicación, con nodemon
CMD ["sh", "-c", "npm run dev"]