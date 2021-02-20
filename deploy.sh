#!/usr/bin/env bash

# clean

hexo clean

hexo generate

hexo deploy

# generate

scp -r  public/* admin@txyun2:/home/admin/data/nl101531.github.io/
