#!/usr/bin/env python3
"""
Changeling: The Dreaming 20th — Static Site Builder (tools/build.py)
Zero external dependencies (Python 3.10+ stdlib only).
Builds content/ + assets/ -> docs/ ready for GitHub Pages.
"""
from __future__ import annotations

import html
import json
import os
import re
import shutil
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = PROJECT_ROOT / "content"
ASSETS_DIR = PROJECT_ROOT / "assets"
DOCS_DIR = PROJECT_ROOT / "docs"


def hex_to_rgb(hex_str: str) -> str:
    clean = (hex_str or "#d8b979").strip().lstrip("#")
    if len(clean) != 6:
        return "216, 185, 121"
    r, g, b = int(clean[0:2], 16), int(clean[2:4], 16), int(clean[4:6], 16)
    return f"{r}, {g}, {b}"


def resolve_rel_asset(src: str, root_prefix: str) -> str:
    if not src:
        return ""
    if re.match(r"^(https?:|data:|/)", src):
        return src
    return root_prefix + src.lstrip("./")


def format_inline(text: str, root_prefix: str = "./") -> str:
    """Convert inline Markdown (images, links, bold, italic, code) into HTML."""
    escaped = html.escape(text, quote=False)

    # Inline images (if placed inside a line)
    def repl_img(m: re.Match) -> str:
        alt_raw = m.group(1).strip()
        src_raw = m.group(2).strip()
        style_cls = ""
        caption = alt_raw
        for prefix in ("arch:", "right:", "left:", "wide:"):
            if alt_raw.lower().startswith(prefix):
                style_cls = f" style-{prefix[:-1]}"
                caption = alt_raw[len(prefix):].strip()
                break
        url = html.escape(resolve_rel_asset(src_raw, root_prefix), quote=True)
        cap_esc = html.escape(caption, quote=True)
        cap_html = f"<figcaption>{caption}</figcaption>" if caption else ""
        return (
            f'<figure class="nouveau-figure{style_cls}">'
            f'<div class="nouveau-figure-frame">'
            f'<img src="{url}" alt="{cap_esc}" data-lightbox="{url}" data-caption="{cap_esc}" loading="lazy" />'
            f"</div>{cap_html}</figure>"
        )

    escaped = re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", repl_img, escaped)

    # Links [label](url)
    def repl_link(m: re.Match) -> str:
        label = m.group(1)
        href = m.group(2).strip()
        if not re.match(r"^(https?:|mailto:|#|/)", href):
            href = root_prefix + href.lstrip("./")
        return f'<a href="{html.escape(href, quote=True)}" class="text-[#f0dba8] underline decoration-[#d8b979]/60 hover:decoration-[#f0dba8]">' f"{label}</a>"

    escaped = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", repl_link, escaped)

    # Code spans
    escaped = re.sub(
        r"`([^`]+)`",
        r'<code class="px-1.5 py-0.5 rounded bg-[#0b110f] border border-[#d8b979]/25 text-[#f0dba8] text-[0.85em]">\1</code>',
        escaped,
    )
    # Bold + Italic
    escaped = re.sub(r"\*\*\*(.+?)\*\*\*", r"<strong><em>\1</em></strong>", escaped)
    escaped = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", escaped)
    escaped = re.sub(r"\*(.+?)\*", r"<em>\1</em>", escaped)
    return escaped


