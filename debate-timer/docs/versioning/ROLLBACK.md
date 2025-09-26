# 快速回滚指南

当任一插件发布后出现异常，请按以下步骤回退到最近稳定版本：

1. 确认最近稳定标签
   git tag --list "*-stable" | sort

2. Dry Run 预演（强烈推荐）
   pwsh -File scripts/git/rollback-to-stable.ps1 -DryRun

3. 执行回滚
   pwsh -File scripts/git/rollback-to-stable.ps1 -Tag vX.Y.Z-stable

4. 验证
   - 运行本地构建/测试
   - 页面核心功能（数据加载、表单提交、成员管理、统计图表、项目操作）恢复正常

5. 记录变更
   - 在 CHANGELOG.md 标注本次回滚及原因
   - 创建修复分支，修复后再次通过 tag-stable 打标签

注意：
- 回滚使用 reset --hard + push --force，请确保你理解其影响并沟通团队成员。
- 若需要仅回滚单插件，请使用分支级修复而非全仓库回滚。