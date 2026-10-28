# 共用内容格式 v1

先参考 `assets/profile.example.json` 的完整结构。Agent负责读取用户资料并填此格式；编辑器和命令行渲染器共用 `assets/editor/renderer.js`。浏览器内没有 PDF/Word 解析服务。

## 顶层

| 字段 | 含义 |
| --- | --- |
| version | 固定数字1 |
| theme | editorial / case / cinema |
| accent | #RRGGBB，例如 #636c48 |
| font | serif / sans |
| spacing | compact / normal / airy |
| motion | none / fade / rise |
| sample | 虚构示例为true；替换并删去示例经历后才对真实资料设false |
| selected | 编辑器初始选择的组件id，可填第一个组件 |
| blocks | 按展示顺序排列，最多30个 |

每个组件需要 `id`、`type`、`label`、`visible`、`data`。id必须唯一，以字母开头，仅字母数字下划线连字符，最长71字符；visible为布尔值。数据字段按下表填写，没提供的可选内容用空字符串，不写“已获得”一类假事实。

## 七种组件

| type | data字段 |
| --- | --- |
| bio | name, english, role, headline, description, location, image, imageCaption |
| projects | title, intro, layout, items；每项 title, category, year, role, description, image, url |
| gallery | title, intro, layout, items；每项 caption, image |
| text | title, intro, body；正文用换行分段 |
| timeline | title, intro, items；每项 period, title, description |
| video | title, intro, description, url, image；链接到原平台，不托管视频文件 |
| contact | title, description, email, wechat, url, linkLabel |

layout为grid或single。每个items数组最多12项。未使用的组件可从blocks删掉；不要留一个与真实用户无关的虚构人名、项目、奖项或学校。

项目状态写在description中，role仅写实际职责。保留公开证据链接；缺少公开证据也不等于可以伪造。一般作品链接为http/https；渲染器过滤不支持的协议。

## 图片与非破坏取景

image字段是空字符串或以下格式的内嵌图片，不能直接填本地文件路径或网络图片URL：

```text
data:image/jpeg;base64,...
```

支持jpeg/png/webp/gif。上传界面限制单张3MB。相应data或作品item可增加imageView对象：

```json
{"fit":"cover","ratio":"original","x":50,"y":50,"zoom":1,"natural":1.5}
```

- fit：cover裁切填满；contain完整显示，忽略位置和缩放。
- ratio：auto跟随模板；original按原图宽高比；或1:1、4:5、3:2、16:9。
- x、y：0—100，取景位置百分比。
- zoom：1—3。
- natural：图片实际宽度/实际高度。Agent填此值时应读取图像尺寸，不猜测；没有尺寸就让用户在编辑器上传，窗口会自动计算。

图片参数缺失时使用旧版默认，保证原有JSON兼容。画廊新上传默认原图比例；设计模板个人头像固定圆形。主题切换不清空数据，但响应式片头可能改变画框比例，应查看手机预览。

JSON仅是本地资料，不能和作品集网站一起上传；正式网站不依赖JSON或编辑器。用户备份往往包含所有图片和联系方式，分发Skill时仅带随包虚构示例，不加入实际用户草稿。
