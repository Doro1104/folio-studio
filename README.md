# 见页 Folio Studio Skill

把简历和作品整理成可编辑作品集，再打包并指导上线。面向艺术留学申请、艺术传媒作品集及软件项目展示。

## 它包含什么

- v02本地编辑器：摄影、设计、影视三套不同编排；七类组件；图片拖动取景、缩放与完整显示。
- Agent资料整理规范：从用户材料生成统一JSON，再交给编辑器调整。
- 本地工具：初始化编辑器、从JSON生成网页、将最终HTML打包为网站ZIP。
- EdgeOne发布指南：上传、区域、默认域名限制、注册域名、TXT归属验证、CNAME、免费HTTPS及更新排错。

这是可交给Agent的工作流包，不是已经上线的网页应用。网页本身尚未内置AI解析；由宿主Agent读取和整理资料。不需要在编辑器中填写模型API Key。

## 安装与试用

WorkBuddy：在技能页“添加技能 → 上传技能”，选择Release提供的Skill ZIP；具体入口见[官方文档](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market)。

其他支持Agent Skills的宿主：将完整目录安装到其skills目录，或让Agent直接读取SKILL.md执行。不要上传整个GitHub仓库下载包而不检查套层。

对Agent说：

> 使用folio-studio，在新文件夹创建可编辑作品集，先本地预览，不上传网站、不购买域名。

复制和打包工具依赖Python 3，JSON自动渲染另需Node.js 18+；编辑器本身只需要现代浏览器。详细说明见[安装与分发](references/install-and-share.md)。

## 两种ZIP

| 文件 | 用途 |
| --- | --- |
| folio-studio-0.1.0.zip | 安装给Agent，第一层为SKILL.md |
| website.zip | 每位用户自己的最终网站，第一层为index.html，上传EdgeOne |

不要将编辑器源码、资料备份或原始简历一起上传到个人作品集网站。

## 状态与许可

Skill 0.1.0，模板v02。未发布GitHub、未上架技能市场；WorkBuddy应用内导入尚未实测。已验证的本地工具能力见发布包外的验证说明。

模板源代码尚未选择公开开源许可证；由作者决定后补充。随包字体保留各自OFL许可证，位于assets/editor/assets/licenses。
