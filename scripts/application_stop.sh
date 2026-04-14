#!/bin/bash
export PATH=$PATH:/usr/bin:/usr/local/bin

if [ -x "$(command -v pm2)" ]; then
  pm2 stop stellar-backend || true
fi
