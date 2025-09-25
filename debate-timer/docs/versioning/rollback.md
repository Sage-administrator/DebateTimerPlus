# 快速回滚指南

## 场景
当任一插件出现异常影响稳定性，需快速回退到上一个稳定版本标签。

## 操作步骤（PowerShell 7）
1. 拉取最新标签：
   ```
   git fetch --tags
   ```
2. 查看最近稳定标签：
   ```
   git tag --list "*-stable" --sort=-creatordate | Select-Object -First 5
   ```
3. 回滚（非破坏性，detached HEAD）：
   ```
   pwsh -File ./scripts/git-rollback.ps1
   ```
   或强制回滚（破坏性，谨慎）：
   ```
   pwsh -File ./scripts/git-rollback.ps1 -Hard
   ```

## 验证清单
- 构建与测试通过
- 页面功能与交互无回归
- 如需继续开发，建议：
  ```
  git checkout -b hotfix/{issue}-{tag}
  ```

## 注意
- `-Hard` 会重置工作区到标签版本，未提交更改将丢失，请先备份。