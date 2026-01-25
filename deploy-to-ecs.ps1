# WAN App ECS 部署脚本 (PowerShell)
# 使用方法: .\deploy-to-ecs.ps1

$ECS_HOST = "47.239.138.12"
$ECS_USER = "root"
$CONTAINER_NAME = "wan-app"
$PORT = "8080"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "开始部署 WAN App 到 ECS" -ForegroundColor Cyan
Write-Host "ECS: $ECS_HOST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 上传项目文件
Write-Host "📦 [1/5] 上传项目文件到ECS..." -ForegroundColor Yellow
ssh ${ECS_USER}@${ECS_HOST} "mkdir -p /opt/wan-app"
scp -r * ${ECS_USER}@${ECS_HOST}:/opt/wan-app/

# 2. 构建镜像
Write-Host "🔨 [2/5] 在ECS上构建Docker镜像..." -ForegroundColor Yellow
ssh ${ECS_USER}@${ECS_HOST} "cd /opt/wan-app && docker build -t wan-app:latest ."

# 3. 停止旧容器
Write-Host "🛑 [3/5] 停止旧容器..." -ForegroundColor Yellow
ssh ${ECS_USER}@${ECS_HOST} "docker stop $CONTAINER_NAME 2>/dev/null || true; docker rm $CONTAINER_NAME 2>/dev/null || true"

# 4. 启动新容器
Write-Host "🚀 [4/5] 启动新容器..." -ForegroundColor Yellow
ssh ${ECS_USER}@${ECS_HOST} "docker run -d --name $CONTAINER_NAME -p 127.0.0.1:${PORT}:80 --restart unless-stopped wan-app:latest"

# 5. 检查状态
Write-Host "✅ [5/5] 检查容器状态..." -ForegroundColor Yellow
ssh ${ECS_USER}@${ECS_HOST} "docker ps --filter name=$CONTAINER_NAME"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ 部署完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 后续配置 Nginx:" -ForegroundColor Cyan
Write-Host @"
在ECS上执行以下命令配置Nginx:

# 创建Nginx配置
cat > /etc/nginx/conf.d/wan-app.conf << 'EOF'
server {
    listen 80;
    server_name 47.239.138.12;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
    }
}
EOF

# 测试并重载Nginx
nginx -t && nginx -s reload
"@

Write-Host ""
Write-Host "💡 访问地址: http://$ECS_HOST" -ForegroundColor Cyan
