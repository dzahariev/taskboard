# UI Build 
FROM --platform=$BUILDPLATFORM node:22-alpine as build-ui

# Install some tools needed for preparation and build
RUN apk update && \
    apk add jq && \
    apk add curl && \
    apk add tar && \
    apk add gzip

# Set work directory used as base for build
WORKDIR /usr/app

# Install OPEN UI 5 CLI tool
RUN npm install --global @ui5/cli

# Copy content
COPY ./ui/webapp ./webapp
COPY ./ui/package.json ./package.json
COPY ./ui/ui5.yaml ./ui5.yaml

# Install keycloak-js
RUN rm -fR ./webapp/libs/keycloak-js
RUN curl -s -L -o keycloak-js.tgz $(curl -s -L https://api.github.com/repos/keycloak/keycloak/releases/175954537 | jq -r -e '.assets[] | select( .browser_download_url | contains("keycloak-js"))' | jq -r -e '.browser_download_url') 
RUN tar xvzf keycloak-js.tgz -C ./webapp/libs/. 
RUN mv ./webapp/libs/package ./webapp/libs/keycloak-js

# Get dependencies and builf
RUN npm install
RUN npm run build

# Backend Build 
FROM --platform=$BUILDPLATFORM golang AS build
WORKDIR /go/src/github.com/dzahariev/taskboard
COPY . ./
ARG TARGETOS TARGETARCH
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -a -installsuffix cgo -o /main main.go

# Release 
FROM alpine:3 AS release
VOLUME ["/tasks"]
WORKDIR /
COPY --from=build-ui /usr/app/dist /public
COPY ./ui/sap-ui-version.json /public/resources/sap-ui-version.json
COPY --from=build /main /
ENTRYPOINT [ "./main" ]
EXPOSE 8800