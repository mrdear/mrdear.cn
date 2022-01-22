#!/usr/bin/env bash

# clean

hexo clean

hexo generate

hexo deploy

# generate

scp -r  public/* root@txyun3:/root/server-conf/nginx/data/nl101531.github.io/