def render_markdown(md_text: str, root_prefix: str = "./", apply_drop_cap: bool = True) -> tuple[str, list[dict], list[dict]]:
    """
    Convert chapter Markdown into HTML, returning:
      (html_str, toc_headings, search_sections)
    Supports:
      - ## / ### / #### headings
      - :::lore / :::mechanics / :::sidebar Title blocks
      - {{widget:kiths-gallery}}, {{widget:tempers}}, {{widget:cantrip}}
      - Standalone image figures ![style:Caption](path)
      - Tables | col | col |
      - Nested bullet & ordered lists
      - Blockquotes > ...
      - Botanical dividers ---
    """
    lines = md_text.replace("\r\n", "\n").split("\n")
    out: list[str] = []
    toc: list[dict] = []
    search_chunks: list[dict] = []

    current_sec_title = "Введение"
    current_sec_id = ""
    current_sec_text: list[str] = []
    sec_counter = 0
    drop_cap_used = not apply_drop_cap

    def flush_search() -> None:
        nonlocal current_sec_text
        joined = re.sub(r"\s+", " ", " ".join(current_sec_text)).strip()
        if joined:
            search_chunks.append({
                "title": current_sec_title,
                "anchor": f"#{current_sec_id}" if current_sec_id else "",
                "text": joined[:900],
            })
        current_sec_text = []

    i = 0
    n = len(lines)

    while i < n:
        raw = lines[i]
        stripped = raw.strip()

        if not stripped:
            i += 1
            continue

        # Widget directives
        if stripped == "{{widget:kiths-gallery}}":
            out.append('<div id="kiths-widget-mount" class="no-lex"></div>')
            i += 1
            continue
        if stripped == "{{widget:houses-gallery}}":
            out.append('<div id="houses-widget-mount" class="no-lex"></div>')
            i += 1
            continue
        if stripped == "{{widget:legacies-mirror}}":
            out.append('<div id="legacies-widget-mount" class="no-lex"></div>')
            i += 1
            continue
        if stripped == "{{widget:thresholds-compass}}":
            out.append('<div id="thresholds-widget-mount" class="no-lex"></div>')
            i += 1
            continue
        if stripped == "{{widget:tempers}}":
            out.append('<div id="tempers-widget-mount" class="no-lex"></div>')
            i += 1
            continue
        if stripped == "{{widget:cantrip}}":
            out.append('<div id="cantrip-widget-mount" class="no-lex"></div>')
            i += 1
            continue

        # Custom fenced callouts :::lore / :::mechanics / :::sidebar Title
        if stripped.startswith(":::"):
            header = stripped[3:].strip()
            block_lines: list[str] = []
            i += 1
            while i < n and not lines[i].strip().startswith(":::"):
                block_lines.append(lines[i])
                i += 1
            i += 1  # skip closing :::
            inner_html, _, _ = render_markdown("\n".join(block_lines), root_prefix=root_prefix, apply_drop_cap=False)
            if header.lower().startswith("lore"):
                out.append(f'<div class="callout-lore lore-only space-y-3">{inner_html}</div>')
            elif header.lower().startswith("mechanics"):
                out.append(
                    f'<div class="callout-mechanics space-y-3">'
                    f'<div class="text-[11px] uppercase tracking-[0.2em] text-[#d8b979] font-semibold">✦ Игровая механика</div>'
                    f"{inner_html}</div>"
                )
            elif header.lower().startswith("sidebar"):
                sb_title = header[7:].strip() or "На полях Грёзы"
                out.append(
                    f'<aside class="callout-sidebar space-y-3">'
                    f'<h4 class="font-nouveau text-xl font-semibold text-[#f0dba8] !mt-0">{html.escape(sb_title)}</h4>'
                    f"{inner_html}</aside>"
                )
            else:
                out.append(f'<div class="nouveau-panel p-5 space-y-3">{inner_html}</div>')
            continue

        # Horizontal rule -> Botanical Divider
        if re.match(r"^(\*{3,}|-{3,}|_{3,})$", stripped):
            out.append(
                '<div class="botanical-divider my-8" aria-hidden="true">'
                '<svg class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.2">'
                '<path d="M10 2 L12.5 7.5 L18 10 L12.5 12.5 L10 18 L7.5 12.5 L2 10 L7.5 7.5 Z"/></svg></div>'
            )
            i += 1
            continue

        # Headings
        m_h = re.match(r"^(#{1,4})\s+(.+)$", stripped)
        if m_h:
            level = len(m_h.group(1))
            if level == 1:
                level = 2
            title_raw = m_h.group(2).strip()
            clean_title = re.sub(r"\*+", "", title_raw)
            flush_search()
            sec_counter += 1
            sec_id = f"sec-{sec_counter}"
            current_sec_title = clean_title
            current_sec_id = sec_id
            if level in (2, 3):
                toc.append({"id": sec_id, "title": clean_title, "level": level})
            out.append(f'<h{level} id="{sec_id}">{format_inline(title_raw, root_prefix)}</h{level}>')
            i += 1
            continue

        # Standalone Image Figure
        m_img = re.match(r"^!\[([^\]]*)\]\(([^)]+)\)$", stripped)
        if m_img:
            out.append(format_inline(stripped, root_prefix))
            i += 1
            continue

        # Markdown Table
        if stripped.startswith("|") and stripped.endswith("|"):
            tbl_lines: list[str] = []
            while i < n:
                s_row = lines[i].strip()
                if not s_row:
                    # Peek ahead in case blank lines separatedocx table rows
                    if i + 1 < n and lines[i + 1].strip().startswith("|"):
                        i += 1
                        continue
                    break
                if s_row.startswith("|"):
                    tbl_lines.append(s_row)
                    i += 1
                else:
                    break

            rows_parsed = []
            for tl in tbl_lines:
                cells = [c.strip() for c in re.split(r"(?<!\\)\|", tl)[1:-1]]
                if cells and all(re.match(r"^:?-{2,}:?$", c) for c in cells):
                    continue
                rows_parsed.append([c.replace("\\|", "|") for c in cells])

            if rows_parsed:
                head = rows_parsed[0]
                body = rows_parsed[1:]
                th_html = "".join(f"<th>{format_inline(c, root_prefix)}</th>" for c in head)
                tb_html = "".join(
                    "<tr>" + "".join(f"<td>{format_inline(c, root_prefix)}</td>" for c in r) + "</tr>"
                    for r in body
                )
                out.append(
                    f'<div class="nouveau-table-wrap"><table class="nouveau-table">'
                    f"<thead><tr>{th_html}</tr></thead><tbody>{tb_html}</tbody></table></div>"
                )
                current_sec_text.extend(" ".join(r) for r in rows_parsed)
            continue

        # Blockquote
        if stripped.startswith(">"):
            q_lines: list[str] = []
            while i < n and lines[i].strip().startswith(">"):
                q_lines.append(lines[i].strip().lstrip(">").strip())
                i += 1
            q_txt = " ".join(q_lines)
            current_sec_text.append(q_txt)
            out.append(f"<blockquote>{format_inline(q_txt, root_prefix)}</blockquote>")
            continue

        # Unordered List (supports indented nested sub-bullets)
        if re.match(r"^[-*]\s+", stripped):
            items_html: list[str] = []
            while i < n:
                line_cur = lines[i]
                s_cur = line_cur.strip()
                if not s_cur:
                    if i + 1 < n and re.match(r"^\s*[-*]\s+", lines[i + 1]):
                        i += 1
                        continue
                    break
                m_li = re.match(r"^(\s*)[-*]\s+(.+)$", line_cur)
                if not m_li:
                    break
                indent = len(m_li.group(1))
                content_li = m_li.group(2).strip()
                current_sec_text.append(re.sub(r"\*+", "", content_li))
                if indent >= 2 and items_html:
                    # Append nested ul into previous item
                    prev = items_html.pop()
                    if prev.endswith("</ul></li>"):
                        prev = prev[:-10] + f"<li>{format_inline(content_li, root_prefix)}</li></ul></li>"
                    else:
                        prev = prev[:-5] + f'<ul class="mt-2">{f"<li>{format_inline(content_li, root_prefix)}</li>"}</ul></li>'
                    items_html.append(prev)
                else:
                    items_html.append(f"<li>{format_inline(content_li, root_prefix)}</li>")
                i += 1
            out.append(f"<ul>{''.join(items_html)}</ul>")
            continue

        # Ordered List
        if re.match(r"^\d+\.\s+", stripped):
            ol_items: list[str] = []
            while i < n:
                s_cur = lines[i].strip()
                if not s_cur:
                    if i + 1 < n and re.match(r"^\d+\.\s+", lines[i + 1].strip()):
                        i += 1
                        continue
                    break
                m_ol = re.match(r"^\d+\.\s+(.+)$", s_cur)
                if not m_ol:
                    break
                c_ol = m_ol.group(1).strip()
                current_sec_text.append(re.sub(r"\*+", "", c_ol))
                ol_items.append(f"<li>{format_inline(c_ol, root_prefix)}</li>")
                i += 1
            out.append(f"<ol>{''.join(ol_items)}</ol>")
            continue

        # Regular Paragraph
        para_lines = [stripped]
        i += 1
        while i < n:
            nxt = lines[i].strip()
            if (
                not nxt
                or nxt.startswith("#")
                or nxt.startswith("|")
                or nxt.startswith(">")
                or nxt.startswith(":::")
                or nxt.startswith("{{widget:")
                or re.match(r"^[-*]\s+", nxt)
                or re.match(r"^\d+\.\s+", nxt)
                or re.match(r"^!\[", nxt)
            ):
                break
            para_lines.append(nxt)
            i += 1

        para_raw = " ".join(para_lines)
        current_sec_text.append(re.sub(r"\*+", "", para_raw))

        # Parenthetical italic notes -> subtle parchment note
        if para_raw.startswith("*(") and para_raw.endswith(")*"):
            out.append(f'<p class="text-xs sm:text-sm text-[#a69f90]">{format_inline(para_raw, root_prefix)}</p>')
        elif not drop_cap_used and len(para_raw) > 80 and re.match(r"^[А-ЯЁA-Z]", para_raw):
            drop_cap_used = True
            first_ch = html.escape(para_raw[0])
            rest_html = format_inline(para_raw[1:], root_prefix)
            out.append(f'<p class="clearfix"><span class="drop-cap" aria-hidden="true">{first_ch}</span>{rest_html}</p>')
        else:
            out.append(f"<p>{format_inline(para_raw, root_prefix)}</p>")

    flush_search()
    return "\n".join(out), toc, search_chunks


