#!/bin/bash
cd `dirname $0`

jekyll build --watch "$(pwd)/../a1q123456.github.io/"
