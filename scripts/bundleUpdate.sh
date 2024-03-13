#!/bin/bash

rm -rf bundleTempDir
rm -rf bundle.tar.gz

node scripts/bundleUpdate.js

DIST_DIRECTORY="./dist"
IOS_BUNDLE="$DIST_DIRECTORY/_expo/static/js/ios/*.hbc"
ANDROID_BUNDLE="$DIST_DIRECTORY/_expo/static/js/android/*.hbc"
ASSETS="$DIST_DIRECTORY/assets/*"
METADATA="$DIST_DIRECTORY/metadata.json"

cd bundleTempDir

tar czvf bundle.tar.gz *

#curl \
#-H "deploy-secret: SUPER_SECRET_PASSWORD_YOU_WONT_GUESS_IT" \
#-H "runtime-version: 1.71" \
#-F 'data=@./bundle.tar.gz' http://updates-test.haileyok.com:3333/deploy \
#/

cd ..

rm -rf bundleTempDir
rm -rf bundle.tar.gz
