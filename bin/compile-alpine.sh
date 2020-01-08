#!/bin/sh

set -e

IMAGE_TAG="config-compiler-builder-alpine:latest"

docker build -t "${IMAGE_TAG}" .

docker run -v $(pwd):/home/node "${IMAGE_TAG}"
