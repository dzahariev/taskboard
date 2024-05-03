FROM --platform=$BUILDPLATFORM node:20-alpine as build-ui
WORKDIR /usr/app
RUN npm install --global @ui5/cli
COPY ./ui/webapp ./webapp
COPY ./ui/package.json ./package.json
COPY ./ui/ui5.yaml ./ui5.yaml
RUN npm install
RUN npm run build

FROM --platform=$BUILDPLATFORM golang:1.22 AS build
WORKDIR /go/src/github.com/dzahariev/taskboard
COPY . ./
ARG TARGETOS TARGETARCH
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -a -installsuffix cgo -o /main main.go

FROM --platform=$BUILDPLATFORM alpine:3 AS release
VOLUME ["/tasks"]
WORKDIR /
COPY --from=build-ui /usr/app/dist /public
COPY ./ui/sap-ui-version.json /public/resources/sap-ui-version.json
COPY --from=build /main /
ENTRYPOINT [ "./main" ]
EXPOSE 8800