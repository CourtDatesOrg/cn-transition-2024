#!/bin/bash
yum update -y
yum install -y make
sudo yum install -y git
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