def status_badge_html(status: str) -> str:
    if status == "ready":
        return '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-[#d8b979]/60 bg-[#d8b979]/18 text-[#f0dba8]">✦ Открыто</span>'
    if status == "in_progress":
        return '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-[#4b9aa8]/60 bg-[#4b9aa8]/18 text-[#9ad9e5]">◐ Пишется</span>'
    return '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-[#d8b979]/22 bg-[#0b110f]/60 text-[#a69f90]">◇ В туманах Грёзы</span>'


def render_shell(
    *,
    page_title: str,
    root_prefix: str,
    aura_hex: str,
    active_slug: str,
    main_html: str,
    volumes: list[dict],
    site_meta: dict,
) -> str:
    aura_rgb = hex_to_rgb(aura_hex)
    vol_drawer_items = "\n".join(
        f"""
        <a href="{root_prefix}{v['slug']}/index.html"
           class="flex items-start justify-between gap-3 p-3 rounded-xl border transition {
             'border-[#f0dba8]/70 bg-[#d8b979]/15' if v['slug'] == active_slug else 'border-[#d8b979]/20 bg-[#0b110f]/55 hover:border-[#d8b979]/55'
           }">
          <div>
            <div class="text-[11px] uppercase tracking-wider text-[#d8b979]">{html.escape(v['part'])}</div>
            <div class="font-nouveau text-lg font-semibold text-[#f0eadc] leading-snug">{html.escape(v['title'])}</div>
            <div class="text-xs text-[#a69f90] mt-0.5 line-clamp-1">{html.escape(v['summary'])}</div>
          </div>
          <div class="shrink-0 mt-0.5">{status_badge_html(v['status'])}</div>
        </a>
        """
        for v in volumes
    )

    return f"""<!DOCTYPE html>
<html lang="ru" data-root="{root_prefix}" style="--aura-hex: {aura_hex}; --aura-rgb: {aura_rgb};">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{html.escape(page_title)} — {html.escape(site_meta['title'])}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {{
      theme: {{
        extend: {{
          fontFamily: {{
            serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
            sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
          }},
        }},
      }},
    }};
  </script>
  <link rel="stylesheet" href="{root_prefix}assets/css/nouveau.css" />
</head>
<body class="antialiased selection:bg-[#d8b979]/25 selection:text-[#f0dba8]">
  <div class="velvet-grain" aria-hidden="true"></div>
  <div class="ambient-aura" aria-hidden="true"></div>

  <!-- FLOATING GLASSMORPHIC TOP NAVIGATION BAR -->
  <header class="no-print sticky top-0 z-50 border-b border-[#d8b979]/25 backdrop-blur-md bg-[#0b110f]/85">
    <div class="max-w-6xl mx-auto px-3.5 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
      <a href="{root_prefix}index.html" class="flex items-center gap-2.5 group shrink-0">
        <span class="w-8 h-8 rounded-full border border-[#d8b979]/55 bg-[#15211d] flex items-center justify-center transition group-hover:border-[#f0dba8]">
          <svg class="w-4 h-4 text-[#d8b979]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 3C8.5 6.2 6.5 9.8 6.5 13.5a5.5 5.5 0 0 0 11 0C17.5 9.8 15.5 6.2 12 3Z"/>
            <path d="M12 7v12M12 12.5l3-2.5M12 15l-3-2"/>
          </svg>
        </span>
        <span class="font-nouveau text-lg sm:text-xl font-semibold tracking-wide text-[#f0eadc]">
          CtD 20 <span class="text-[#d8b979]">· Книга игрока</span>
        </span>
      </a>

      <nav class="order-3 lg:order-2 w-full lg:w-auto flex items-center justify-center gap-1 sm:gap-1.5 pt-1.5 lg:pt-0 border-t border-[#d8b979]/15 lg:border-none text-xs sm:text-[13px] overflow-x-auto">
        <button type="button" data-open-volumes class="px-3 py-1 rounded-full text-[#f0eadc] hover:text-[#f0dba8] hover:bg-[#d8b979]/12 border border-[#d8b979]/25 transition shrink-0">
          ☰ Оглавление
        </button>
        <a href="{root_prefix}01-world-and-creation/index.html" class="px-2.5 py-1 rounded-full transition shrink-0 {'text-[#f0dba8] bg-[#d8b979]/15' if active_slug=='01-world-and-creation' else 'text-[#a69f90] hover:text-[#f0dba8]'}">Пробуждение</a>
        <a href="{root_prefix}02-kiths/index.html" class="px-2.5 py-1 rounded-full transition shrink-0 {'text-[#f0dba8] bg-[#d8b979]/15' if active_slug=='02-kiths' else 'text-[#a69f90] hover:text-[#f0dba8]'}">Арканы Китов</a>
        <a href="{root_prefix}03-noble-houses/index.html" class="px-2.5 py-1 rounded-full transition shrink-0 {'text-[#f0dba8] bg-[#d8b979]/15' if active_slug=='03-noble-houses' else 'text-[#a69f90] hover:text-[#f0dba8]'}">Дома</a>
        <a href="{root_prefix}04-legacies-thresholds/index.html" class="px-2.5 py-1 rounded-full transition shrink-0 {'text-[#f0dba8] bg-[#d8b979]/15' if active_slug=='04-legacies-thresholds' else 'text-[#a69f90] hover:text-[#f0dba8]'}">Наследия</a>
        <a href="{root_prefix}lexicon/index.html" class="px-2.5 py-1 rounded-full transition shrink-0 {'text-[#f0dba8] bg-[#d8b979]/15' if active_slug=='lexicon' else 'text-[#a69f90] hover:text-[#f0dba8]'}">Лексикон</a>
      </nav>

      <div class="order-2 lg:order-3 flex items-center gap-1.5 shrink-0">
        <button type="button" data-open-search class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs border border-[#d8b979]/30 bg-[#101916]/90 text-[#a69f90] hover:text-[#f0dba8] hover:border-[#d8b979]/70 transition" title="Быстрый поиск по всей книге (Ctrl+K)">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <span class="hidden sm:inline">Поиск</span>
          <kbd class="hidden md:inline text-[10px] px-1.5 py-0.2 rounded bg-[#0b110f] border border-[#d8b979]/25 text-[#7b7669]">Ctrl+K</kbd>
        </button>

        <button type="button" id="btn-depth-toggle" class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border border-[#d8b979]/30 bg-[#15211d]/90 text-[#f0eadc] hover:border-[#d8b979] transition" title="Скрыть художественные описания и оставить только механику">
          <span id="depth-dot" class="w-1.5 h-1.5 rounded-full bg-[#d8b979]"></span>
          <span id="depth-text">Лор + Правила</span>
        </button>

        <button type="button" id="btn-sheet-toggle" class="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border border-[#d8b979]/30 bg-[#101916]/90 text-[#a69f90] hover:text-[#f0dba8] hover:border-[#d8b979]/75 transition" title="Переключить десктопные тултипы в режим мобильной шторки">
          <span id="sheet-text">Тест шторки</span>
        </button>

        <button type="button" onclick="window.print()" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border border-[#d8b979]/55 bg-[#d8b979]/15 text-[#f0dba8] hover:bg-[#d8b979]/25 transition" title="Печать страницы или сохранение в PDF">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M6 9V4h12v5M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/></svg>
          <span class="hidden sm:inline">PDF</span>
        </button>
      </div>
    </div>
  </header>

  {main_html}

  <!-- PRINT-ONLY LEXICON APPENDIX -->
  <section class="print-only max-w-5xl mx-auto px-6 pt-5 mt-8 border-t-2 border-[#8c703b]" style="page-break-before: always;">
    <h2 class="font-nouveau text-2xl font-bold mb-3">Единый Лексикон (Changeling: The Dreaming 20th)</h2>
    <div id="print-lexicon-container" class="print-lex-cols"></div>
  </section>

  <footer class="no-print border-t border-[#d8b979]/15 py-8 text-center text-xs text-[#7b7669] px-4 mt-14">
    <p class="font-nouveau text-base text-[#a69f90]">{html.escape(site_meta['title'])} · {html.escape(site_meta['subtitle'])}</p>
    <p class="mt-1">Некоммерческий фанатский справочник и перевод правил C20 в оформлении «Ар-Нуво и Золото».</p>
  </footer>

  <!-- DESKTOP CHAINED GLOSSARY POPOVER -->
  <div id="desktop-popover" class="no-print" role="dialog" aria-label="Карточка термина">
    <div class="relative z-10 p-4 sm:p-5 space-y-2.5">
      <div class="flex items-center justify-between gap-2 pb-2 border-b border-[#d8b979]/20">
        <div id="pop-breadcrumbs" class="flex items-center gap-1 overflow-x-auto text-[11px] text-[#a69f90] pr-1"></div>
        <div class="flex items-center gap-1 shrink-0">
          <button type="button" id="pop-pin-btn" class="px-2 py-0.5 rounded-full text-[11px] border border-[#d8b979]/35 text-[#a69f90] hover:text-[#f0dba8] transition">Закрепить</button>
          <button type="button" data-close-pop class="w-6 h-6 rounded-full border border-[#d8b979]/30 text-[#a69f90] hover:text-[#f0eadc] flex items-center justify-center text-xs transition" aria-label="Закрыть">✕</button>
        </div>
      </div>
      <div id="pop-content" class="space-y-1.5"></div>
    </div>
  </div>

  <!-- MOBILE / TEST BOTTOM SHEET -->
  <div id="sheet-backdrop" class="no-print" data-close-sheet></div>
  <div id="bottom-sheet" class="no-print" role="dialog" aria-modal="true" aria-label="Справочник терминов">
    <div class="flex justify-center pt-3 pb-1.5 cursor-pointer" data-close-sheet>
      <span class="w-11 h-1 rounded-full bg-[#d8b979]/45"></span>
    </div>
    <div class="px-4 pb-2.5 border-b border-[#d8b979]/20 flex items-center justify-between gap-2">
      <div id="sheet-breadcrumbs" class="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5"></div>
      <button type="button" data-close-sheet class="px-2.5 py-1 rounded-full text-xs border border-[#d8b979]/35 text-[#a69f90] hover:text-[#f0eadc] shrink-0">Закрыть ✕</button>
    </div>
    <div id="sheet-content" class="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3"></div>
  </div>

  <!-- GLOBAL SEARCH MODAL (Ctrl+K) -->
  <div id="search-modal" class="modal-backdrop no-print flex items-start justify-center pt-14 sm:pt-20 px-3" data-close-search>
    <div class="nouveau-panel w-full max-w-2xl p-4 sm:p-6 space-y-4 max-h-[80vh] flex flex-col" onclick="event.stopPropagation()">
      <div class="relative z-10 flex items-center gap-2 border-b border-[#d8b979]/25 pb-3">
        <svg class="w-4 h-4 text-[#d8b979] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input id="global-search-input" type="search" placeholder="Поиск по главам, Китам, Домам, дарам и Лексикону..." class="w-full bg-transparent text-sm sm:text-base text-[#f0eadc] placeholder-[#7b7669] focus:outline-none" />
        <button type="button" data-close-search class="px-2.5 py-1 rounded-full text-xs border border-[#d8b979]/30 text-[#a69f90] hover:text-[#f0eadc]">Esc</button>
      </div>
      <div id="global-search-results" class="relative z-10 overflow-y-auto space-y-2.5 pr-1"></div>
    </div>
  </div>

  <!-- 10-VOLUME DRAWER -->
  <div id="volumes-drawer" class="modal-backdrop no-print flex justify-end" data-close-volumes>
    <div class="w-full max-w-md bg-[#101916] border-l border-[#d8b979]/35 h-full p-5 overflow-y-auto space-y-4 shadow-2xl" onclick="event.stopPropagation()">
      <div class="flex items-center justify-between border-b border-[#d8b979]/20 pb-3">
        <div>
          <div class="text-[10px] uppercase tracking-[0.22em] text-[#d8b979]">Содержание книги</div>
          <h3 class="font-nouveau text-2xl font-semibold text-[#f0eadc]">Главы Книги Игрока</h3>
        </div>
        <button type="button" data-close-volumes class="w-8 h-8 rounded-full border border-[#d8b979]/30 text-[#a69f90] hover:text-[#f0eadc]">✕</button>
      </div>
      <div class="space-y-2.5">{vol_drawer_items}</div>
    </div>
  </div>

  <!-- IMAGE LIGHTBOX -->
  <div id="lightbox-modal" class="modal-backdrop no-print flex items-center justify-center p-4" data-close-lightbox>
    <div class="max-w-4xl max-h-[90vh] flex flex-col items-center gap-3" onclick="event.stopPropagation()">
      <img id="lightbox-img" src="" alt="" class="max-h-[80vh] w-auto rounded-xl border border-[#d8b979]/55 shadow-2xl" />
      <div class="flex items-center gap-4">
        <span id="lightbox-caption" class="font-nouveau italic text-lg text-[#f0dba8]"></span>
        <button type="button" data-close-lightbox class="px-3 py-1 rounded-full text-xs border border-[#d8b979]/45 text-[#f0eadc] bg-[#0b110f]/80">Закрыть ✕</button>
      </div>
    </div>
  </div>

  <script src="{root_prefix}assets/data/bundle.js"></script>
  <script src="{root_prefix}assets/js/app.js"></script>
</body>
</html>
"""


