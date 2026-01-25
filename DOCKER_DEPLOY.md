# Docker 部署指南

本文档说明如何将通义万相前端项目打包为 Docker 镜像并部署。

## 📋 前置要求

- Docker 20.10+ 
- Docker Compose 2.0+ (可选)
- 至少 2GB 可用磁盘空间

## 🏗️ 项目结构

```
wan/
├── Dockerfile              # Docker 镜像构建文件
├── .dockerignore          # Docker 构建忽略文件
├── nginx.conf             # Nginx 配置文件
├── docker-compose.yml     # Docker Compose 配置
└── src/                   # 源代码
```

## 🚀 快速开始

### 方法 1: 使用 Docker Compose (推荐)

```bash
# 1. 构建并启动容器
docker-compose up -d

# 2. 查看日志
docker-compose logs -f

# 3. 停止容器
docker-compose down
```

### 方法 2: 使用 Docker 命令

```bash
# 1. 构建镜像
docker build -t wan-app:latest .

# 2. 运行容器
docker run -d \
  --name wan-app \
  -p 80:80 \
  --restart unless-stopped \
  wan-app:latest

# 3. 查看日志
docker logs -f wan-app

# 4. 停止容器
docker stop wan-app

# 5. 删除容器
docker rm wan-app
```

## 🔧 高级配置

### 修改端口映射

如果 80 端口已被占用，可以修改为其他端口：

**docker-compose.yml:**
```yaml
ports:
  - "8080:80"  # 主机端口:容器端口
```

**或者使用 Docker 命令:**
```bash
docker run -d -p 8080:80 --name wan-app wan-app:latest
```

### 自定义 Nginx 配置

如需修改 Nginx 配置，编辑 `nginx.conf` 文件后重新构建镜像。

### 环境变量

在 `docker-compose.yml` 中添加环境变量：

```yaml
environment:
  - NODE_ENV=production
  - API_BASE_URL=https://your-api.com
```

## 📊 镜像信息

- **基础镜像**: node:20-alpine (构建阶段), nginx:alpine (运行阶段)
- **镜像大小**: 约 50-80 MB (多阶段构建优化)
- **暴露端口**: 80

## 🔍 常用命令

```bash
# 查看运行中的容器
docker ps

# 查看所有容器（包括停止的）
docker ps -a

# 进入容器内部
docker exec -it wan-app sh

# 查看容器资源占用
docker stats wan-app

# 查看镜像列表
docker images

# 删除镜像
docker rmi wan-app:latest

# 清理未使用的镜像和容器
docker system prune -a
```

## 🐛 故障排查

### 1. 构建失败

**问题**: npm install 失败
```bash
# 解决方案：清理缓存后重新构建
docker-compose build --no-cache
```

### 2. 容器启动失败

**问题**: 端口被占用
```bash
# 检查端口占用
netstat -ano | findstr :80  # Windows
lsof -i :80                 # Linux/Mac

# 修改端口映射或关闭占用端口的程序
```

### 3. API 代理不工作

**问题**: 无法访问 /api/aliyun
```bash
# 1. 检查 Nginx 配置
docker exec wan-app cat /etc/nginx/conf.d/default.conf

# 2. 查看 Nginx 错误日志
docker exec wan-app cat /var/log/nginx/error.log

# 3. 测试代理连接
docker exec wan-app wget -O- https://dashscope.aliyuncs.com
```

### 4. 静态资源加载失败

**问题**: 页面白屏或资源404
```bash
# 1. 检查构建产物
docker exec wan-app ls -la /usr/share/nginx/html

# 2. 查看 Nginx 访问日志
docker logs wan-app

# 3. 重新构建确保 dist 目录正确生成
docker-compose build --no-cache
```

## 🔒 生产环境建议

### 1. 使用固定版本标签

```bash
docker build -t wan-app:1.0.0 .
docker tag wan-app:1.0.0 wan-app:latest
```

### 2. 启用 HTTPS

修改 `nginx.conf` 添加 SSL 配置：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # ... 其他配置
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

挂载证书：
```yaml
volumes:
  - ./ssl:/etc/nginx/ssl:ro
```

### 3. 资源限制

在 `docker-compose.yml` 中添加资源限制：

```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
```

### 4. 健康检查

已在 `docker-compose.yml` 中配置健康检查，容器会定期检查服务状态。

### 5. 日志管理

配置日志驱动：

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 📦 镜像推送到仓库

### 推送到 Docker Hub

```bash
# 1. 登录 Docker Hub
docker login

# 2. 标记镜像
docker tag wan-app:latest yourusername/wan-app:latest

# 3. 推送镜像
docker push yourusername/wan-app:latest
```

### 推送到私有仓库

```bash
# 1. 标记镜像
docker tag wan-app:latest registry.your-domain.com/wan-app:latest

# 2. 推送镜像
docker push registry.your-domain.com/wan-app:latest
```

## 🔄 更新部署

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建镜像
docker-compose build

# 3. 重启容器
docker-compose up -d

# 或者一步完成
docker-compose up -d --build
```

## 📝 注意事项

1. **API Key 管理**: API Key 存储在浏览器 localStorage 中，不在镜像内
2. **跨域配置**: Nginx 已配置 CORS 头，支持跨域请求
3. **缓存策略**: 
   - HTML: 不缓存 (no-cache)
   - 静态资源: 1年缓存
4. **SPA 路由**: 配置了 try_files，支持 React Router
5. **API 代理**: `/api/aliyun` 自动转发到阿里云 DashScope

## 🌐 访问应用

容器启动后，访问:
- 本地开发: http://localhost
- 自定义端口: http://localhost:8080 (如果映射到8080)

## 📞 技术支持

如遇到问题，请检查:
1. Docker 日志: `docker logs wan-app`
2. Nginx 日志: `docker exec wan-app cat /var/log/nginx/error.log`
3. 容器状态: `docker ps -a`
4. 容器健康状态: `docker inspect wan-app | grep Health -A 10`
