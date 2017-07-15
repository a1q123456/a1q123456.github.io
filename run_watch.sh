#!/bin/bash
cd `dirname $0`

jekyll build --watch --destination  "$(pwd)/../a1q123456.github.io/"
