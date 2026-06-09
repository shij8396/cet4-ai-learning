# 贡献指南

感谢你对 CET4 AI Learning 项目的关注！

## 开发流程

### 环境设置

```bash
git clone https://github.com/your-username/cet4-ai-learning.git
cd cet4-ai-learning
npm install
cp .env.example .env.local
```

### 分支命名

- `feat/` — 新功能
- `fix/` — 修复 bug
- `refactor/` — 代码重构
- `docs/` — 文档更新
- `perf/` — 性能优化
- `test/` — 测试

### Commit 规范

本项目使用 conventional commits 规范：

```
feat: 添加单词学习进度可视化
fix: 修复默写评分计算错误
refactor: 重构 AI 请求缓存层
docs: 更新 API 文档
perf: 优化 Prisma 查询性能
test: 添加词汇验证器单元测试
```

### 代码规范

提交前会自动运行 lint-staged 检查：

- ESLint — 代码质量
- Prettier — 代码格式
- TypeScript — 类型检查

可以手动运行：

```bash
npm run check
```

### Pull Request 流程

1. 确保代码通过 `npm run check`
2. 确保测试通过 `npm test`
3. 更新相关文档
4. 创建 PR 并描述变更内容
