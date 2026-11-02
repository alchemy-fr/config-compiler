#!/bin/sh

set -ex

docker build --target export --output type=local,dest=./build .
