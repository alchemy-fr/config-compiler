#!/bin/sh

set -ex

IMAGE_TAG="config-compiler-builder-alpine:latest"
CONTAINER_NAME="config-compiler-build-alpine"

docker build -t "${IMAGE_TAG}" .

docker rm -f "${CONTAINER_NAME}"
docker run --name "${CONTAINER_NAME}" "${IMAGE_TAG}"

pwd

docker cp "${CONTAINER_NAME}:/home/node/build/generate-env-alpine" ./build/generate-env-alpine

docker rm "${CONTAINER_NAME}"
