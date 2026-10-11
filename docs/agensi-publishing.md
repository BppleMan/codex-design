# Agensi releases / Agensi 版本更新

Publishing a GitHub Release runs `.github/workflows/agensi-release.yml`. The workflow reuses both jobs in `validate.yml`, then submits the release's files to the existing Agensi listing through `update_skill`. The release tag is the version label; its notes are the changelog. Published prereleases also trigger this workflow.

发布 GitHub Release 后，工作流先执行 Skill 校验、Python 测试及原型底座检查，再通过 `update_skill` 更新已有商品。Release 标签作为版本号，Release 说明作为更新日志；已发布的预发行版本也会触发。

## One-time configuration / 一次性配置

In **Settings → Secrets and variables → Actions**, configure:

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `AGENSI_API_KEY` | The creator's Agensi developer API key |
| Variable | `AGENSI_SKILL_SLUG` | The existing listing's URL slug |

在仓库 Actions 设置中保存上述配置。密钥只用于请求认证，不进入发布包或日志。商品标识必须对应该账号拥有的已有商品；工作流不创建商品或修改价格。

If the listing has not been created yet, leave `AGENSI_SKILL_SLUG` unset. Releases still run validation, and the upload step records a clear skipped result. After creating the listing, set its actual slug to enable automatic updates without changing the workflow.

商品尚未创建时，保留 `AGENSI_SKILL_SLUG` 为空。Release 仍执行校验，上传步骤明确标记为跳过；商品创建后填入真实 slug 即可启用更新，无需再次修改工作流。

The endpoint is `https://mcp.agensi.io/mcp`. The publisher uses Streamable HTTP JSON-RPC, accepts JSON and SSE, and sends the full text package rather than a ZIP. Binary repository images keep working through immutable GitHub commit URLs. Listing logos and screenshots can be managed separately using `upload_skill_media`.

发布脚本发送完整文本包。二进制图片保留在 GitHub，包内 Markdown/HTML 图片链接改为对应提交的固定 URL；商品媒体可以单独管理。原型脚本、参考文档、前端资源、依赖锁定文件和许可证随包保留。

Only Git-tracked files are collected. GitHub workflows, repository tests and the publisher are omitted. Unexpected binaries, symlinks and tracked environment files fail the build. The publisher conservatively enforces the documented submit limit of 100 files / 5 MiB for updates as well.

## Verify without updating / 不上传的检查

Run the workflow manually with `dry_run` enabled and a version label. This runs all checks and builds the payload without contacting Agensi; credentials and a listing slug are not required for a dry run. A published GitHub Release performs a real update.

手动运行时默认启用 `dry_run`，填写版本号即可检查完整流程，不发送 Agensi 请求。发布 GitHub Release 会自动执行真实更新。

```sh
AGENSI_SKILL_SLUG=your-listing-slug python scripts/publish_agensi.py --version v1.1.0 --dry-run
```

Optional `--output` saves the exact request arguments for inspection, without the API key. Do not commit generated payloads.

`--output` 可保存实际请求参数供检查，其中不包含 API Key。不要提交生成的请求文件。

## Results and reruns / 结果与重跑

Updates are serialized. The publisher does not automatically retry the non-idempotent `update_skill` call. Network and protocol failures fail the job. If a run fails after sending the request, inspect Creator Studio before rerunning to avoid submitting the same version twice.

工作流串行提交更新，不自动重试。如果请求发出后连接失败，先查看 Creator Studio 中的版本状态，再决定是否重跑，避免重复提交。

Agensi can return a plain-text business error without setting MCP `isError`. Such responses fail the workflow with the server's diagnostic; they are never treated as a successful update. HTTP authentication alone does not confirm that the account's creator profile or an actual upload works.

Agensi 可能返回纯文本业务错误而不设置 MCP `isError`。脚本会保留诊断信息并让工作流失败，不将这类响应记为更新成功。HTTP 认证通过仍需继续确认创作者资料可读取，并在已有商品上验证实际上传。

References: [Agensi MCP tools](https://www.agensi.io/mcp) · [MCP setup](https://www.agensi.io/docs/mcp-setup) · [GitHub Release events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#release)
