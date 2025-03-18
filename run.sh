#!/usr/bin/env bash
set -e

ROOT_PATH=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

PRESERVE_KEYCLOAK=false
WITH_UI=true
REBUILD_UI=true

POSITIONAL=()
while [[ $# -gt 0 ]]
do

    key="$1"

    case ${key} in
        --preserve-keycloak)
            PRESERVE_KEYCLOAK=true
            shift
        ;;
        --reuse-keycloak)
            REUSE_KEYCLOAK=true
            shift
        ;;
        --no-ui)
            WITH_UI=false
            shift
        ;;
        --no-rebuild-ui)
            REBUILD_UI=false
            shift
        ;;
        --debug)
            DEBUG=true
            DEBUG_PORT=40000
            shift
        ;;
        --*)
            echo "Unknown flag ${1}"
            exit 1
        ;;
    esac
done
set -- "${POSITIONAL[@]}" 

set -a
. ./.env
set +a

KEYCLOAK_CONTAINER="taskboard-keycloak"
KEYCLOAK_PORT="8086"
KEYCLOAK_VERSION="26.1.4"

function clean() {

    if [[ ${DEBUG} == true ]]; then
       echo "Remove binary"
       rm  ${ROOT_PATH}/taskboard
    fi

    if [[ ${PRESERVE_KEYCLOAK} = false ]]; then
        echo "Remove Keycloak container"
        docker rm --force ${KEYCLOAK_CONTAINER}
    else
        echo "Keeping Keycloak container running"
    fi
}

trap clean EXIT

# Ensure public and tasks folders exists
mkdir ${ROOT_PATH}/public || true
mkdir ${ROOT_PATH}/tasks || true

if [[ ${REUSE_KEYCLOAK} = true ]]; then
    echo "Keycloak is reused."
else
    echo "Create Keycloak container ${KEYCLOAK_CONTAINER} on ${KEYCLOAK_PORT} ..."
    docker run -d --name ${KEYCLOAK_CONTAINER} \
                -e KC_BOOTSTRAP_ADMIN_USERNAME=${KEYCLOAK_ADMIN} \
                -e KC_BOOTSTRAP_ADMIN_PASSWORD=${KEYCLOAK_ADMIN_PASSWORD} \
                -p ${KEYCLOAK_PORT}:${KEYCLOAK_PORT} \
                -v ./keycloak:/opt/keycloak/data/import \
                keycloak/keycloak:${KEYCLOAK_VERSION} \
                start-dev --http-port ${KEYCLOAK_PORT} --import-realm
fi

if [[ ${WITH_UI} = true ]]; then
    if [[ ${REBUILD_UI} = true ]]; then
        echo "Rebuilding UI ..."
        if [ ! -d "${ROOT_PATH}/ui/keycloak-js" ]; then
            echo "${ROOT_PATH}/ui/keycloak-js is missing. Fetching it ..."
            sh update-keycloak-js.sh
        else
            echo "${ROOT_PATH}/ui/keycloak-js is available, using the local copy."
        fi 
        rm -fR ${ROOT_PATH}/public/*
        cd ${ROOT_PATH}/ui
        rm -fR node_modules
        rm -f package-lock.json
        npm install
        npm run build
        mv ${ROOT_PATH}/ui/dist/* ${ROOT_PATH}/public/.
        cp ${ROOT_PATH}/ui/sap-ui-version.json ${ROOT_PATH}/public/resources/.
        mkdir -p ${ROOT_PATH}/public/resources/libs
        cp -r ${ROOT_PATH}/ui/keycloak-js ${ROOT_PATH}/public/resources/libs/.
        cd ${ROOT_PATH}
        echo "UI was rebuilded!"
    else
        echo "UI not rebuilded!"
    fi 
else
    echo "Starting without UI."
fi 

echo "Starting application ..."

if [[ ${DEBUG} == true ]]; then
    echo "Debug enabled on port ${DEBUG_PORT}"
    CGO_ENABLED=0 go build -gcflags="all=-N -l" .
    dlv --listen=:${DEBUG_PORT} --headless=true --api-version=2 exec taskboard
else
    go run main.go
fi
