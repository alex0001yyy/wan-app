# Nginx配置

<cite>
**本文档引用的文件**
- [nginx.conf](file://nginx.conf)
- [Dockerfile](file://Dockerfile)
- [docker-compose.yml](file://docker-compose.yml)
- [vite.config.js](file://vite.config.js)
- [apiConfig.js](file://src/config/apiConfig.js)
- [aliyun.js](file://src/services/aliyun.js)
- [index.html](file://index.html)
- [dist/index.html](file://dist/index.html)
</cite>

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构概览](#架构概览)
5. [详细组件分析](#详细组件分析)
6. [依赖关系分析](#依赖关系分析)
7. [性能考虑](#性能考虑)
8. [故障排除指南](#故障排除指南)
9. [结论](#结论)

## 简介

本文档为通义万相前端应用提供全面的Nginx配置指南。该应用是一个基于React和Vite的单页应用程序(SPA)，通过Nginx提供静态文件服务，并配置了反向代理以访问阿里云DashScope API。文档深入解释了Nginx配置文件的各项设置，包括虚拟主机配置、静态文件服务、反向代理设置、SSL证书配置、缓存策略、压缩设置、跨域配置和安全头部设置。

## 项目结构

通义万相前端应用采用现代化的开发和部署架构：

```mermaid
graph TB
subgraph "开发环境"
Vite[Vite 开发服务器<br/>端口 3000]
DevProxy[开发代理配置<br/>/api/aliyun -> DashScope]
end
subgraph "生产环境"
Nginx[Nginx Web服务器<br/>端口 80]
Static[静态文件服务<br/>/usr/share/nginx/html]
Proxy[反向代理<br/>/api/aliyun -> DashScope]
end
subgraph "容器化部署"
Docker[Docker 容器]
MultiStage[多阶段构建]
Builder[构建阶段<br/>Node.js + Vite]
Runner[Nginx 运行阶段]
end
Vite --> DevProxy
DevProxy --> Nginx
Nginx --> Static
Nginx --> Proxy
Docker --> MultiStage
MultiStage --> Builder
MultiStage --> Runner
```

**图表来源**
- [Dockerfile](file://Dockerfile#L1-L36)
- [docker-compose.yml](file://docker-compose.yml#L1-L23)
- [vite.config.js](file://vite.config.js#L1-L23)

**章节来源**
- [Dockerfile](file://Dockerfile#L1-L36)
- [docker-compose.yml](file://docker-compose.yml#L1-L23)
- [vite.config.js](file://vite.config.js#L1-L23)

## 核心组件

### Nginx虚拟主机配置

应用使用标准的Nginx虚拟主机配置，监听80端口并提供静态文件服务：

- **监听端口**: 80
- **服务器名称**: localhost
- **根目录**: /usr/share/nginx/html
- **默认索引文件**: index.html

### 反向代理配置

核心的反向代理配置用于访问阿里云DashScope API：

- **代理路径**: /api/aliyun/
- **目标地址**: https://dashscope.aliyuncs.com/api/v1/
- **HTTP版本**: 1.1
- **SSL验证**: 关闭(开发环境)
- **服务器名称验证**: 启用

### 缓存策略

应用实现了智能的缓存策略，针对不同类型的静态资源采用不同的缓存策略：

- **短期缓存**: JavaScript和CSS文件(7天)
- **长期缓存**: 图片、字体等静态资源(1年)
- **SPA缓存**: HTML文件(禁用缓存)

**章节来源**
- [nginx.conf](file://nginx.conf#L5-L80)

## 架构概览

通义万相应用的完整架构如下：

```mermaid
sequenceDiagram
participant Client as 客户端浏览器
participant Nginx as Nginx服务器
participant Static as 静态文件服务
participant Proxy as 反向代理
participant DashScope as 阿里云DashScope
Client->>Nginx : 请求静态资源
Nginx->>Static : 提供HTML/CSS/JS文件
Static-->>Client : 返回静态资源
Client->>Nginx : 请求API /api/aliyun/
Nginx->>Proxy : 转发到DashScope
Proxy->>DashScope : 访问阿里云API
DashScope-->>Proxy : 返回API响应
Proxy-->>Client : 返回API响应
Note over Client,Nginx : SPA路由处理
Client->>Nginx : 请求应用路由
Nginx->>Static : 返回index.html
Static-->>Client : 加载React应用
```

**图表来源**
- [nginx.conf](file://nginx.conf#L20-L52)
- [apiConfig.js](file://src/config/apiConfig.js#L6)

## 详细组件分析

### Nginx配置文件详解

#### 基础配置部分

```mermaid
flowchart TD
Start([Nginx启动]) --> Resolver[DNS解析器配置<br/>8.8.8.8, 8.8.4.4<br/>有效时间: 300秒]
Resolver --> Server[虚拟主机配置<br/>监听80端口<br/>服务器名称: localhost]
Server --> Root[根目录设置<br/>/usr/share/nginx/html]
Root --> Index[默认索引文件<br/>index.html]
Index --> ClientMaxBody[客户端请求大小限制<br/>20MB]
ClientMaxBody --> Gzip[Gzip压缩配置<br/>启用压缩]
Gzip --> Types[Gzip类型配置<br/>文本/JSON/JavaScript]
```

**图表来源**
- [nginx.conf](file://nginx.conf#L1-L19)

#### 反向代理配置分析

反向代理配置是整个应用的核心组件：

```mermaid
classDiagram
class ProxyConfig {
+proxy_pass : https : //dashscope.aliyuncs.com/api/v1/
+proxy_http_version : 1.1
+proxy_ssl_verify : off
+proxy_ssl_server_name : on
+proxy_set_header : Host=dashscope.aliyuncs.com
+proxy_set_header : X-Real-IP=$remote_addr
+proxy_set_header : X-Forwarded-For=$proxy_add_x_forwarded_for
+proxy_set_header : X-Forwarded-Proto=$scheme
+proxy_connect_timeout : 60s
+proxy_send_timeout : 60s
+proxy_read_timeout : 60s
}
class CORSConfig {
+Access-Control-Allow-Origin : *
+Access-Control-Allow-Methods : GET, POST, OPTIONS
+Access-Control-Allow-Headers : DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-DashScope-Async
+Access-Control-Max-Age : 1728000
}
class PreflightHandler {
+处理OPTIONS预检请求
+返回204状态码
+设置CORS头部
}
ProxyConfig --> CORSConfig : "配置跨域支持"
CORSConfig --> PreflightHandler : "处理预检请求"
```

**图表来源**
- [nginx.conf](file://nginx.conf#L20-L52)

#### 缓存策略配置

应用实现了分层缓存策略：

```mermaid
flowchart TD
Request[静态资源请求] --> Type{文件类型判断}
Type --> |JS/CSS| ShortCache[短期缓存<br/>expires 7d<br/>Cache-Control: public, max-age=604800]
Type --> |图片/字体| LongCache[长期缓存<br/>expires 1y<br/>Cache-Control: public, immutable]
Type --> |其他| NoCache[禁用缓存<br/>Cache-Control: no-cache, no-store, must-revalidate]
ShortCache --> Browser[浏览器缓存]
LongCache --> Browser
NoCache --> Browser
Browser --> CDN[CDN缓存]
CDN --> Edge[边缘节点缓存]
```

**图表来源**
- [nginx.conf](file://nginx.conf#L60-L71)

#### SPA路由处理

单页应用的路由处理机制：

```mermaid
flowchart TD
Route[应用路由请求] --> TryFiles[try_files指令检查]
TryFiles --> FileExists{文件存在?}
FileExists --> |是| ServeFile[直接提供文件]
FileExists --> |否| Fallback[返回index.html]
ServeFile --> Cache[应用缓存策略]
Fallback --> SPA[加载React应用]
Cache --> End([完成])
SPA --> End
```

**图表来源**
- [nginx.conf](file://nginx.conf#L54-L58)

**章节来源**
- [nginx.conf](file://nginx.conf#L1-L80)

### 容器化部署配置

#### 多阶段构建流程

```mermaid
flowchart TD
BuildStart[开始构建] --> Stage1[第一阶段: 构建阶段]
Stage1 --> NodeBase[使用node:20-alpine镜像]
NodeBase --> InstallDeps[安装npm依赖]
InstallDeps --> CopySrc[复制源代码]
CopySrc --> BuildApp[运行npm run build]
BuildApp --> Stage2[第二阶段: 运行阶段]
Stage2 --> NginxBase[使用nginx:alpine镜像]
NginxBase --> InstallCA[安装CA证书]
InstallCA --> CopyDist[复制构建产物到/usr/share/nginx/html]
CopyDist --> CopyConf[复制nginx.conf到/etc/nginx/conf.d/default.conf]
CopyConf --> ExposePort[暴露80端口]
ExposePort --> StartNginx[启动nginx -g "daemon off;"]
StartNginx --> End([构建完成])
```

**图表来源**
- [Dockerfile](file://Dockerfile#L1-L36)

#### Docker Compose配置

Docker Compose提供了简化的部署方式：

```mermaid
graph LR
subgraph "Docker Compose配置"
Service[服务定义: wan-app]
Build[构建配置]
Ports[端口映射: 80:80]
Env[环境变量: NODE_ENV=production]
Health[健康检查]
end
subgraph "容器内部"
Container[容器: wan-app]
NginxProc[Nginx进程]
HealthProc[健康检查进程]
end
Service --> Container
Build --> Container
Ports --> Container
Env --> Container
Health --> HealthProc
Container --> NginxProc
HealthProc --> Container
```

**图表来源**
- [docker-compose.yml](file://docker-compose.yml#L1-L23)

**章节来源**
- [Dockerfile](file://Dockerfile#L1-L36)
- [docker-compose.yml](file://docker-compose.yml#L1-L23)

### 前端集成配置

#### API配置分析

前端应用通过统一的API配置与后端交互：

```mermaid
classDiagram
class APIConfig {
+API_BASE_URL : "/api/aliyun"
+TIMEOUT : {
REQUEST : 120000,
POLLING : 30000
}
+RETRY : {
MAX_ATTEMPTS : 2,
INITIAL_DELAY : 1000,
BACKOFF_FACTOR : 1.5
}
+POLLING : {
INTERVAL : 2000,
INITIAL_INTERVAL : 1000,
MAX_INTERVAL : 5000,
STATUS_DONE : ['SUCCEEDED', 'FAILED', 'CANCELED', 'UNKNOWN']
}
+STORAGE : {
TASKS : 'wan_app_tasks_v2',
API_KEY : 'aliyun_api_key',
LEGACY_TASKS : 'wan_video_history'
}
}
class AliyunService {
+createTask(apiKey, params)
+getTask(apiKey, taskId)
+getBatchTasks(apiKey, taskIds)
-retryRequest(fn, retries, delay)
-getHeaders(apiKey, isAsync)
}
APIConfig --> AliyunService : "提供配置常量"
AliyunService --> APIConfig : "使用配置参数"
```

**图表来源**
- [apiConfig.js](file://src/config/apiConfig.js#L1-L35)
- [aliyun.js](file://src/services/aliyun.js#L1-L215)

#### 开发代理配置

Vite开发服务器的代理配置与生产环境保持一致：

```mermaid
sequenceDiagram
participant DevServer as Vite开发服务器
participant DevProxy as 开发代理
participant LocalAPI as 本地API
participant DashScope as 阿里云DashScope
DevServer->>DevProxy : 请求/api/aliyun/
DevProxy->>LocalAPI : 本地开发时转发到本地API
LocalAPI-->>DevProxy : 返回本地响应
DevProxy->>DashScope : 生产环境转发到DashScope
DashScope-->>DevProxy : 返回DashScope响应
DevProxy-->>DevServer : 返回最终响应
```

**图表来源**
- [vite.config.js](file://vite.config.js#L13-L20)

**章节来源**
- [apiConfig.js](file://src/config/apiConfig.js#L1-L35)
- [aliyun.js](file://src/services/aliyun.js#L1-L215)
- [vite.config.js](file://vite.config.js#L1-L23)

## 依赖关系分析

### 组件依赖图

```mermaid
graph TB
subgraph "前端应用"
React[React应用]
Config[API配置]
Services[服务层]
end
subgraph "Nginx配置"
NginxConf[Nginx配置文件]
StaticFiles[静态文件]
ProxyConfig[代理配置]
CacheConfig[缓存配置]
end
subgraph "容器化"
Dockerfile[Dockerfile]
DockerCompose[docker-compose.yml]
end
subgraph "外部服务"
DashScope[阿里云DashScope]
CDN[CDN服务]
end
React --> Config
React --> Services
Services --> Config
Config --> NginxConf
NginxConf --> StaticFiles
NginxConf --> ProxyConfig
NginxConf --> CacheConfig
Dockerfile --> NginxConf
DockerCompose --> Dockerfile
ProxyConfig --> DashScope
StaticFiles --> CDN
```

**图表来源**
- [nginx.conf](file://nginx.conf#L1-L80)
- [Dockerfile](file://Dockerfile#L1-L36)
- [docker-compose.yml](file://docker-compose.yml#L1-L23)

### 数据流分析

```mermaid
flowchart TD
subgraph "用户请求流程"
User[用户浏览器]
SPA[单页应用]
API[API请求]
end
subgraph "Nginx处理流程"
Static[静态文件处理]
SPAFallback[SPA回退处理]
Proxy[反向代理]
Cache[缓存处理]
end
subgraph "外部服务"
DashScope[阿里云DashScope]
CDN[CDN缓存]
end
User --> Static
Static --> Cache
Cache --> CDN
CDN --> User
User --> SPA
SPA --> API
API --> Proxy
Proxy --> DashScope
DashScope --> Proxy
Proxy --> API
API --> SPA
SPA --> User
User --> SPAFallback
SPAFallback --> Static
Static --> User
```

**图表来源**
- [nginx.conf](file://nginx.conf#L54-L58)
- [nginx.conf](file://nginx.conf#L20-L52)

**章节来源**
- [nginx.conf](file://nginx.conf#L1-L80)

## 性能考虑

### 缓存优化策略

应用采用了多层次的缓存策略来提升性能：

1. **浏览器缓存**: 通过适当的Cache-Control头实现
2. **CDN缓存**: 长期缓存的静态资源可被CDN缓存
3. **边缘缓存**: 通过expires指令实现边缘节点缓存

### 压缩配置

Gzip压缩配置优化了传输性能：

- **启用压缩**: gzip on
- **压缩类型**: 文本/HTML/CSS/JavaScript/JSON
- **最小长度**: 1024字节
- **Vary头**: gzip_vary on

### 连接池和超时配置

```mermaid
flowchart TD
subgraph "连接管理"
ConnectTimeout[连接超时: 60s]
SendTimeout[发送超时: 60s]
ReadTimeout[读取超时: 60s]
end
subgraph "客户端限制"
BodySize[请求体大小: 20MB]
KeepAlive[保持连接: on]
end
subgraph "性能优化"
Buffer[缓冲区优化]
Worker[工作进程优化]
WorkerConnections[连接数优化]
end
ConnectTimeout --> Buffer
SendTimeout --> Buffer
ReadTimeout --> Buffer
BodySize --> Worker
KeepAlive --> Worker
Buffer --> WorkerConnections
```

**图表来源**
- [nginx.conf](file://nginx.conf#L12)
- [nginx.conf](file://nginx.conf#L48-L51)

### 建议的性能优化

1. **SSL证书配置**: 建议添加SSL配置以支持HTTPS
2. **负载均衡**: 在高流量场景下考虑添加负载均衡
3. **监控指标**: 添加访问日志和性能监控
4. **安全增强**: 添加安全头部和访问控制

**章节来源**
- [nginx.conf](file://nginx.conf#L14-L18)
- [nginx.conf](file://nginx.conf#L48-L51)

## 故障排除指南

### 常见问题诊断

#### 代理配置问题

```mermaid
flowchart TD
Problem[代理问题] --> CheckDNS[检查DNS解析]
CheckDNS --> CheckProxy[检查代理配置]
CheckProxy --> CheckSSL[检查SSL配置]
CheckSSL --> CheckHeaders[检查请求头]
CheckDNS --> DNSResolver[DNS解析器: 8.8.8.8, 8.8.4.4]
CheckProxy --> ProxyPass[代理路径: /api/aliyun/]
CheckSSL --> SSLVerify[SSL验证: off]
CheckHeaders --> HeaderList[检查必要头部]
DNSResolver --> Solution[解决方案]
ProxyPass --> Solution
SSLVerify --> Solution
HeaderList --> Solution
```

#### 缓存问题诊断

```mermaid
flowchart TD
CacheIssue[缓存问题] --> CheckExpires[检查expires设置]
CheckExpires --> CheckControl[检查Cache-Control头]
CheckControl --> CheckBrowser[检查浏览器缓存]
CheckExpires --> StaticType{静态资源类型}
StaticType --> |JS/CSS| ShortCache[短期缓存: 7天]
StaticType --> |图片/字体| LongCache[长期缓存: 1年]
StaticType --> |其他| NoCache[禁用缓存]
ShortCache --> ClearCache[清除浏览器缓存]
LongCache --> ClearCache
NoCache --> ClearCache
ClearCache --> Verify[验证修复效果]
```

#### SPA路由问题

```mermaid
flowchart TD
RouteIssue[SPA路由问题] --> CheckTryFiles[检查try_files配置]
CheckTryFiles --> CheckIndex[检查index.html]
CheckIndex --> CheckFallback[检查fallback处理]
CheckTryFiles --> TryFiles[try_files $uri $uri/ /index.html]
CheckIndex --> IndexFile[index.html存在]
CheckFallback --> Fallback[返回index.html]
TryFiles --> Verify[验证路由功能]
IndexFile --> Verify
Fallback --> Verify
```

### 日志配置建议

为了更好地监控和调试，建议添加以下日志配置：

```nginx
# 访问日志配置
access_log /var/log/nginx/access.log combined;

# 错误日志配置
error_log /var/log/nginx/error.log warn;

# 自定义日志格式
log_format app_log '$remote_addr - $remote_user [$time_local] "$request" '
                  '$status $body_bytes_sent "$http_referer" '
                  '"$http_user_agent" "$http_x_forwarded_for"';

# 应用特定日志
access_log /var/log/nginx/app_access.log app_log;
```

### 监控指标

建议监控以下关键指标：

1. **请求量**: 每分钟请求数
2. **响应时间**: 平均响应时间和95百分位
3. **错误率**: 4xx/5xx错误比例
4. **带宽使用**: 出站带宽统计
5. **缓存命中率**: CDN和浏览器缓存效率

**章节来源**
- [nginx.conf](file://nginx.conf#L54-L58)
- [nginx.conf](file://nginx.conf#L60-L71)

## 结论

通义万相前端应用的Nginx配置展现了现代Web应用的最佳实践：

1. **清晰的架构设计**: 通过反向代理实现前后端分离
2. **智能缓存策略**: 针对不同类型资源采用差异化缓存
3. **SPA友好配置**: 支持HTML5历史记录API
4. **容器化部署**: 多阶段构建确保生产环境一致性

### 主要优势

- **开发与生产一致性**: 开发代理配置与生产代理配置保持一致
- **性能优化**: 智能缓存和压缩配置提升用户体验
- **可维护性**: 清晰的配置结构便于维护和扩展
- **安全性**: CORS配置和请求头处理确保API安全

### 改进建议

1. **SSL配置**: 添加HTTPS支持以提升安全性
2. **监控完善**: 添加详细的日志和监控配置
3. **安全增强**: 添加安全头部和访问控制策略
4. **性能调优**: 根据实际流量调整连接池和缓存参数

该配置为通义万相应用提供了稳定、高效的前端服务基础，能够满足生产环境的需求并具备良好的扩展性。