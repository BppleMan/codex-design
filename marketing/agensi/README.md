# Agensi 商品物料 / Agensi listing materials

这里保存 Codex Design 的商品文案、图片原件、生成记录和草稿预览。2026-10-11 的草稿采用一次性付费 **USD 9.99**，当时已保存，尚未提交。

## 文案与设置

- [商品字段](listing-fields.json)：名称、摘要、价格、示例请求及各项物料路径。
- [商品介绍](listing-description.en.md)、[示例流程](listing-demo.en.md)、[FAQ](listing-faq.en.json)。
- [兼容性、权限与限制](listing-settings.en.json)：对应草稿中填写的说明。

这些 JSON 是仓库里的物料记录，不是 Agensi API 请求格式。Markdown 保留已上传的公开图片 URL，可直接复用到商品编辑器；图片原件另存于 `media/`。

## 图片原件

| 文件 | 用途 | 尺寸 |
| --- | --- | --- |
| [codex-design-logo.png](media/codex-design-logo.png) | 商品 Logo | 1254 × 1254 |
| [01-overview.png](media/01-overview.png) | 商品主图 | 1536 × 1024 |
| [02-workflow.png](media/02-workflow.png) | 工作流 | 1536 × 1024 |
| [03-behavior.png](media/03-behavior.png) | 交互状态 | 1536 × 1024 |
| [04-contexts.png](media/04-contexts.png) | 多端模拟 | 1536 × 1024 |
| [05-deliverables.png](media/05-deliverables.png) | 交付成果 | 1536 × 1024 |

图片由内置 `image_gen` 生成。[生成记录](media/manifest.json)保留完整提示词、输出标识、尺寸和 SHA-256，不含本机绝对路径。后续图库图片均以 Logo 为视觉参考。

五张商品图是标明 **Concept illustration** 的概念图。示例文案也是概念演示，不是实际完成会话或客户成果记录。

## 草稿预览记录

- [桌面预览](evidence/agensi-product-media-preview.jpg)与[移动预览](evidence/agensi-product-media-mobile.jpg)。
- [保存与图片加载记录](evidence/final-draft-check.json)：当时的草稿状态与公开图片 URL。
- [首次上传包记录](evidence/package-manifest.json)：源提交、文件清单、尺寸与 ZIP 校验和。

平台预览当时仍含自动生成的 `codex-design.tsx` 文件卡片及运行步骤。这些内容不代表已验证的执行结果，也不代表下载包中包含该文件。截图仅记录商品草稿显示效果。

## 发布边界

`marketing/` 不进入 Skill 文本发布包，也通过 `.gitattributes` 从 `git archive` 导出的安装包排除。图片原件与文案进入 Git；可重新生成的 ZIP 和解压校验副本不重复提交。自动更新配置见 [Agensi 发布说明](../../docs/agensi-publishing.md)。

This directory stores the final listing copy, six original images, generation provenance, and dated draft previews. The recorded offer is a one-time USD 9.99 purchase. Gallery images and the walkthrough are illustrative; draft screenshots are evidence of the listing preview only. Marketing materials are excluded from skill packages. The repository's Apache-2.0 license applies.
