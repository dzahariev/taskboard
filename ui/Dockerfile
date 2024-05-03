FROM node:20.11-alpine as build
WORKDIR /usr/app
RUN npm install --global @ui5/cli
COPY ./webapp ./webapp
COPY ./release ./release
COPY ./package.json ./package.json
COPY ./ui5.yaml ./ui5.yaml
RUN npm install
RUN npm run build

FROM nginx:alpine-slim AS release
COPY --from=build /usr/app/dist /usr/share/nginx/html
COPY --from=build /usr/app/release/sap-ui-version.json /usr/share/nginx/html/resources
COPY --from=build /usr/app/release/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8802
CMD ["nginx", "-g", "daemon off;"]