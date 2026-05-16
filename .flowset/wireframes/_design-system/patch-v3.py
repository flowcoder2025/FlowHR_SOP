#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WI-KI-batch-006 hotfix patcher — applies v3 sprite + ARIA patches across 20 wireframes.

Patches applied per file:
  1. Insert inline SVG sprite right after <body...> (CM uses auth sprite, OP uses shell sprite)
     - OP-01 already has sprite → skip
  2. <select> → already has class="select" across all files (verified) → skip
  3. <input type="file"> wrap with .file-input → none found in any file → skip
  4. <input type="date|datetime-local"> wrap with .date-input
     - OP-04 (2 inputs), OP-11 (2 inputs)
  5. sidebar/href — all sidebar items already have href → skip
  6. Modal ARIA attributes — file-specific modal patches

Usage: python patch-v3.py
"""
import io
import re
import sys
from pathlib import Path

# Force UTF-8 stdout
if sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

ROOT = Path(__file__).resolve().parents[2]  # .flowset/
HTML_DIR = ROOT / "wireframes" / "html"
DS_DIR = ROOT / "wireframes" / "_design-system"


def extract_sprite(layout_filename: str, start_line: int, end_line: int) -> str:
    """Extract sprite block (inclusive line range) from a layout file."""
    p = DS_DIR / layout_filename
    text = p.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)
    return "".join(lines[start_line - 1 : end_line])


SPRITE_AUTH = extract_sprite("_layout-auth.html", 29, 61)
SPRITE_SHELL = extract_sprite("_layout-shell.html", 21, 92)

# Sanity check
assert "i-globe" in SPRITE_AUTH, "Auth sprite must include i-globe"
assert "i-chevron-down" in SPRITE_SHELL, "Shell sprite must include i-chevron-down"


CM_FILES = ["CM-01", "CM-02", "CM-03", "CM-04", "CM-05", "CM-06", "CM-20", "CM-21"]
OP_FILES = ["OP-02", "OP-03", "OP-04", "OP-05", "OP-06", "OP-07", "OP-08", "OP-09",
            "OP-10", "OP-11", "OP-12"]
# OP-01 already has inline sprite, skip sprite insertion


def patch_inline_sprite(text: str, sprite: str) -> str:
    """Insert inline SVG sprite right after the opening <body ...> tag.

    Skips if file already contains the inline sprite signature.
    """
    if 'xmlns="http://www.w3.org/2000/svg" style="display:none"' in text:
        return text
    pattern = re.compile(r"(<body[^>]*>)", re.IGNORECASE)
    m = pattern.search(text)
    if not m:
        raise RuntimeError("No <body> tag found")
    insert_at = m.end()
    return text[:insert_at] + "\n\n" + sprite.rstrip("\n") + "\n" + text[insert_at:]


def wrap_date_inputs(text: str) -> tuple[str, int]:
    """Wrap unwrapped <input type="date"|"datetime-local"> in <div class="date-input">."""
    # Match <input ... type="date"...> or type="datetime-local"
    # Only wrap if not already inside <div class="date-input">
    count = [0]

    def _repl(m: re.Match) -> str:
        full = m.group(0)
        # Check the 200 chars before the match for an open .date-input we'd be inside.
        # Simpler heuristic: assume no existing wrap (verified by scan); just wrap.
        count[0] += 1
        return f'<div class="date-input">{full}</div>'

    new = re.sub(r'<input[^>]*type="(?:date|datetime-local)"[^>]*>', _repl, text)
    return new, count[0]


# -- Modal ARIA patches: file-by-file specific patches ------------------------

MODAL_PATCHES = {
    # OP-03: single .modal-overlay (deactivate)
    "OP-03": [
        {
            "find": '<div class="modal-overlay">\n  <div class="modal-box">\n    <h2 style="margin-top: 0; font-size: 18px;">테넌트 비활성화</h2>',
            "replace": '<div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title-op03-deactivate">\n  <div class="modal-box">\n    <h2 id="modal-title-op03-deactivate" style="margin-top: 0; font-size: 18px;">테넌트 비활성화</h2>',
        }
    ],
    "OP-05": [
        {
            "find": '<div class="modal-overlay-create">\n  <div class="modal-box">\n    <h2 style="margin-top: 0; font-size: 18px;">새 요금제 생성</h2>',
            "replace": '<div class="modal-overlay-create" role="dialog" aria-modal="true" aria-labelledby="modal-title-op05-create">\n  <div class="modal-box">\n    <h2 id="modal-title-op05-create" style="margin-top: 0; font-size: 18px;">새 요금제 생성</h2>',
        },
        {
            "find": '<div class="modal-overlay-edit">\n  <div class="modal-box">\n    <h2 style="margin-top: 0; font-size: 18px;">요금제 수정 — 프리미엄</h2>',
            "replace": '<div class="modal-overlay-edit" role="dialog" aria-modal="true" aria-labelledby="modal-title-op05-edit">\n  <div class="modal-box">\n    <h2 id="modal-title-op05-edit" style="margin-top: 0; font-size: 18px;">요금제 수정 — 프리미엄</h2>',
        },
    ],
    "OP-06": [
        {
            "find": '<div class="modal-batch">\n  <div class="modal-box">\n    <h2 style="margin-top: 0; font-size: 18px;">2026-06 청구 일괄 발행</h2>',
            "replace": '<div class="modal-batch" role="dialog" aria-modal="true" aria-labelledby="modal-title-op06-batch">\n  <div class="modal-box">\n    <h2 id="modal-title-op06-batch" style="margin-top: 0; font-size: 18px;">2026-06 청구 일괄 발행</h2>',
        },
        {
            "find": '<div class="modal-refund">\n  <div class="modal-box">\n    <h2 style="margin-top: 0; font-size: 18px;">환불 — 스마트팩토리 (주) 2026-05</h2>',
            "replace": '<div class="modal-refund" role="dialog" aria-modal="true" aria-labelledby="modal-title-op06-refund">\n  <div class="modal-box">\n    <h2 id="modal-title-op06-refund" style="margin-top: 0; font-size: 18px;">환불 — 스마트팩토리 (주) 2026-05</h2>',
        },
    ],
    "OP-07": [
        {
            "find": '<div class="modal-add">\n  <div class="modal-box">\n    <h2 style="margin-top: 0; font-size: 18px;">기능 플래그 추가</h2>',
            "replace": '<div class="modal-add" role="dialog" aria-modal="true" aria-labelledby="modal-title-op07-add">\n  <div class="modal-box">\n    <h2 id="modal-title-op07-add" style="margin-top: 0; font-size: 18px;">기능 플래그 추가</h2>',
        },
        {
            "find": '<div class="modal-override">\n  <div class="modal-box">\n    <h2 style="margin-top: 0; font-size: 18px;">예외 테넌트 설정 — 출퇴근 GPS 위치 캡처</h2>',
            "replace": '<div class="modal-override" role="dialog" aria-modal="true" aria-labelledby="modal-title-op07-override">\n  <div class="modal-box">\n    <h2 id="modal-title-op07-override" style="margin-top: 0; font-size: 18px;">예외 테넌트 설정 — 출퇴근 GPS 위치 캡처</h2>',
        },
        {
            "find": '<div class="modal-history">\n  <div class="modal-box" style="max-width: 720px;">\n    <h2 style="margin-top: 0; font-size: 18px;">기능 플래그 변경 이력</h2>',
            "replace": '<div class="modal-history" role="dialog" aria-modal="true" aria-labelledby="modal-title-op07-history">\n  <div class="modal-box" style="max-width: 720px;">\n    <h2 id="modal-title-op07-history" style="margin-top: 0; font-size: 18px;">기능 플래그 변경 이력</h2>',
        },
    ],
    "OP-09": [
        {
            "find": '<div class="modal-export">\n  <div class="modal-box">\n    <h2 style="margin-top: 0; font-size: 18px;">CSV 내보내기</h2>',
            "replace": '<div class="modal-export" role="dialog" aria-modal="true" aria-labelledby="modal-title-op09-export">\n  <div class="modal-box">\n    <h2 id="modal-title-op09-export" style="margin-top: 0; font-size: 18px;">CSV 내보내기</h2>',
        },
    ],
    "OP-12": [
        {
            "find": '<div class="modal-force">\n  <div class="modal-box">\n    <h2 style="margin-top: 0; font-size: 18px;">staff 세션 강제 종료</h2>',
            "replace": '<div class="modal-force" role="dialog" aria-modal="true" aria-labelledby="modal-title-op12-force">\n  <div class="modal-box">\n    <h2 id="modal-title-op12-force" style="margin-top: 0; font-size: 18px;">staff 세션 강제 종료</h2>',
        },
    ],
}


def apply_modal_patches(file_id: str, text: str) -> tuple[str, int]:
    patches = MODAL_PATCHES.get(file_id, [])
    n_applied = 0
    for p in patches:
        if p["find"] not in text:
            raise RuntimeError(f"{file_id}: modal find pattern missing — already patched or HTML changed?\n  {p['find'][:80]}...")
        text = text.replace(p["find"], p["replace"], 1)
        n_applied += 1
    return text, n_applied


# -- Main loop ----------------------------------------------------------------

def process(file_id: str, sprite: str) -> dict:
    p = HTML_DIR / f"{file_id}.html"
    original = p.read_text(encoding="utf-8")
    text = original

    # 1. Inline sprite
    text_after_sprite = patch_inline_sprite(text, sprite)
    sprite_added = text_after_sprite != text
    text = text_after_sprite

    # 4. Date input wrap
    text, date_wrapped = wrap_date_inputs(text)

    # 6. Modal ARIA
    text, modals_patched = apply_modal_patches(file_id, text)

    if text != original:
        p.write_text(text, encoding="utf-8")
        changed = True
    else:
        changed = False

    return {
        "file": file_id,
        "changed": changed,
        "sprite_added": sprite_added,
        "date_wrapped": date_wrapped,
        "modals_patched": modals_patched,
    }


def main() -> int:
    results = []

    for fid in CM_FILES:
        results.append(process(fid, SPRITE_AUTH))

    # OP-01 — skip sprite (already inline) but still try date/modal (none needed)
    # We'll process OP-01 too, with patch_inline_sprite no-op since it detects existing sprite.
    results.append(process("OP-01", SPRITE_SHELL))

    for fid in OP_FILES:
        results.append(process(fid, SPRITE_SHELL))

    # Report
    print("=" * 60)
    print("PATCH RESULTS")
    print("=" * 60)
    print(f"{'FILE':<10} {'CHANGED':<8} {'SPRITE':<7} {'DATES':<6} {'MODALS':<6}")
    for r in results:
        print(f"{r['file']:<10} {str(r['changed']):<8} {str(r['sprite_added']):<7} "
              f"{r['date_wrapped']:<6} {r['modals_patched']:<6}")

    total_changed = sum(1 for r in results if r["changed"])
    total_sprite = sum(1 for r in results if r["sprite_added"])
    total_dates = sum(r["date_wrapped"] for r in results)
    total_modals = sum(r["modals_patched"] for r in results)

    print("-" * 60)
    print(f"TOTAL: changed={total_changed}/{len(results)} sprite+{total_sprite} dates+{total_dates} modals+{total_modals}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
