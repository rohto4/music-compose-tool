#!/usr/bin/env python3
"""Dependency-free checks for the Phase 0 design comparison prototypes."""

from __future__ import annotations

import re
import sys
from math import cos, pi, sin
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROTOTYPES = ROOT / "docs" / "design" / "prototypes"
PAGES = [
    PROTOTYPES / "hallmark" / "index.html",
    PROTOTYPES / "pastel-patchboard" / "index.html",
]


class PrototypeHtmlParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: set[str] = set()
        self.links: list[str] = []
        self.scripts: list[str] = []
        self.lang: str | None = None
        self.viewport = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "html":
            self.lang = values.get("lang")
        if tag == "meta" and values.get("name") == "viewport":
            self.viewport = True
        if values.get("id"):
            self.ids.add(values["id"] or "")
        if tag == "link" and values.get("href"):
            self.links.append(values["href"] or "")
        if tag == "script" and values.get("src"):
            self.scripts.append(values["src"] or "")


def check(condition: bool, message: str, failures: list[str]) -> None:
    if condition:
        print(f"PASS {message}")
    else:
        failures.append(message)
        print(f"FAIL {message}")


def local_target(page: Path, reference: str) -> Path | None:
    if reference.startswith(("http://", "https://", "#", "data:")):
        return None
    return (page.parent / reference.split("?", 1)[0].split("#", 1)[0]).resolve()


def braces_are_balanced(text: str) -> bool:
    without_comments = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    without_strings = re.sub(r'(["\']).*?(?<!\\)\1', "", without_comments, flags=re.S)
    depth = 0
    for char in without_strings:
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth < 0:
                return False
    return depth == 0


def parse_oklch_tokens(text: str) -> dict[str, tuple[float, float, float]]:
    tokens: dict[str, tuple[float, float, float]] = {}
    pattern = re.compile(r"--(color-[\w-]+):\s*oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)")
    for name, lightness, chroma, hue in pattern.findall(text):
        tokens[name] = (float(lightness) / 100, float(chroma), float(hue))
    return tokens


def relative_luminance(oklch: tuple[float, float, float]) -> float:
    lightness, chroma, hue = oklch
    angle = hue * pi / 180
    a = chroma * cos(angle)
    b = chroma * sin(angle)
    l_ = lightness + 0.3963377774 * a + 0.2158037573 * b
    m_ = lightness - 0.1055613458 * a - 0.0638541728 * b
    s_ = lightness - 0.0894841775 * a - 1.291485548 * b
    l_value, m_value, s_value = l_**3, m_**3, s_**3
    red = 4.0767416621 * l_value - 3.3077115913 * m_value + 0.2309699292 * s_value
    green = -1.2684380046 * l_value + 2.6097574011 * m_value - 0.3413193965 * s_value
    blue = -0.0041960863 * l_value - 0.7034186147 * m_value + 1.707614701 * s_value
    red, green, blue = (max(0, min(1, value)) for value in (red, green, blue))
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue


def contrast_ratio(first: tuple[float, float, float], second: tuple[float, float, float]) -> float:
    luminances = sorted((relative_luminance(first), relative_luminance(second)), reverse=True)
    return (luminances[0] + 0.05) / (luminances[1] + 0.05)


