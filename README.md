# SyncHub - GitHub to Gitee Repository Mirror Platform

SyncHub 是一款极简、优雅的自动化仓库同步平台。它致力于帮助开发者将 GitHub 的代码库（包括所有分支、标签和历史提交）一键镜像克隆到 Gitee 平台。

## 🌟 主要功能

- **OAuth 2.0 授权**：支持 GitHub 和 Gitee 的标准 OAuth 登录，安全管理 Access Token。
- **一键镜像同步**：采用 `git clone --mirror` 技术，完整克隆所有 Git 引用。
- **自动化开路**：同步时若 Gitee 目标仓库不存在，系统将利用 API 自动为您创建。
- **实时监控面板**：苹果风格的 UI 设计，集成 GitHub 风格的同步活跃度热力图。
- **异步任务队列**：基于 Celery + Redis，处理大规模仓库搬家不停读、不超时。

## 🛠️ 技术栈

- **Frontend**: React (Vite) + Tailwind CSS + Framer Motion
- **Backend**: FastAPI (Python 3.9+)
- **Database**: MySQL (SQLAlchemy ORM)
- **Task Queue**: Celery + Redis

---

## 🚀 快速开始

### 1. 环境准备
确保您的机器上已安装：
- Python 3.9+
- Node.js 18+
- MySQL 8.0+
- Redis Server

### 2. 配置环境变量
在 `backend/` 目录下创建 `.env` 文件：
```dotenv
MYSQL_USER=your_user
MYSQL_PASSWORD=your_password
MYSQL_SERVER=localhost
MYSQL_PORT=3306
MYSQL_DB=github_sync

CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# OAuth Credentials
GITHUB_CLIENT_ID=your_id
GITHUB_CLIENT_SECRET=your_secret
GITEE_CLIENT_ID=your_id
GITEE_CLIENT_SECRET=your_secret
```

### 3. 启动项目

**后端启动：**
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

**启动异步工人 (Worker)：**
```bash
cd backend
python -m celery -A app.worker.celery_app worker --loglevel=info --pool=solo
```

**前端启动：**
```bash
cd frontend
npm install
npm run dev
```

---

## ⚠️ 避坑指南 (Windows 专属 & 生产建议)

在开发本项目的过程中，我们总结了以下核心踩坑经验，请务必关注：

### 1. Celery 在 Windows 上的消息解包崩溃
**现象**：任务一直卡在 `PENDING`，后台报错 `ValueError: not enough values to unpack`。
**原因**：Windows 不支持 Celery 默认的 `prefork` 并发模式。
**解决**：启动 Worker 时必须显式指定 `--pool=solo`。

### 2. CORS 跨域与 Vite 自动换号
**现象**：前端请求报错 `Network Error`，Console 显示 CORS Blocked。
**原因**：Vite 在 5173 端口被占用时会自动切换到 5174。
**解决**：确保后端 `BACKEND_CORS_ORIGINS` 包含 `localhost:5174` 等备用端口。

### 3. Git 镜像深度克隆
**原理**：请务必使用 `git clone --mirror` 而非普通的 `git clone`。
**避坑**：普通的克隆只拉取当前分支，而镜像克隆会把所有分支和 Tags 全部搬走。

### 4. Gitee API 权限
**注意**：在创建 Gitee OAuth App 时，除了 `user_info`，必须勾选 **`projects`** 权限，否则自动创建仓库功能会报 403 错误。

---

## 📜 开源协议
MIT License
