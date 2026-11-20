#!/usr/bin/env python3
"""元宝搜索 MCP 通道客户端

为什么不用仓库自带的 scripts/yuanbao_search.py：
该脚本走 HTTP 的 /SearchPro，用这把密钥调用一律返回 UnauthorizedOperation，
同一把密钥走 /Mcp（JSON-RPC）可以正常取结果。二者服务相同，鉴权路径不同。
实测 2026-11-20：/SearchPro 报 UnauthorizedOperation，/Mcp tools/call 返回正常结果。

用法：
  python3 mcp_search.py --query "冰红茶 梗" --freshness d7 --cnt 20
  python3 mcp_search.py --query "统一冰红茶 梗" --format json --out r.json

密钥读取顺序：环境变量 TENCENTCLOUD_WSA_APIKEY，然后是 ~/.config/yuanbao-search/key。
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

ENDPOINT = "https://api.wsa.cloud.tencent.com/Mcp"
ENV_KEY = "TENCENTCLOUD_WSA_APIKEY"
VALID_CNT = (10, 20, 30, 40, 50)


def resolve_key() -> str:
    env = os.environ.get(ENV_KEY, "").strip()
    if env:
        return env
    path = os.path.expanduser("~/.config/yuanbao-search/key")
    if os.path.isfile(path):
        with open(path, encoding="utf-8-sig") as f:
            text = f.read().strip()
            if text:
                return text
    sys.exit("缺少密钥：设 %s 或写 ~/.config/yuanbao-search/key" % ENV_KEY)


def call(query: str, cnt: int = 10, freshness: str | None = None,
         site: str | None = None, mode: int | None = None,
         industry: str | None = None, retries: int = 2) -> dict:
    args: dict = {"Query": query, "Cnt": str(cnt)}
    if freshness:
        args["Freshness"] = freshness
    if site:
        args["Site"] = site
    if mode is not None:
        args["Mode"] = mode
    if industry:
        args["Industry"] = industry
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/call",
                       "params": {"name": "SearchPro", "arguments": args}}).encode()
    req = urllib.request.Request(ENDPOINT, data=body, method="POST", headers={
        "Authorization": "Bearer " + resolve_key(),
        "Content-Type": "application/json; charset=utf-8",
    })
    last = None
    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                payload = json.loads(r.read())
            break
        except urllib.error.HTTPError as e:
            last = e
            if e.code in (429, 500, 502, 503, 504) and attempt < retries:
                time.sleep(2 ** attempt)
                continue
            raise
        except urllib.error.URLError as e:
            last = e
            if attempt < retries:
                time.sleep(2 ** attempt)
                continue
            raise
    else:
        raise SystemExit("网络异常：%s" % last)

    result = payload.get("result", {})
    if result.get("isError"):
        raise SystemExit("接口报错：%s" % result.get("content", [{}])[0].get("text", ""))
    inner = json.loads(result["content"][0]["text"])["Response"]
    if "Error" in inner:
        raise SystemExit("接口报错：%s %s" % (inner["Error"].get("Code"), inner["Error"].get("Message")))
    items = [json.loads(p) for p in inner.get("Pages", [])]
    return {"query": inner.get("Query", query), "version": inner.get("Version"),
            "request_id": inner.get("RequestId"), "count": len(items), "items": items}


def show(data: dict, fmt: str) -> str:
    if fmt == "json":
        return json.dumps(data, ensure_ascii=False, indent=2)
    lines = ["## 查询词：%s ｜ 结果 %d 条 ｜ 版本 %s" % (data["query"], data["count"], data["version"])]
    for i, it in enumerate(data["items"], 1):
        lines.append("%d. [%s](%s)" % (i, it.get("title", ""), it.get("url", "")))
        text = it.get("content") or it.get("passage") or ""
        lines.append("   - 摘要：%s" % text[:300].replace("\n", " "))
        lines.append("   - 发布 %s ｜ 站点 %s ｜ 相关度 %s ｜ 类型 %s" % (
            it.get("date", ""), it.get("site", ""), it.get("score", ""),
            "垂直" if it.get("vr") or it.get("only_vr") else "网页"))
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--query", "-q", required=True)
    ap.add_argument("--cnt", type=int, default=10)
    ap.add_argument("--freshness")
    ap.add_argument("--site")
    ap.add_argument("--mode", type=int)
    ap.add_argument("--industry")
    ap.add_argument("--format", default="md", choices=("md", "json"))
    ap.add_argument("--out")
    a = ap.parse_args()
    if a.cnt not in VALID_CNT:
        sys.exit("Cnt 只能取 10/20/30/40/50")
    if len(a.query.encode()) > 1500:
        sys.exit("Query 超过 1500 字节")
    data = call(a.query, a.cnt, a.freshness, a.site, a.mode, a.industry)
    text = show(data, a.format)
    if a.out:
        with open(a.out, "w", encoding="utf-8") as f:
            f.write(text + "\n")
        print("已写入 %s，%d 条" % (a.out, data["count"]))
    else:
        print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
