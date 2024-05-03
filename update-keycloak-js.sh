#!/usr/bin/env bash

ROOT_PATH=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

LIB_PATH="${ROOT_PATH}/ui/webapp/libs"

LAST_TAG_DATA=$(curl -s -L https://api.github.com/repos/keycloak/keycloak/releases/latest)
KEYCLOAK_JS_DATA="$(jq -r -e '.assets[] | select( .browser_download_url | contains("keycloak-js"))' <<< "${LAST_TAG_DATA}")"
KEYCLOAK_JS_DOWNLOAD_URL="$(jq -r -e '.browser_download_url' <<< "${KEYCLOAK_JS_DATA}")"

TAG_NAME="$(jq -r -e '.tag_name' <<< "${LAST_TAG_DATA}")"

mv ${LIB_PATH}/keycloak-js ${LIB_PATH}/keycloak-js.old
curl -s -L $KEYCLOAK_JS_DOWNLOAD_URL | tar xz - -C ${LIB_PATH}/. 
mv ${LIB_PATH}/package ${LIB_PATH}/keycloak-js
rm -fR  ${LIB_PATH}/keycloak-js.old

echo "Done, keycloak-js was updated to ${TAG_NAME}"

