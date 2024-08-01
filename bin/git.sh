#!/bin/bash

TEMPLATE_REPO="https://github.com/Tomizap/express-js-api.git"
TEMPLATE_BRANCH="main"

git remote add template $TEMPLATE_REPO
git fetch template
git merge template/$TEMPLATE_BRANCH --allow-unrelated-histories
git push origin main
