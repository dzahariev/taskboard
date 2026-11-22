#!/usr/bin/env bash
set -euo pipefail

ROOT_PATH=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

LIB_PATH="${ROOT_PATH}/ui"

LATEST_VERSION_DATA=$(curl -s -L https://registry.npmjs.org/keycloak-js/latest)
TAG_NAME="$(jq -r -e '.version' <<< "${LATEST_VERSION_DATA}")"

KEYCLOAK_JS_DOWNLOAD_URL="$(jq -r -e '.dist.tarball' <<< "${LATEST_VERSION_DATA}")"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

curl -fsSL "${KEYCLOAK_JS_DOWNLOAD_URL}" | tar -xzf - -C "${TMP_DIR}"

rm -rf "${LIB_PATH}/keycloak-js"
mv "${TMP_DIR}/package" "${LIB_PATH}/keycloak-js"

echo "Done, keycloak-js was updated to ${TAG_NAME}"