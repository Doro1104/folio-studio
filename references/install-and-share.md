# 安装与分发

## WorkBuddy

按2026-10-28核对的[官方技能文档](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market)：进入“专家·技能·连接器”中的“技能”，点击“添加技能 → 上传技能”，选择本地Skill包。界面名称随版本可能变化。

分发ZIP的最外层有SKILL.md及assets/scripts/references，避免重复压缩套层。本项目交付的 `folio-studio-0.1.0.zip` 按此结构组织。安装后核对技能名folio-studio并在新会话试用。官方说明普通“对话安装”面向市场技能；不要声称任意GitHub链接一定可以从对话一键安装。

若版本不接受本地包，以其官方支持的本地Skill目录方式导入：将整个folio-studio文件夹放进宿主指定的skills目录，确认最终存在 `skills/folio-studio/SKILL.md`。不要把宿主路径一概写成Codex路径，也不自动改用户无关配置。

## Codex 与其他 Agent

Codex安装到其实际CODEX_HOME下的skills/folio-studio；宿主未设置该目录时按其当前技能安装说明处理。支持Agent Skills目录约定的其他宿主，可读取同一SKILL.md，但Python/Node执行权限、浏览器、PDF读取能力必须分别具备；不能据文件格式相同就声称所有宿主已验证兼容。

没有安装器的宿主，也可让Agent读取解压后的SKILL.md，在当前任务按工作流执行。此方式不代表它已自动注册到全局技能列表。

## GitHub分发

`folio-studio/` 本身就是可放入GitHub的技能目录。准备公开时：

1. 仓库可以以该目录内容为根，也可以将它放进 skills/folio-studio。说明实际SKILL.md所在位置。
2. 本地检查仅包含虚构profile.example.json、模板和字体许可证；不包含真实简历、联系方式、浏览器存储、API Key或测试输出。
3. 由作者决定代码开放许可。本版没有替作者选择开源许可证；字体的OFL单独保留。公开可下载不自动等于允许所有商业再分发。
4. 作者确认发布范围后，在其GitHub账号创建仓库并推送源码，再创建版本Release，上传folio-studio-0.1.0.zip。
5. 下载链接须来自实际成功的仓库/Release响应，不生成虚构GitHub链接。未来用户下载ZIP后可走WorkBuddy“上传技能”。

本地已打包不等于已经上架市场或发布GitHub。当前版本验证了本机脚本和编辑器，尚未在WorkBuddy应用内实际导入测试。

## 试用话术

“使用folio-studio，为我在新文件夹创建一个可编辑作品集。先展示三套主题，不上传网站、不购买域名。”

“使用folio-studio，根据我提供的简历和作品整理中文作品集初稿。保留项目身份和完成状态，生成可导入的资料JSON与本地网页。”

“使用folio-studio，将我刚导出的作品集HTML打包成EdgeOne网站ZIP，先检查上传包，再一步一步指导我绑定域名和配置HTTPS。”
