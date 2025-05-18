#!/bin/bash

# 安装依赖
npm install

# 构建项目（包括构建子项目并复制到dist目录）
npm run build

# 确保dist目录包含子项目
echo "Build complete. Directory structure:"
find dist -type d | sort 