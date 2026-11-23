#!/usr/bin/env python3
"""
Changeling: The Dreaming 20th — Local Editorial Web Admin & Live Preview Server
Usage:
  python tools/admin.py [--port 8080] [--no-browser]

Opens:
  - Live Book Site:  http://127.0.0.1:8080/
  - Editorial Admin: http://127.0.0.1:8080/admin
"""
from __future__ import annotations

import argparse
import base64
from datetime import datetime
import glob
import json
import mimetypes
import os
import re
import shutil
import subprocess
import sys
import threading
import webbrowser
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

TOOLS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = TOOLS_DIR.parent
CONTENT_DIR = PROJECT_ROOT / "content"
IMAGES_DIR = PROJECT_ROOT / "assets" / "images"
DOCS_DIR = PROJECT_ROOT / "docs"

sys.path.insert(0, str(TOOLS_DIR))
from build import build_site, render_markdown  # noqa: E402


def gen_russian_forms(word: str) -> list[str]:
    w = word.strip()
    if not w:
        return []
    forms = {w, w.lower(), w[0].upper() + w[1:]}
    if " " not in w and re.fullmatch(r"[А-Яа-яЁё\-]+", w):
        low = w.lower()
        stems_endings: list[str] = []
        stem = w
        if low.endswith("ия"):
            stem = w[:-2]
            stems_endings = ["ия", "ии", "ию", "ией", "иею", "ий", "иям", "иями", "иях"]
        elif low.endswith("ье") or low.endswith("ие"):
            stem = w[:-2]
            e0 = w[-2]
            stems_endings = [f"{e0}е", f"{e0}я", f"{e0}ю", f"{e0}ем", f"{e0}и", f"{e0}й", f"{e0}ям", f"{e0}ями", f"{e0}ях"]
        elif low.endswith("ость") or low.endswith("есть"):
            stem = w[:-1]
            stems_endings = ["ь", "и", "ью", "ей", "ям", "ями", "ях"]
        elif low.endswith("а"):
            stem = w[:-1]
            y = "и" if stem and stem[-1].lower() in "кгхжшщч" else "ы"
            stems_endings = ["а", y, "е", "у", "ой", "ою", "", "ам", "ами", "ах"]
        elif low.endswith("я"):
            stem = w[:-1]
            stems_endings = ["я", "и", "е", "ю", "ей", "ею", "ь", "ям", "ями", "ях"]
        elif low.endswith("о"):
            stem = w[:-1]
            stems_endings = ["о", "а", "у", "ом", "е", "ам", "ами", "ах"]
        elif low.endswith("й"):
            stem = w[:-1]
            stems_endings = ["й", "я", "ю", "ем", "е", "и", "ев", "ям", "ями", "ях"]
        elif low.endswith("ь"):
            stem = w[:-1]
            stems_endings = ["ь", "я", "ю", "ем", "е", "и", "ей", "ям", "ями", "ях"]
        elif low[-1] in "бвгдзклмнпрстфхцчшщ":
            stem = w
            y = "и" if low[-1] in "кгхжшщч" else "ы"
            om = "ем" if low[-1] in "жшщчц" else "ом"
            ov = "ей" if low[-1] in "жшщч" else "ов"
            stems_endings = ["", "а", "у", om, "е", y, ov, "ам", "ами", "ах"]

        for end in stems_endings:
            cand = stem + end
            if len(cand) >= 3:
                forms.add(cand)
                forms.add(cand.lower())
                forms.add(cand[0].upper() + cand[1:])
    return sorted(forms, key=lambda s: (-len(s), s))


def list_all_images() -> list[dict]:
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    items: list[dict] = []
    for p in sorted(IMAGES_DIR.rglob("*")):
        if p.is_file() and p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}:
            rel = p.relative_to(PROJECT_ROOT).as_posix()
            folder = p.parent.relative_to(IMAGES_DIR).as_posix()
            items.append({
                "path": rel,
                "name": p.name,
                "folder": "." if folder == "." else folder,
                "size": p.stat().st_size,
            })
    return items


