FROM beevelop/ionic:latest

MAINTAINER intellecteu.com
LABEL com.intellecteu.version="0.1"
LABEL com.intellecteu.description=“Ionic_mobile_app“


# Create app directory
WORKDIR /usr/src/app
COPY . .

EXPOSE 8100