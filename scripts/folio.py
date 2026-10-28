"""Local editor scaffold, JSON rendering and self-contained website packaging."""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

SKILL = Path(__file__).resolve().parent.parent


def new_directory(value):
    dest = Path(value).expanduser().resolve()
    if dest.exists() and (not dest.is_dir() or any(dest.iterdir())):
        raise ValueError(f"输出目录不是空目录，请改用新目录以保留现有成果：{dest}")
    if dest == SKILL or SKILL in dest.parents:
        raise ValueError("输出目录不能位于 Skill 安装目录中")
    return dest


class WebsiteCheck(HTMLParser):
    def __init__(self):
        super().__init__()
        self.has_html = False
        self.has_title = False
        self.has_main = False
        self.title = ""
        self.in_title = False
        self.sample = False
        self.noindex = False
        self.external_assets = []
        self.editor = False
        self.in_style = False
        self.styles = []

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        self.has_html |= tag == "html"
        self.has_main |= tag == "main"
        if tag == "title":
            self.has_title = self.in_title = True
        if tag == "style":
            self.in_style = True
        if d.get("style"):
            self.styles.append(d["style"])
        if "sample-note" in d.get("class", "").split():
            self.sample = True
        if d.get("id") in ("inspector", "preview", "block-list"):
            self.editor = True
        if tag == "meta" and d.get("name", "").lower() == "robots":
            self.noindex |= "noindex" in d.get("content", "").lower()
        if tag in ("script", "img", "iframe", "video", "audio", "source"):
            ref = d.get("src", "")
            if ref and not ref.startswith("data:"):
                self.external_assets.append(ref)
        if tag == "link" and d.get("href") and d.get("rel") in ("stylesheet", "icon"):
            self.external_assets.append(d["href"])

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == "style":
            self.in_style = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self.in_style:
            self.styles.append(data)


def inspect_html(html, indexing):
    if indexing == "allow":
        html = re.sub(r'<meta\s+name=[\"\']robots[\"\']\s+content=[\"\']noindex[\"\']\s*/?>', "", html, flags=re.I)
    check = WebsiteCheck()
    check.feed(html)
    if check.editor:
        raise ValueError("这是编辑器页面，不是作品集。请点击编辑器的“导出网站”，再打包下载的 HTML。")
    if not (check.has_html and check.has_title and check.has_main):
        raise ValueError("网页缺少 html/title/main，请使用见页导出的完整 HTML")
    if check.external_assets:
        raise ValueError("网页不是自包含导出，仍依赖外部资源：" + ", ".join(check.external_assets[:4]))
    if re.search(r'url\(\s*[\"\']?(?!data:|#)[^\s)\"\']', "\n".join(check.styles), flags=re.I):
        raise ValueError("网页仍包含非内嵌的 CSS 资源，请先整理依赖")
    return html, check


def initialize(dest):
    dest.mkdir(parents=True, exist_ok=True)
    shutil.copytree(SKILL / "assets" / "editor", dest / "editor")
    shutil.copy2(SKILL / "assets" / "profile.example.json", dest / "profile.example.json")
    return {"editor": str(dest / "editor" / "index.html"), "example": str(dest / "profile.example.json")}


def build(data, dest, indexing):
    node = shutil.which("node")
    if not node:
        raise ValueError("自动渲染需要 Node.js 18+；也可在本地编辑器中导入 JSON 后导出网站")
    rendered = subprocess.run([node, str(SKILL / "scripts" / "render.mjs"), str(data)], check=True, capture_output=True)
    html, check = inspect_html(rendered.stdout.decode("utf-8"), indexing)
    dest.mkdir(parents=True, exist_ok=True)
    (dest / "index.html").write_bytes(html.encode("utf-8"))
    return {"website": str(dest / "index.html"), "sample": check.sample, "noindex": check.noindex}


def pack(source, dest, indexing):
    html, check = inspect_html(source.read_bytes().decode("utf-8-sig"), indexing)
    encoded = html.encode("utf-8")
    if len(encoded) > 25 * 1024 * 1024:
        raise ValueError("单文件超过当前直接上传指引的25MB限制，请减少图片体积或拆分资源后再发布")
    dest.mkdir(parents=True, exist_ok=True)
    site = dest / "site"
    site.mkdir()
    (site / "index.html").write_bytes(encoded)
    archive = dest / "website.zip"
    with ZipFile(archive, "w", ZIP_DEFLATED) as z:
        z.writestr("index.html", encoded)
    with ZipFile(archive) as z:
        if z.namelist() != ["index.html"] or z.testzip() is not None:
            raise ValueError("压缩包校验失败")
    report = {"title": check.title, "source": str(source), "website": str(site / "index.html"), "zip": str(archive), "zip_entries": ["index.html"], "bytes": len(encoded), "sha256": hashlib.sha256(encoded).hexdigest(), "sample_content": check.sample, "search_noindex": check.noindex, "generated_utc": datetime.now(timezone.utc).isoformat(), "published": False}
    (dest / "package-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    note = "上传 website.zip，不要上传整个 release 文件夹。ZIP根目录已验证包含 index.html。\n本工具没有上传网站、配置域名或开通任何云服务。\n"
    if check.sample:
        note += "当前有示例资料提示：先替换虚构内容，再发布真实作品集。\n"
    note += "禁止搜索收录：" + ("是（不是密码保护）" if check.noindex else "未检测到 noindex") + "。\n上线步骤请参考 Skill 的 references/publish-edgeone.md。\n"
    (dest / "上传前说明.txt").write_text(note, encoding="utf-8")
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("init", "build", "pack"):
        p = sub.add_parser(name)
        p.add_argument("--out", required=True)
        if name != "init":
            p.add_argument("--data" if name == "build" else "--html", required=True)
            p.add_argument("--indexing", choices=("keep", "allow"), default="keep")
    args = parser.parse_args()
    try:
        dest = new_directory(args.out)
        if args.command == "init":
            result = initialize(dest)
        elif args.command == "build":
            result = build(Path(args.data).expanduser().resolve(), dest, args.indexing)
        else:
            result = pack(Path(args.html).expanduser().resolve(), dest, args.indexing)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except subprocess.CalledProcessError as error:
        print(error.stderr.decode("utf-8", errors="replace"), file=sys.stderr)
        return 1
    except (ValueError, OSError) as error:
        print(str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
