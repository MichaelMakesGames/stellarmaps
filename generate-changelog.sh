#!/usr/bin/bash
npx commit-and-tag-version --skip.bump --skip.commit --skip.tag -t stellarmaps-v
npx prettier --write ./CHANGELOG.md