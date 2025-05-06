#!/usr/bin/env bash

ROOT_PATH=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

LIB_PATH="${ROOT_PATH}/ui"

LATEST_VERSION_DATA=$(curl -s -L https://registry.npmjs.org/keycloak-js/latest)
TAG_NAME="$(jq -r -e '.version' <<< "${LATEST_VERSION_DATA}")"

KEYCLOAK_JS_DOWNLOAD_URL="$(jq -r -e '.dist.tarball' <<< "${LATEST_VERSION_DATA}")"

mv ${LIB_PATH}/keycloak-js ${LIB_PATH}/keycloak-js.old
curl -s -L $KEYCLOAK_JS_DOWNLOAD_URL | tar xz - -C ${LIB_PATH}/. 
mv ${LIB_PATH}/package ${LIB_PATH}/keycloak-js
rm -fR  ${LIB_PATH}/keycloak-js.old

echo "Done, keycloak-js was updated to ${TAG_NAME}"