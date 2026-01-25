#!/bin/bash
# WAN App 远程部署脚本
# 使用方法: ./deploy-to-ecs.sh

set -e

# ECS配置
ECS_HOST="47.239.138.12"
ECS_USER="root"
CONTAINER_NAME="wan-app"
IMAGE_NAME="wan-app:latest"
PORT="8080"  # 内部端口，由nginx proxy代理

echo "========================================"
echo "开始部署 WAN App 到 ECS"
echo "ECS: $ECS_HOST"
echo "========================================"

# 1. 将项目文件传输到ECS
echo "📦 [1/5] 上传项目文件到ECS..."
ssh $ECS_USER@$ECS_HOST "mkdir -p /opt/wan-app"
scp -r ./* $ECS_USER@$ECS_HOST:/opt/wan-app/

# 2. 在ECS上构建镜像
echo "🔨 [2/5] 在ECS上构建Docker镜像..."
ssh $ECS_USER@$ECS_HOST << 'EOF'
cd /opt/wan-app
docker build -t wan-app:latest .
EOF

# 3. 停止旧容器（如果存在）
echo "🛑 [3/5] 停止旧容器..."
ssh $ECS_USER@$ECS_HOST << EOF
if [ \$(docker ps -aq -f name=$CONTAINER_NAME) ]; then
    docker stop $CONTAINER_NAME || true
    docker rm $CONTAINER_NAME || true
    echo "旧容器已停止并删除"
else
    echo "没有找到旧容器"
fi
EOF

# 4. 启动新容器
echo "🚀 [4/5] 启动新容器..."
ssh $ECS_USER@$ECS_HOST << EOF
docker run -d \
  --name $CONTAINER_NAME \
  -p 127.0.0.1:$PORT:80 \
  --restart unless-stopped \
  wan-app:latest

echo "容器启动成功！"
docker ps --filter name=$CONTAINER_NAME
EOF

# 5. 检查容器状态
echo "✅ [5/5] 检查容器状态..."
ssh $ECS_USER@$ECS_HOST << EOF
echo ""
echo "容器状态:"
docker ps --filter name=$CONTAINER_NAME --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "容器日志 (最后10行):"
docker logs --tail 10 $CONTAINER_NAME
EOF

echo ""
echo "========================================"
echo "✅ 部署完成！"
echo "========================================"
echo ""
echo "📝 后续配置:"
echo "1. 配置 Nginx Proxy 转发到 127.0.0.1:$PORT"
echo "2. 访问 http://$ECS_HOST 测试"
echo ""
echo "🔧 Nginx 配置示例:"
echo "---------------------------------------"
cat << 'NGINX_CONFIG'
server {
    listen 80;
    server_name 47.239.138.12;  # 或您的域名

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_CONFIG
echo "---------------------------------------"
echo ""
echo "💡 管理命令:"
echo "  查看日志: ssh $ECS_USER@$ECS_HOST 'docker logs -f $CONTAINER_NAME'"
echo "  重启容器: ssh $ECS_USER@$ECS_HOST 'docker restart $CONTAINER_NAME'"
echo "  停止容器: ssh $ECS_USER@$ECS_HOST 'docker stop $CONTAINER_NAME'"