def build_site() -> dict:
    manifest = json.loads((CONTENT_DIR / "manifest.json").read_text(encoding="utf-8"))
    lexicon = json.loads((CONTENT_DIR / "lexicon.json").read_text(encoding="utf-8"))
    kiths = json.loads((CONTENT_DIR / "kiths.json").read_text(encoding="utf-8"))
    houses_path = CONTENT_DIR / "houses.json"
    houses = json.loads(houses_path.read_text(encoding="utf-8")) if houses_path.exists() else []
    legacies_path = CONTENT_DIR / "legacies.json"
    legacies_data = json.loads(legacies_path.read_text(encoding="utf-8")) if legacies_path.exists() else {}
    legacies = legacies_data.get("legacies", [])
    thresholds = legacies_data.get("thresholds", [])

    site_meta = manifest["site"]
    volumes = manifest["volumes"]

    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    (DOCS_DIR / ".nojekyll").write_text("", encoding="utf-8")

    # Sync assets -> docs/assets
    docs_assets = DOCS_DIR / "assets"
    if docs_assets.exists():
        shutil.rmtree(docs_assets)
    shutil.copytree(ASSETS_DIR, docs_assets)
    (docs_assets / "data").mkdir(parents=True, exist_ok=True)

    all_search_entries: list[dict] = []
    ready_count = sum(1 for v in volumes if v.get("status") == "ready")

    # 1. Build each of the 10 Volume pages -> docs/<slug>/index.html
    for idx, vol in enumerate(volumes):
        slug = vol["slug"]
        md_path = CONTENT_DIR / "chapters" / vol["file"]
        raw_md = md_path.read_text(encoding="utf-8") if md_path.exists() else ""

        chapter_html, toc, search_chunks = render_markdown(
            raw_md,
            root_prefix="../",
            apply_drop_cap=(vol.get("status") == "ready" and slug != "02-kiths"),
        )

        for sc in search_chunks:
            all_search_entries.append({
                "part": vol["part"],
                "title": sc["title"],
                "text": sc["text"],
                "url": f"{slug}/index.html{sc['anchor']}",
            })

        # Word count / reading estimate
        plain_words = len(re.findall(r"\S+", raw_md))
        if slug == "02-kiths":
            plain_words += sum(len(" ".join(k.get("lore", []))) // 6 for k in kiths)
        elif slug == "03-noble-houses":
            plain_words += sum(len(" ".join(h.get("lore", []))) // 6 for h in houses)
        elif slug == "04-legacies-thresholds":
            plain_words += sum(len(l.get("desc", "")) // 6 for l in legacies)
            plain_words += sum(len(t.get("desc", "")) // 6 for t in thresholds)
        read_mins = max(2, round(plain_words / 190))

        prev_vol = volumes[idx - 1] if idx > 0 else None
        next_vol = volumes[idx + 1] if idx + 1 < len(volumes) else None

        cover_html = ""
        if vol.get("coverImage"):
            c_url = html.escape(resolve_rel_asset(vol["coverImage"], "../"), quote=True)
            cover_html = f"""
            <figure class="nouveau-figure style-arch max-w-sm mx-auto mt-6 mb-2">
              <div class="nouveau-figure-frame">
                <img src="{c_url}" alt="{html.escape(vol['title'], quote=True)}" data-lightbox="{c_url}" data-caption="{html.escape(vol['title'], quote=True)}" />
              </div>
            </figure>"""

        epigraph_html = ""
        if vol.get("epigraph"):
            auth = (
                f'<p class="text-xs text-[#a69f90] mt-1.5 tracking-wide">— {html.escape(vol["epigraphAuthor"])}</p>'
                if vol.get("epigraphAuthor")
                else ""
            )
            epigraph_html = f"""
            <div class="lore-only max-w-2xl mx-auto mt-5">
              <blockquote class="font-nouveau italic text-lg sm:text-2xl text-[#f0dba8]/95 leading-snug">
                {html.escape(vol['epigraph'])}
              </blockquote>
              {auth}
            </div>"""

        toc_links_html = "\n".join(
            f'<a href="#{item["id"]}" class="toc-link depth-{item["level"]}">{html.escape(item["title"])}</a>'
            for item in toc
        )
        sidebar_html = (
            f"""
            <aside class="no-print hidden lg:block w-64 shrink-0">
              <div class="sticky top-20 nouveau-panel p-4 space-y-2.5 max-h-[calc(100vh-6.5rem)] overflow-y-auto">
                <div class="text-[10px] uppercase tracking-[0.22em] text-[#d8b979] px-2">Содержание главы</div>
                <nav class="space-y-0.5">{toc_links_html}</nav>
              </div>
            </aside>"""
            if len(toc) >= 2
            else ""
        )

        planned_notice = ""
        if vol.get("status") != "ready":
            planned_notice = """
            <div class="nouveau-panel p-5 sm:p-6 border-[#d8b979]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div class="relative z-10 space-y-1">
                <div class="text-xs uppercase tracking-[0.2em] text-[#d8b979]">✦ Страницы скрыты Туманами</div>
                <p class="text-xs sm:text-sm text-[#a69f90]">Туманы Грёзы ещё не рассеялись над этой главой. Ниже начертано краткое содержание грядущих разделов.</p>
              </div>
            </div>"""

        nav_cards = []
        if prev_vol:
            nav_cards.append(
                f"""<a href="../{prev_vol['slug']}/index.html" class="nouveau-panel p-4 sm:p-5 hover:border-[#f0dba8]/65 transition block">
                      <div class="relative z-10 text-[11px] uppercase tracking-wider text-[#a69f90]">← {html.escape(prev_vol['part'])}</div>
                      <div class="relative z-10 font-nouveau text-xl font-semibold text-[#f0dba8] mt-1">{html.escape(prev_vol['title'])}</div>
                    </a>"""
            )
        else:
            nav_cards.append('<div></div>')

        if next_vol:
            nav_cards.append(
                f"""<a href="../{next_vol['slug']}/index.html" class="nouveau-panel p-4 sm:p-5 hover:border-[#f0dba8]/65 transition block text-right">
                      <div class="relative z-10 text-[11px] uppercase tracking-wider text-[#a69f90]">{html.escape(next_vol['part'])} →</div>
                      <div class="relative z-10 font-nouveau text-xl font-semibold text-[#f0dba8] mt-1">{html.escape(next_vol['title'])}</div>
                    </a>"""
            )

        vol_main = f"""
        <main class="max-w-6xl mx-auto px-3.5 sm:px-6 pt-6 sm:pt-10 pb-12 space-y-8">
          <div class="hidden table-mode-only no-print items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-[#d8b979]/45 bg-[#15211d]/90 text-xs text-[#f0eadc]">
            <span>✦ <strong>Режим стола:</strong> художественный лор скрыт — оставлены только механики, формулы и характеристики.</span>
            <button type="button" id="btn-restore-lore" class="text-[#f0dba8] underline shrink-0">Вернуть лор</button>
          </div>

          <section class="nouveau-hero-arch px-6 py-8 sm:px-12 sm:py-12 text-center">
            <div class="relative z-10">
              <div class="flex items-center justify-center gap-2.5 mb-3">
                <span class="text-xs uppercase tracking-[0.25em] text-[#d8b979]">{html.escape(vol['part'])}</span>
                {status_badge_html(vol.get('status', 'planned'))}
                <span class="text-xs text-[#7b7669]">· ~{read_mins} мин чтения</span>
              </div>
              <h1 class="font-nouveau fluid-hero-title font-semibold text-[#f0eadc]">{html.escape(vol['title'])}</h1>
              <p class="text-xs sm:text-sm text-[#a69f90] max-w-2xl mx-auto mt-2.5">{html.escape(vol['summary'])}</p>
              {epigraph_html}
              {cover_html}
            </div>
          </section>

          <div class="flex flex-col lg:flex-row items-start gap-7">
            {sidebar_html}
            <div class="flex-1 min-w-0 w-full">
              {planned_notice}
              <article class="nouveau-panel p-6 sm:p-10 chapter-prose auto-lex">
                <div class="relative z-10">
                  {chapter_html}
                </div>
              </article>

              <div class="no-print grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                {''.join(nav_cards)}
              </div>
            </div>
          </div>
        </main>
        """

        out_dir = DOCS_DIR / slug
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "index.html").write_text(
            render_shell(
                page_title=f"{vol['part']}. {vol['title']}",
                root_prefix="../",
                aura_hex=vol.get("auraHex", "#d8b979"),
                active_slug=slug,
                main_html=vol_main,
                volumes=volumes,
                site_meta=site_meta,
            ),
            encoding="utf-8",
        )

    # 2. Build Dedicated Lexicon Directory -> docs/lexicon/index.html
    lex_main = f"""
    <main class="max-w-5xl mx-auto px-3.5 sm:px-6 pt-6 sm:pt-10 pb-12 space-y-8">
      <section class="nouveau-hero-arch px-6 py-8 sm:px-12 sm:py-12 text-center">
        <div class="relative z-10">
          <p class="text-xs uppercase tracking-[0.26em] text-[#d8b979] mb-2">Наречие Конкордии</p>
          <h1 class="font-nouveau fluid-hero-title font-semibold text-[#f0eadc]">Лексикон Грёзы</h1>
          <p class="text-xs sm:text-sm text-[#a69f90] max-w-2xl mx-auto mt-3">
            Словарь мира Грёзы <span class="text-[#f0dba8]">(выделен золотым)</span> и памятки правил игры <span class="text-[#7be3c8]">(выделены бирюзовым)</span>. Нажимайте на подчёркнутые слова внутри карточек, чтобы переходить от понятия к понятию.
          </p>
        </div>
      </section>
      <div id="lexicon-directory-mount"></div>
    </main>
    """
    (DOCS_DIR / "lexicon").mkdir(parents=True, exist_ok=True)
    (DOCS_DIR / "lexicon" / "index.html").write_text(
        render_shell(
            page_title="Лексикон Грёзы",
            root_prefix="../",
            aura_hex="#d8b979",
            active_slug="lexicon",
            main_html=lex_main,
            volumes=volumes,
            site_meta=site_meta,
        ),
        encoding="utf-8",
    )

    # 3. Build Grand Portal -> docs/index.html
    intro_raw = site_meta["intro"]
    intro_drop = f'<span class="drop-cap" aria-hidden="true">{html.escape(intro_raw[0])}</span>{html.escape(intro_raw[1:])}'

    vol_cards_html = "\n".join(
        f"""
        <a href="{v['slug']}/index.html"
           class="nouveau-panel p-5 sm:p-6 flex flex-col justify-between gap-4 group hover:border-[#f0dba8]/70 transition"
           style="--gold-outer: rgba({hex_to_rgb(v.get('auraHex', '#d8b979'))}, 0.36);">
          <div class="relative z-10 space-y-2.5">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-semibold uppercase tracking-[0.2em]" style="color: {v.get('auraHex', '#d8b979')};">
                {html.escape(v['part'])}
              </span>
              {status_badge_html(v.get('status', 'planned'))}
            </div>
            <h3 class="font-nouveau text-2xl font-semibold text-[#f0eadc] group-hover:text-[#f0dba8] transition leading-snug">
              {html.escape(v['title'])}
            </h3>
            <p class="text-xs sm:text-[13.5px] text-[#a69f90] leading-relaxed">
              {html.escape(v['summary'])}
            </p>
          </div>
          <div class="relative z-10 pt-3 border-t border-[#d8b979]/15 flex items-center justify-between text-xs text-[#d8b979]">
            <span>{'Открыть главу' if v.get('status') == 'ready' else 'Заглянуть за завесу'}</span>
            <span class="transition-transform group-hover:translate-x-1">→</span>
          </div>
        </a>
        """
        for v in volumes
    )

    kith_strip_html = "\n".join(
        f"""
        <a href="02-kiths/index.html?kith={k['id']}#kiths-arcana"
           class="tarot-card group text-center"
           style="--card-aura: {k['auraHex']}; --card-aura-rgb: {k.get('auraRgb') or hex_to_rgb(k['auraHex'])};">
          <div class="relative z-10 w-11 h-11 rounded-full flex items-center justify-center mb-2 border transition-transform group-hover:scale-105"
               style="color: {k['auraHex']}; border-color: rgba({k.get('auraRgb') or hex_to_rgb(k['auraHex'])}, 0.5); background: rgba({k.get('auraRgb') or hex_to_rgb(k['auraHex'])}, 0.14);">
            <div class="w-7 h-7">{k.get('emblem', '')}</div>
          </div>
          <div class="relative z-10 font-nouveau text-lg font-semibold text-[#f0eadc] leading-tight">{html.escape(k['ru'])}</div>
          <div class="relative z-10 text-[10px] text-[#a69f90] mt-0.5">{html.escape(k['affinity'])}</div>
        </a>
        """
        for k in kiths
    )

    house_strip_html = "\n".join(
        f"""
        <a href="03-noble-houses/index.html?house={h['id']}#houses-arcana"
           class="tarot-card group text-center"
           style="--card-aura: {h['auraHex']}; --card-aura-rgb: {h.get('auraRgb') or hex_to_rgb(h['auraHex'])};">
          <div class="relative z-10 w-11 h-11 rounded-full flex items-center justify-center mb-2 border transition-transform group-hover:scale-105"
               style="color: {h['auraHex']}; border-color: rgba({h.get('auraRgb') or hex_to_rgb(h['auraHex'])}, 0.5); background: rgba({h.get('auraRgb') or hex_to_rgb(h['auraHex'])}, 0.14);">
            <div class="w-7 h-7">{h.get('emblem', '')}</div>
          </div>
          <div class="relative z-10 font-nouveau text-lg font-semibold text-[#f0eadc] leading-tight">{html.escape(h.get('shortRu') or h['ru'])}</div>
          <div class="relative z-10 text-[10px] text-[#a69f90] mt-0.5">{'☀ Благой' if h['court'] == 'Благой' else '☽ Неблагой'}</div>
        </a>
        """
        for h in houses
    )

    pct_ready = round((ready_count / max(1, len(volumes))) * 100)

    portal_main = f"""
    <main class="max-w-6xl mx-auto px-3.5 sm:px-6 pt-6 sm:pt-10 pb-16 space-y-14">
      <div class="hidden table-mode-only no-print items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-[#d8b979]/45 bg-[#15211d]/90 text-xs text-[#f0eadc]">
        <span>✦ <strong>Режим стола:</strong> художественный лор скрыт — оставлены только механики, формулы и характеристики.</span>
        <button type="button" id="btn-restore-lore" class="text-[#f0dba8] underline shrink-0">Вернуть лор</button>
      </div>

      <!-- HERO ARCH -->
      <section class="nouveau-hero-arch px-6 py-10 sm:px-14 sm:py-14 text-center">
        <div class="relative z-10">
          <div class="flex justify-center mb-4">
            <svg class="w-16 h-6 text-[#d8b979]" viewBox="0 0 80 28" fill="none" stroke="currentColor" stroke-width="1.1">
              <path d="M4 22 C18 22, 26 8, 40 4 C54 8, 62 22, 76 22" opacity="0.8"/>
              <circle cx="40" cy="14" r="3" fill="currentColor" opacity="0.85"/>
              <path d="M24 22 Q40 16 56 22" opacity="0.5"/>
            </svg>
          </div>

          <p class="text-[11px] sm:text-xs uppercase tracking-[0.26em] text-[#d8b979] mb-2.5">
            {html.escape(site_meta['edition'])}
          </p>

          <h1 class="font-nouveau fluid-hero-title font-semibold text-[#f0eadc] mb-5">
            {html.escape(site_meta['subtitle'])}
          </h1>

          <div class="lore-only max-w-2xl mx-auto mb-7">
            <blockquote class="font-nouveau italic text-lg sm:text-2xl text-[#f0dba8]/95 leading-snug">
              {html.escape(site_meta['epigraph'])}
            </blockquote>
            <p class="text-xs text-[#a69f90] mt-1.5 tracking-wide">
              — {html.escape(site_meta['epigraphAuthor'])}
            </p>
          </div>

          <div class="botanical-divider max-w-md mx-auto my-6 lore-only">
            <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.2">
              <path d="M10 2 L12.5 7.5 L18 10 L12.5 12.5 L10 18 L7.5 12.5 L2 10 L7.5 7.5 Z"/>
            </svg>
          </div>

          <div class="lore-only max-w-2xl mx-auto text-left text-[#f0eadc]/92 text-sm sm:text-[15.5px] leading-relaxed auto-lex">
            <p class="clearfix">{intro_drop}</p>
          </div>

          <!-- Quick Action Buttons -->
          <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="01-world-and-creation/index.html" class="px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium border border-[#f0dba8]/80 bg-[#d8b979]/22 text-[#f0dba8] hover:bg-[#d8b979]/32 transition">
              ✦ Начать с Части Первой
            </a>
            <a href="02-kiths/index.html" class="px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium border border-[#d8b979]/45 bg-[#15211d]/90 text-[#f0eadc] hover:border-[#f0dba8] transition">
              Витражные Арканы Китов
            </a>
            <a href="03-noble-houses/index.html" class="px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium border border-[#d8b979]/45 bg-[#15211d]/90 text-[#f0eadc] hover:border-[#f0dba8] transition">
              Благородные Дома
            </a>
            <a href="04-legacies-thresholds/index.html" class="px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium border border-[#d8b979]/45 bg-[#15211d]/90 text-[#f0eadc] hover:border-[#f0dba8] transition">
              Наследия и Пороги
            </a>
            <a href="lexicon/index.html" class="px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium border border-[#d8b979]/35 bg-[#0b110f]/70 text-[#a69f90] hover:text-[#f0dba8] transition">
              Лексикон Грёзы
            </a>
          </div>

          <div class="no-print mt-7 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full border border-[#d8b979]/25 bg-[#0b110f]/55 text-[11px] sm:text-xs text-[#a69f90]">
            <span class="text-[#d8b979]">✦</span>
            <span>Нажимайте на слова с <span class="text-[#f0dba8] border-b border-dotted border-[#d8b979]">золотым пунктиром</span> — внутри подсказок можно переходить по цепочке понятий дальше.</span>
          </div>
        </div>
      </section>

      <!-- 10 VOLUMES GRID -->
      <section id="volumes" class="space-y-6 scroll-mt-24">
        <div class="text-center space-y-1.5">
          <p class="text-[11px] uppercase tracking-[0.25em] text-[#d8b979]">Путеводитель по Конкордии</p>
          <h2 class="font-nouveau fluid-section-title font-semibold text-[#f0eadc]">Оглавление Книги Игрока</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {vol_cards_html}
        </div>
      </section>

      <div class="botanical-divider" aria-hidden="true">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <path d="M12 2C9 6.5 9 11 12 14C15 11 15 6.5 12 2Z"/>
          <path d="M12 14C7.5 14 4 16.5 2 20C6.5 19.5 9.5 18 12 14Z"/>
          <path d="M12 14C16.5 14 20 16.5 22 20C17.5 19.5 14.5 18 12 14Z"/>
        </svg>
      </div>

      <!-- 13 KITHS QUICK SHOWCASE -->
      <section class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <p class="text-[11px] uppercase tracking-[0.25em] text-[#d8b979]">Часть Вторая · Народы Грёзы</p>
            <h2 class="font-nouveau fluid-section-title font-semibold text-[#f0eadc]">Витражные Арканы Китов</h2>
          </div>
          <a href="02-kiths/index.html" class="text-xs text-[#f0dba8] hover:underline">Перейти к главе о Китах →</a>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
          {kith_strip_html}
        </div>
      </section>

      <!-- 14 NOBLE HOUSES QUICK SHOWCASE -->
      <section class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <p class="text-[11px] uppercase tracking-[0.25em] text-[#d8b979]">Часть Третья · Сияющее Воинство</p>
            <h2 class="font-nouveau fluid-section-title font-semibold text-[#f0eadc]">Гербовые Витражи Благородных Домов</h2>
          </div>
          <a href="03-noble-houses/index.html" class="text-xs text-[#f0dba8] hover:underline">Перейти к главе о Домах →</a>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {house_strip_html}
        </div>
      </section>

      <!-- INTERACTIVE MECHANICS PREVIEW ON PORTAL -->
      <section class="space-y-4">
        <div class="text-center space-y-1">
          <p class="text-[11px] uppercase tracking-[0.25em] text-[#d8b979]">Гармония души и плетение чар</p>
          <h2 class="font-nouveau fluid-section-title font-semibold text-[#f0eadc]">Темпераменты и Формула Кантрипа</h2>
        </div>
        <div id="tempers-widget-mount" class="no-lex"></div>
        <div id="cantrip-widget-mount" class="no-lex"></div>
      </section>
    </main>
    """

    (DOCS_DIR / "index.html").write_text(
        render_shell(
            page_title=site_meta["subtitle"],
            root_prefix="./",
            aura_hex=site_meta.get("auraHex", "#d8b979"),
            active_slug="home",
            main_html=portal_main,
            volumes=volumes,
            site_meta=site_meta,
        ),
        encoding="utf-8",
    )

    # 4. Write bundle.js for offline/static client engine
    bundle_payload = {
        "lexicon": lexicon,
        "kiths": kiths,
        "houses": houses,
        "legacies": legacies,
        "thresholds": thresholds,
        "volumes": volumes,
        "search": all_search_entries,
    }
    (docs_assets / "data" / "bundle.js").write_text(
        "window.CTD_BUNDLE = " + json.dumps(bundle_payload, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )

    return {
        "volumes": len(volumes),
        "ready": ready_count,
        "kiths": len(kiths),
        "houses": len(houses),
        "legacies": len(legacies),
        "thresholds": len(thresholds),
        "lexicon": len(lexicon),
        "searchChunks": len(all_search_entries),
    }


if __name__ == "__main__":
    stats = build_site()
    print(f"Built CtD20 site -> docs/ | {stats}")
