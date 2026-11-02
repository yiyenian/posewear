#!/usr/bin/env python3
"""从原作者的公开图库下载构建所需的数据与图片到 ./assets-raw（或 POSEWEAR_RAW）。

图片与原始数据版权归各自作者所有，本仓库不包含任何素材。
请只用于本地构建与学习，遵守原站的使用条款；下载时请保持低并发，不要反复全量抓取。

用法：
  python3 scripts/fetch-assets.py              # 全部
  python3 scripts/fetch-assets.py pose costume # 只下载部分素材库
  python3 scripts/fetch-assets.py --meta-only  # 只下载数据，不下载图片
"""
import json, os, re, sys, time, urllib.request, concurrent.futures as cf

SRC = {
    'pose': 'https://ai-pose-gallery.pages.dev/',
    'costume': 'https://ai-costume-gallery.pages.dev/',
    'portrait': 'https://ai-portrait-gallery.pages.dev/',
}
OUT = os.environ.get('POSEWEAR_RAW', 'assets-raw')
LITE = os.environ.get('POSEWEAR_LITE') == '1'  # 精简模式：跳过服装原寸图（仅用于生成 o/ 全尺寸输出）
UA = {'User-Agent': 'Mozilla/5.0 (PoseWear local build)'}
WORKERS = 4


def get(url, path=None, tries=4):
    if path and os.path.exists(path) and os.path.getsize(path) > 0:
        return 0
    for i in range(tries):
        try:
            b = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
            if path is None:
                return b
            os.makedirs(os.path.dirname(path), exist_ok=True)
            open(path + '.part', 'wb').write(b)
            os.replace(path + '.part', path)
            return len(b)
        except Exception as e:
            err = e
            time.sleep(2 + i * 3)
    print('失败', url, err, flush=True)
    return None if path is None else 0


def inline_data(html):
    """原站把数据写在页面里的 const X=...; 中。"""
    out = {}
    for name in ['META', 'D', 'ANG', 'POSES', 'PMAP', 'JA']:
        m = re.search(r'const ' + name + r'=(.*?);\n', html)
        if m:
            try:
                out[name] = json.loads(m.group(1))
            except ValueError:
                if name == 'D':
                    print('解析失败', name)
    return out


def meta(lib):
    base, d = SRC[lib], os.path.join(OUT, lib)
    os.makedirs(d, exist_ok=True)
    if lib in ('pose', 'costume'):
        html = get(base).decode('utf-8')
        open(os.path.join(d, 'index.html'), 'w').write(html)
        data = inline_data(html)
        if 'D' not in data:
            sys.exit(f'{lib}: 页面结构可能已变化，没找到数据')
        json.dump(data, open(os.path.join(d, 'data.json'), 'w'), ensure_ascii=False)
        keys = {'pose': ['サムネ', '原寸'], 'costume': ['サムネ', '画像'] if LITE else ['画像', '原寸']}[lib]
        return [x[k] for x in data['D'] for k in keys if x.get(k)]
    for f in ('images.js', 'ranking.js'):
        open(os.path.join(d, f), 'wb').write(get(base + 'data/' + f))
    t = open(os.path.join(d, 'images.js')).read()
    items = json.loads(t[t.index('['):t.rindex(']') + 1])
    return [x[k] for x in items for k in ('thumb', 'full') if x.get(k)]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('-')] or list(SRC)
    only_meta = '--meta-only' in sys.argv
    for lib in args:
        files = meta(lib)
        print(f'{lib}: {len(files)} 个文件', flush=True)
        if only_meta:
            continue
        jobs = [(SRC[lib] + f, os.path.join(OUT, lib, f)) for f in files]
        n = 0
        with cf.ThreadPoolExecutor(WORKERS) as ex:
            for i, s in enumerate(ex.map(lambda j: get(*j), jobs)):
                n += s or 0
                if i % 200 == 0:
                    print(f'  {i}/{len(jobs)}  {n / 1e6:.0f} MB', flush=True)
    print('完成。接下来运行：python3 build.py')


if __name__ == '__main__':
    main()
