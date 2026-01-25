#!/bin/bash
# ECS服务器端自动更新部署脚本
# 使用方法: 将 wan-app-deploy.tar.gz 上传到 /usr/wan/ 后执行此脚本

set -e

DEPLOY_DIR="/usr/wan"
TAR_FILE="wan-app-deploy.tar.gz"

echo "========================================"
echo "🚀 WAN App 自动更新部署"
echo "========================================"
echo ""

# 检查压缩包是否存在
if [ ! -f "$DEPLOY_DIR/$TAR_FILE" ]; then
    echo "❌ 错误: 找不到 $DEPLOY_DIR/$TAR_FILE"
    echo "请先上传压缩包到 $DEPLOY_DIR/"
    exit 1
fi

# 1. 解压项目文件
echo "📦 [1/4] 解压项目文件..."
cd $DEPLOY_DIR
tar -xzf $TAR_FILE
echo "✅ 解压完成"

# 2. 构建Docker镜像
echo "🔨 [2/4] 构建Docker镜像..."
docker build -t wan-app:latest .
echo "✅ 镜像构建完成"

# 3. 停止并删除旧容器
echo "🛑 [3/4] 停止旧容器..."
if docker ps -a | grep -q wan-app; then
    docker stop wan-app 2>/dev/null || true
    docker rm wan-app 2>/dev/null || true
    echo "✅ 旧容器已删除"
else
    echo "ℹ️  未发现旧容器"
fi

# 4. 启动新容器
echo "🚀 [4/4] 启动新容器..."
docker run -d \
  --name wan-app \
  -p 8080:80 \
  --restart unless-stopped \
  wan-app:latest

echo "✅ 容器启动完成"

# 清理旧镜像
echo "🧹 清理旧镜像..."
docker image prune -f

echo ""
echo "========================================"
echo "✅ 部署完成！"
echo "========================================"
echo ""
echo "📊 容器状态:"
docker ps --filter name=wan-app --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "📝 最新日志:"
docker logs --tail 15 wan-app

echo ""
echo "========================================"
echo "🌐 访问地址: http://47.239.138.12"
echo "💡 提示: 使用Nginx Proxy Manager管理反向代理"
echo "🔧 NPM管理界面: http://47.239.138.12:81"
echo "========================================"