def main() -> int:
    failures: list[str] = []
    parsed_pages: list[PrototypeHtmlParser] = []

    for page in PAGES:
        parser = PrototypeHtmlParser()
        parser.feed(page.read_text(encoding="utf-8"))
        parsed_pages.append(parser)
        label = page.parent.name
        check(parser.lang == "ja", f"{label}: lang=ja", failures)
        check(parser.viewport, f"{label}: viewport meta", failures)
        check("app" in parser.ids, f"{label}: #app mount", failures)
        check(
            parser.scripts == ["../shared/prototype-data.js", "../shared/workbench.js"],
            f"{label}: shared data and interaction scripts",
            failures,
        )
        for reference in parser.links + parser.scripts:
            target = local_target(page, reference)
            if target is not None:
                check(target.exists(), f"{label}: local reference exists: {reference}", failures)

    check(
        parsed_pages[0].scripts == parsed_pages[1].scripts,
        "comparison pages use identical behavior entrypoints",
        failures,
    )

    css_files = sorted(PROTOTYPES.rglob("*.css")) + [ROOT / "tokens.css"]
    for css_path in css_files:
        text = css_path.read_text(encoding="utf-8")
        check(braces_are_balanced(text), f"CSS braces: {css_path.relative_to(ROOT)}", failures)

    hallmark_css = (PROTOTYPES / "hallmark" / "theme.css").read_text(encoding="utf-8")
    hallmark_tokens = (ROOT / "tokens.css").read_text(encoding="utf-8")
    shared_css = (PROTOTYPES / "shared" / "workbench.css").read_text(encoding="utf-8")
    hallmark_surface = hallmark_css + "\n" + shared_css
    check(
        hallmark_css.splitlines()[0].startswith("/* Hallmark · macrostructure: Workbench"),
        "Hallmark CSS starts with macrostructure stamp",
        failures,
    )
    check("pre-emit critique" in hallmark_css.splitlines()[1], "Hallmark pre-emit critique stamp", failures)
    check("overflow-x: clip" in shared_css, "root overflow clipping is declared", failures)
    check("prefers-reduced-motion: reduce" in shared_css, "reduced motion fallback", failures)
    check(":focus-visible" in shared_css, "visible keyboard focus rule", failures)
    check("min-height: 3rem" in shared_css, "coarse-pointer touch target floor", failures)
    check("transition-all" not in hallmark_surface and "transition: all" not in hallmark_surface, "no transition-all", failures)
    check("#000" not in hallmark_surface and "#fff" not in hallmark_surface.lower(), "no pure hex extremes", failures)
    check(not re.search(r"\b(?:rgb|hsl)\(", hallmark_surface), "no RGB/HSL in Hallmark CSS", failures)
    check("transparent" not in hallmark_surface, "Hallmark CSS uses tokenized clear colour", failures)
    check("background-clip: text" not in hallmark_surface, "no gradient text", failures)
    check("100vw" not in hallmark_surface and "100vh" not in hallmark_surface, "no unsafe viewport widths/heights", failures)

    token_color_values = re.findall(r"--color-[\w-]+:\s*([^;]+);", hallmark_tokens)
    check(bool(token_color_values), "Hallmark color tokens found", failures)
    check(all(value.strip().startswith("oklch(") for value in token_color_values), "Hallmark color tokens use OKLCH", failures)

    contrast_pairs = [
        ("color-ink", "color-paper", 4.5),
        ("color-ink-2", "color-paper", 4.5),
        ("color-muted", "color-paper", 4.5),
        ("color-muted", "color-paper-2", 4.5),
        ("color-muted", "color-paper-3", 4.5),
        ("color-accent-ink", "color-accent", 4.5),
        ("color-ink", "color-accent-2-soft", 4.5),
        ("color-ink", "color-accent-3-soft", 4.5),
        ("color-ink", "color-lavender-soft", 4.5),
        ("color-ink", "color-mint-soft", 4.5),
        ("color-error", "color-error-soft", 4.5),
        ("color-success", "color-success-soft", 4.5),
        ("color-focus", "color-paper", 3.0),
    ]
    for palette_path in [ROOT / "tokens.css", PROTOTYPES / "pastel-patchboard" / "tokens.css"]:
        palette = parse_oklch_tokens(palette_path.read_text(encoding="utf-8"))
        for foreground, background, minimum in contrast_pairs:
            ratio = contrast_ratio(palette[foreground], palette[background])
            check(
                ratio >= minimum,
                f"contrast {palette_path.parent.name}/{foreground} on {background}: {ratio:.2f}:1 >= {minimum:.1f}:1",
                failures,
            )

    js_text = (PROTOTYPES / "shared" / "workbench.js").read_text(encoding="utf-8")
    data_text = (PROTOTYPES / "shared" / "prototype-data.js").read_text(encoding="utf-8")
    blocked_runtime_calls = ["fetch(", "XMLHttpRequest", "WebSocket", "navigator.mediaDevices", "window.open("]
    check(
        not any(call in js_text for call in blocked_runtime_calls),
        "prototype has no network, real microphone, or popup call",
        failures,
    )
    check("操作可能なfake prototype" not in js_text and "比較用の架空データ" not in js_text, "development-only prototype copy is not persistently visible", failures)
    check('data-action="flow"' in js_text and "arrangementAssets" in data_text, "arrangement assets are selectable", failures)
    check('data-role="${section.role' in js_text and "data-tone=\"${section.tone}" not in js_text, "arrangement roles use neutral frame semantics instead of section colours", failures)
    check("workspaceNavMarkup" in js_text and 'id: "setup"' in js_text and "projectSetupMarkup" in js_text, "Pastel has a project-foundation workspace before sound assembly", failures)
    check('id="new-project-key"' in js_text and 'id="new-project-bpm"' in js_text and "ai-project-context" in js_text, "project-wide settings start at creation and are automatically summarized for AI", failures)
    check('data-action="ai-prompt"' in js_text and 'data-action="ai-range"' in js_text, "AI-specific prompt and generation range stay in the AI panel", failures)
    check('1/16T' in js_text and '1/32' in js_text and "BAR_TICKS" in js_text, "detail phase exposes PPQ triplet and 32nd-note editing", failures)
    check('data-editor-canvas' in js_text and 'getContext("2d"' in js_text and "devicePixelRatio" in js_text, "whole-song high-DPI Canvas editor exists", failures)
    check("setPointerCapture" in js_text and '? "resize" : "move"' in js_text and 'addEventListener("dblclick"' in js_text, "Canvas notes support pointer drag, resize, and double-click add", failures)
    check('data-action="editor-scroll"' in js_text and 'data-action="editor-zoom"' in js_text and "visibleNotes" in js_text, "Canvas editor has viewport zoom, scroll, and visible-note culling", failures)
    check("sectionTemplates" in data_text and 'role: "bridge"' in data_text and "data-drag-section" in js_text, "arrangement supports Bridge, template insertion, and pointer reordering", failures)
    check('data-action="humming-section"' in js_text and "getHummingRegionStartTick" in js_text and "applyHummingCapture" in js_text, "humming is inserted into a selected song range", failures)
    check("playAssetPreview" in js_text and 'data-action="audition"' in js_text, "one-tap asset timbre audition exists", failures)
    check("projectHomeMarkup" in js_text and 'data-value="humming"' in js_text, "project shelf and humming-first creation entry exist", failures)
    check(all(state in js_text for state in ['humming = "ready"', 'humming = "listening"', 'humming = "analyzing"', 'humming = "captured"']), "humming journey covers ready, recording, analysis, and note states", failures)
    check("modelRoutesMarkup" in js_text and "capability router" in js_text, "capability model disclosure without model picker", failures)
    check("helpMarkup" in js_text and '${isPastel ? "" : stateLabMarkup()}' in js_text, "Pastel state lab is help-only", failures)
    check("AudioContext" in js_text and "schedulePreviewStep" in js_text, "click-started local Web Audio preview exists", failures)
    check(data_text.count('label: "') >= 10, "expanded asset and track labels are present", failures)

    if failures:
        print(f"\n{len(failures)} design prototype check(s) failed.")
        return 1
    print("\nPASS design prototype static gate")
    return 0


if __name__ == "__main__":
    sys.exit(main())