def sanitize_filename(name: str) -> str:
    base, ext = os.path.splitext(name)
    ext = ext.lower()
    if ext not in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}:
        ext = ".png"
    clean = re.sub(r"[^A-Za-z0-9А-Яа-яЁё_\-]+", "-", base).strip("-") or "image"
    return f"{clean}{ext}"


def find_git_exe() -> str | None:
    found = shutil.which("git")
    if found:
        return found
    local_app = os.environ.get("LOCALAPPDATA", "")
    candidates = [
        r"C:\Program Files\Git\cmd\git.exe",
        r"C:\Program Files (x86)\Git\cmd\git.exe",
        os.path.join(local_app, "Programs", "Git", "cmd", "git.exe") if local_app else "",
    ]
    if local_app:
        candidates.extend(glob.glob(os.path.join(local_app, "GitHubDesktop", "app-*", "resources", "app", "git", "cmd", "git.exe")))
    for c in candidates:
        if c and os.path.isfile(c):
            return c
    return None


def run_git(args: list[str], timeout: int = 90) -> tuple[int, str, str]:
    git_exe = find_git_exe()
    if not git_exe:
        return 127, "", "Git не установлен на компьютере."
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"
    proc = subprocess.run(
        [git_exe, *args],
        cwd=str(PROJECT_ROOT),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
        env=env,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def derive_pages_url(remote_url: str) -> str:
    m = re.search(r"github\.com[:/]([^/]+)/([^/\s]+?)(?:\.git)?$", remote_url.strip())
    if not m:
        return ""
    owner, repo = m.group(1), m.group(2)
    if repo.lower() == f"{owner.lower()}.github.io":
        return f"https://{owner}.github.io/"
    return f"https://{owner}.github.io/{repo}/"


def get_git_status_payload() -> dict:
    git_exe = find_git_exe()
    if not git_exe:
        return {"gitInstalled": False, "repoInitialized": False, "remoteUrl": "", "pagesUrl": "", "branch": "main", "changes": [], "lastCommit": ""}

    repo_init = (PROJECT_ROOT / ".git").exists()
    if not repo_init:
        return {"gitInstalled": True, "gitPath": git_exe, "repoInitialized": False, "remoteUrl": "", "pagesUrl": "", "branch": "main", "changes": [], "lastCommit": ""}

    _, remote_url, _ = run_git(["remote", "get-url", "origin"])
    _, branch, _ = run_git(["branch", "--show-current"])
    _, status_out, _ = run_git(["status", "--porcelain"])
    _, last_commit, _ = run_git(["log", "-1", "--pretty=format:%h · %s (%cr)"])
    _, user_name, _ = run_git(["config", "user.name"])
    _, user_email, _ = run_git(["config", "user.email"])

    changes = [line for line in status_out.splitlines() if line.strip()]
    return {
        "gitInstalled": True,
        "gitPath": git_exe,
        "repoInitialized": True,
        "remoteUrl": remote_url,
        "pagesUrl": derive_pages_url(remote_url),
        "branch": branch or "main",
        "changes": changes,
        "lastCommit": last_commit,
        "userName": user_name,
        "userEmail": user_email,
    }


class AdminRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DOCS_DIR), **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        sys.stdout.write(f"[CtD20] {self.address_string()} - {fmt % args}\n")

    def _send_json(self, payload: dict, status: int = 200) -> None:
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(raw)

    def _read_json_body(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length > 0 else b"{}"
        return json.loads(raw.decode("utf-8"))

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path

        if path in ("/admin", "/admin/"):
            ui_file = TOOLS_DIR / "admin_ui.html"
            data = ui_file.read_bytes()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)
            return

        if path == "/api/state":
            manifest = json.loads((CONTENT_DIR / "manifest.json").read_text(encoding="utf-8"))
            lexicon = json.loads((CONTENT_DIR / "lexicon.json").read_text(encoding="utf-8"))
            kiths = json.loads((CONTENT_DIR / "kiths.json").read_text(encoding="utf-8"))
            images = list_all_images()
            self._send_json({
                "manifest": manifest,
                "lexicon": lexicon,
                "kiths": kiths,
                "images": images,
                "git": get_git_status_payload(),
            })
            return

        if path == "/api/git-status":
            self._send_json(get_git_status_payload())
            return

        if path == "/api/chapter":
            qs = parse_qs(parsed.query)
            slug = (qs.get("slug") or [""])[0]
            manifest = json.loads((CONTENT_DIR / "manifest.json").read_text(encoding="utf-8"))
            vol = next((v for v in manifest["volumes"] if v["slug"] == slug), None)
            if not vol:
                self._send_json({"error": "Том не найден"}, 404)
                return
            md_file = CONTENT_DIR / "chapters" / vol["file"]
            md_text = md_file.read_text(encoding="utf-8") if md_file.exists() else ""
            html_prev, _, _ = render_markdown(md_text, root_prefix="/", apply_drop_cap=True)
            self._send_json({"slug": slug, "volume": vol, "markdown": md_text, "htmlPreview": html_prev})
            return

        return super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        try:
            body = self._read_json_body()
        except Exception as exc:
            self._send_json({"error": f"Некорректный JSON: {exc}"}, 400)
            return

        if path == "/api/preview":
            md_text = body.get("markdown", "")
            html_prev, _, _ = render_markdown(md_text, root_prefix="/", apply_drop_cap=True)
            self._send_json({"htmlPreview": html_prev})
            return

        if path == "/api/manifest":
            manifest = body.get("manifest")
            if not isinstance(manifest, dict) or "volumes" not in manifest:
                self._send_json({"error": "Неверный формат manifest"}, 400)
                return
            (CONTENT_DIR / "manifest.json").write_text(
                json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
            )
            stats = build_site()
            self._send_json({"ok": True, "stats": stats})
            return

        if path == "/api/chapter":
            slug = body.get("slug", "")
            md_text = body.get("markdown", "")
            vol_patch = body.get("volume")
            manifest = json.loads((CONTENT_DIR / "manifest.json").read_text(encoding="utf-8"))
            vol = next((v for v in manifest["volumes"] if v["slug"] == slug), None)
            if not vol:
                self._send_json({"error": "Том не найден"}, 404)
                return
            if isinstance(vol_patch, dict):
                for key in ("title", "summary", "status", "auraHex", "coverImage", "epigraph", "epigraphAuthor"):
                    if key in vol_patch:
                        vol[key] = vol_patch[key]
                (CONTENT_DIR / "manifest.json").write_text(
                    json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
                )
            md_file = CONTENT_DIR / "chapters" / vol["file"]
            md_file.write_text(md_text.rstrip() + "\n", encoding="utf-8")
            stats = build_site()
            self._send_json({"ok": True, "stats": stats, "volume": vol})
            return

        if path == "/api/kiths":
            kiths = body.get("kiths")
            if not isinstance(kiths, list):
                self._send_json({"error": "Ожидался массив kiths"}, 400)
                return
            # Auto-compute auraRgb whenever auraHex is changed
            for k in kiths:
                hx = (k.get("auraHex") or "#d8b979").strip().lstrip("#")
                if len(hx) == 6:
                    k["auraRgb"] = f"{int(hx[0:2],16)}, {int(hx[2:4],16)}, {int(hx[4:6],16)}"
            (CONTENT_DIR / "kiths.json").write_text(
                json.dumps(kiths, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
            )
            stats = build_site()
            self._send_json({"ok": True, "stats": stats})
            return

        if path == "/api/lexicon":
            lexicon = body.get("lexicon")
            if not isinstance(lexicon, list):
                self._send_json({"error": "Ожидался массив lexicon"}, 400)
                return
            lexicon.sort(key=lambda x: (x.get("ru") or "").lower())
            (CONTENT_DIR / "lexicon.json").write_text(
                json.dumps(lexicon, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
            )
            stats = build_site()
            self._send_json({"ok": True, "stats": stats})
            return

        if path == "/api/wordforms":
            word = body.get("word", "")
            forms = set()
            for part in str(word).split("/"):
                part = part.strip()
                if " " in part:
                    forms.add(part)
                    forms.add(part.lower())
                else:
                    forms.update(gen_russian_forms(part))
            self._send_json({"patterns": sorted(forms, key=lambda x: (-len(x), x))})
            return

        if path == "/api/upload-image":
            raw_name = sanitize_filename(body.get("filename", "image.png"))
            folder = re.sub(r"[^A-Za-z0-9_\-]", "", body.get("folder", "chapters")) or "chapters"
            b64 = body.get("dataBase64", "")
            if "," in b64:
                b64 = b64.split(",", 1)[1]
            data = base64.b64decode(b64)
            dest_dir = IMAGES_DIR / folder
            dest_dir.mkdir(parents=True, exist_ok=True)
            dest_path = dest_dir / raw_name
            # Prevent accidental overwrite by appending counter if needed unless overwrite=True
            if dest_path.exists() and not body.get("overwrite", False):
                stem, ext = os.path.splitext(raw_name)
                c = 2
                while (dest_dir / f"{stem}-{c}{ext}").exists():
                    c += 1
                dest_path = dest_dir / f"{stem}-{c}{ext}"
            dest_path.write_bytes(data)
            rel_path = dest_path.relative_to(PROJECT_ROOT).as_posix()
            build_site()
            self._send_json({
                "ok": True,
                "path": rel_path,
                "images": list_all_images(),
            })
            return

        if path == "/api/delete-image":
            rel = body.get("path", "")
            target = (PROJECT_ROOT / rel).resolve()
            if not str(target).startswith(str(IMAGES_DIR.resolve())) or not target.is_file():
                self._send_json({"error": "Недопустимый путь к файлу"}, 400)
                return
            target.unlink()
            build_site()
            self._send_json({"ok": True, "images": list_all_images()})
            return

        if path == "/api/rebuild":
            stats = build_site()
            self._send_json({"ok": True, "stats": stats})
            return

        if path == "/api/git-setup":
            if not find_git_exe():
                self._send_json({"error": "Git ещё не установлен на этом компьютере."}, 400)
                return
            remote_url = (body.get("remoteUrl") or "").strip()
            user_name = (body.get("userName") or "").strip()
            user_email = (body.get("userEmail") or "").strip()

            if not (PROJECT_ROOT / ".git").exists():
                code, out, err = run_git(["init", "-b", "main"])
                if code != 0:
                    run_git(["init"])
                    run_git(["checkout", "-b", "main"])

            # Use Windows native Schannel certificate store so corporate TLS works seamlessly
            if os.name == "nt":
                run_git(["config", "http.sslBackend", "schannel"])

            if user_name:
                run_git(["config", "user.name", user_name])
            if user_email:
                run_git(["config", "user.email", user_email])

            if remote_url:
                code_r, cur_r, _ = run_git(["remote", "get-url", "origin"])
                if code_r == 0 and cur_r:
                    code, out, err = run_git(["remote", "set-url", "origin", remote_url])
                else:
                    code, out, err = run_git(["remote", "add", "origin", remote_url])
                if code != 0:
                    self._send_json({"error": f"Ошибка настройки remote: {err or out}"}, 400)
                    return

            self._send_json({"ok": True, "git": get_git_status_payload()})
            return

        if path == "/api/deploy":
            if not find_git_exe():
                self._send_json({"error": "Git не найден. Установите Git для публикации."}, 400)
                return
            if not (PROJECT_ROOT / ".git").exists():
                self._send_json({"error": "Git-репозиторий ещё не инициализирован. Укажите адрес репозитория выше и нажмите «Сохранить подключение»."}, 400)
                return

            # Ensure site build in docs/ is completely fresh
            stats = build_site()

            # Ensure git identity exists locally
            _, u_name, _ = run_git(["config", "user.name"])
            _, u_email, _ = run_git(["config", "user.email"])
            if not u_name:
                run_git(["config", "user.name", "CtD20 Publisher"])
            if not u_email:
                run_git(["config", "user.email", "publisher@users.noreply.github.com"])
            if os.name == "nt":
                run_git(["config", "http.sslBackend", "schannel"])

            msg = (body.get("message") or "").strip()
            if not msg:
                msg = f"Обновление руководства C20 ({datetime.now().strftime('%Y-%m-%d %H:%M')})"

            logs: list[str] = []
            c_add, o_add, e_add = run_git(["add", "-A"])
            if c_add != 0:
                self._send_json({"error": f"Ошибка git add: {e_add or o_add}"}, 500)
                return

            _, porcelain, _ = run_git(["status", "--porcelain"])
            committed = False
            if porcelain.strip():
                c_cm, o_cm, e_cm = run_git(["commit", "-m", msg])
                logs.append(o_cm or e_cm)
                if c_cm != 0:
                    self._send_json({"error": f"Ошибка коммита: {e_cm or o_cm}", "logs": "\n".join(logs)}, 500)
                    return
                committed = True
            else:
                logs.append("Нет новых несохранённых изменений файлов — отправляем текущую ветку.")

            _, remote_url, _ = run_git(["remote", "get-url", "origin"])
            if not remote_url:
                self._send_json({
                    "error": "Коммит создан локально, но не указан адрес удалённого репозитория GitHub (origin).",
                    "logs": "\n".join(logs),
                    "git": get_git_status_payload(),
                }, 400)
                return

            _, branch, _ = run_git(["branch", "--show-current"])
            branch = branch or "main"
            # Interactive push (allow Windows Git Credential Manager window if needed!)
            git_exe = find_git_exe()
            proc = subprocess.run(
                [git_exe, "push", "-u", "origin", branch],
                cwd=str(PROJECT_ROOT),
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=180,
            )
            logs.append((proc.stdout + "\n" + proc.stderr).strip())
            if proc.returncode != 0:
                self._send_json({
                    "error": f"Ошибка отправки на GitHub (git push): {proc.stderr.strip() or proc.stdout.strip()}",
                    "logs": "\n".join(logs),
                    "git": get_git_status_payload(),
                }, 500)
                return

            git_state = get_git_status_payload()
            self._send_json({
                "ok": True,
                "committed": committed,
                "stats": stats,
                "logs": "\n".join(logs),
                "git": git_state,
            })
            return

        self._send_json({"error": "Неизвестный метод API"}, 404)


def main() -> None:
    try:
        sys.stdout.reconfigure(line_buffering=True)
    except Exception:
        pass
    parser = argparse.ArgumentParser(description="CtD20 Local Web Admin & Live Preview Server")
    parser.add_argument("--port", type=int, default=8080, help="HTTP port (default: 8080)")
    parser.add_argument("--no-browser", action="store_true", help="Do not auto-open browser")
    args = parser.parse_args()

    mimetypes.add_type("image/webp", ".webp")
    stats = build_site()
    url_site = f"http://127.0.0.1:{args.port}/"
    url_admin = f"http://127.0.0.1:{args.port}/admin"

    print("=" * 66)
    print("  Changeling: The Dreaming 20th — Студия и Предпросмотр")
    print(f"  Собрано томов: {stats['volumes']} (готово: {stats['ready']}) | Китов: {stats['kiths']} | Лексикон: {stats['lexicon']}")
    print(f"  -> Сайт книги:   {url_site}")
    print(f"  -> Веб-Админка:  {url_admin}")
    print("=" * 66)

    server = ThreadingHTTPServer(("127.0.0.1", args.port), AdminRequestHandler)
    if not args.no_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url_admin)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nОстановка сервера...")
        server.server_close()


if __name__ == "__main__":
    main()
