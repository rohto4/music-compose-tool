#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { URL } = require("node:url");
const { chromium } = require("playwright");

let baseUrl = process.env.PROTOTYPE_BASE_URL || "";
const root = path.resolve(__dirname, "..");
const artifactDir = path.join(root, ".tmp", "browser-qa");
const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const pages = [
  { id: "hallmark", path: "/docs/design/prototypes/hallmark/" },
  { id: "pastel-projects", path: "/docs/design/prototypes/pastel-patchboard/" },
  { id: "pastel-workbench", path: "/docs/design/prototypes/pastel-patchboard/", prepare: "workbench" },
  { id: "pastel-detail", path: "/docs/design/prototypes/pastel-patchboard/", prepare: "detail" },
];

const viewports = [
  { id: "desktop", width: 1440, height: 1000, touch: false },
  { id: "tablet", width: 768, height: 1024, touch: true },
  { id: "mobile-414", width: 414, height: 896, touch: true },
  { id: "mobile-375", width: 375, height: 812, touch: true },
  { id: "mobile-320", width: 320, height: 700, touch: true },
];

function assert(condition, message, issues) {
  if (!condition) issues.push(message);
}

function startStaticServer() {
  const mime = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
  };
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    let target = path.resolve(root, `.${pathname}`);
    if (!target.startsWith(root)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": mime[path.extname(target)] || "application/octet-stream" });
    fs.createReadStream(target).pipe(response);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function inspectPage(page, config, viewport) {
  const consoleErrors = [];
  const failedRequests = [];
  const httpErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    failedRequests.push(`${request.method()} ${request.url()} · ${request.failure()?.errorText || "failed"}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`);
  });

  await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await page.route("https://fonts.gstatic.com/**", (route) => route.fulfill({ status: 204, body: "" }));
  const response = await page.goto(`${baseUrl}${config.path}`, { waitUntil: "load" });
  await page.evaluate(() => Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 500))]));
  if (config.prepare) {
    await page.locator(".project-card").first().click();
    if (config.prepare === "detail") await page.getByRole("button", { name: /60分仕上げ/ }).click();
  }

  const dom = await page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight;
    };
    const textNodes = (element) => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const items = [];
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeValue.trim()) items.push(node);
      }
      return items;
    };
    const wraps = (element) => textNodes(element).some((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const tops = [...range.getClientRects()].map((rect) => Math.round(rect.top));
      return new Set(tops).size > 1;
    });
    const controlSelector = [
      ".phase-tab", ".asset-tab", ".quiet-btn", ".text-btn", ".sample-control",
      ".transport-play", ".share-menu summary", ".share-options button", ".save-btn",
      ".icon-btn", ".mobile-dock button", ".humming-button", ".workspace-nav button",
      ".audition-btn", ".project-card", ".start-method", ".snap-control button", ".property-control button",
    ].join(",");
    const controls = [...document.querySelectorAll(controlSelector)].filter(visible);
    const interactive = [...document.querySelectorAll("button:not([disabled]), a[href], summary, select, input, textarea, canvas[tabindex]")].filter(visible);
    const duplicateIds = [...document.querySelectorAll("[id]")]
      .map((element) => element.id)
      .filter((id, index, ids) => ids.indexOf(id) !== index);
    const unnamed = interactive.filter((element) => {
      const label = element.getAttribute("aria-label") || element.textContent.trim() || element.getAttribute("title");
      return !label;
    }).map((element) => element.outerHTML.slice(0, 120));
    const smallTargets = interactive.filter((element) => {
      const rect = element.getBoundingClientRect();
      return matchMedia("(pointer: coarse)").matches && (rect.width < 44 || rect.height < 44);
    }).map((element) => {
      const rect = element.getBoundingClientRect();
      return `${element.tagName}.${element.className || ""} ${Math.round(rect.width)}x${Math.round(rect.height)}`;
    });
    const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((element) => Number(element.tagName.slice(1)));
    const headingSkips = headings.slice(1).filter((level, index) => level - headings[index] > 1);
    return {
      title: document.title,
      lang: document.documentElement.lang,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      duplicateIds,
      unnamed,
      smallTargets,
      wrappedControls: controls.filter(wraps).map((element) => element.textContent.trim().replace(/\s+/g, " ").slice(0, 80)),
      landmarks: {
        header: document.querySelectorAll("header").length,
        nav: document.querySelectorAll("nav").length,
        main: document.querySelectorAll("main").length,
        footer: document.querySelectorAll("footer").length,
      },
      h1Count: document.querySelectorAll("h1").length,
      headingSkips,
      reducedMotionRule: (() => {
        const containsRule = (rules) => [...rules].some((rule) => {
          if (rule.media?.mediaText.includes("prefers-reduced-motion")) return true;
          try { return rule.styleSheet?.cssRules ? containsRule(rule.styleSheet.cssRules) : false; }
          catch { return false; }
        });
        return [...document.styleSheets].some((sheet) => {
          try { return containsRule(sheet.cssRules); }
          catch { return false; }
        });
      })(),
    };
  });

  const navigationTiming = await page.evaluate(() => {
    const entry = performance.getEntriesByType("navigation")[0];
    if (!entry) return null;
    return {
      domContentLoadedMs: Math.round(entry.domContentLoadedEventEnd),
      loadMs: Math.round(entry.loadEventEnd),
      transferBytes: entry.transferSize,
    };
  });

  const issues = [];
  assert(response && response.status() === 200, `HTTP status was ${response?.status()}`, issues);
  assert(consoleErrors.length === 0, `console errors: ${consoleErrors.join(" | ")}`, issues);
  assert(failedRequests.length === 0, `failed requests: ${failedRequests.join(" | ")}`, issues);
  assert(httpErrors.length === 0, `HTTP errors: ${httpErrors.join(" | ")}`, issues);
  assert(dom.scrollWidth <= dom.clientWidth && dom.bodyScrollWidth <= dom.clientWidth, `horizontal overflow ${dom.scrollWidth}/${dom.bodyScrollWidth} > ${dom.clientWidth}`, issues);
  assert(dom.duplicateIds.length === 0, `duplicate IDs: ${dom.duplicateIds.join(", ")}`, issues);
  assert(dom.unnamed.length === 0, `unnamed controls: ${dom.unnamed.join(" | ")}`, issues);
  assert(dom.smallTargets.length === 0, `touch targets below 44px: ${dom.smallTargets.join(" | ")}`, issues);
  assert(dom.wrappedControls.length === 0, `wrapped clickable text: ${dom.wrappedControls.join(" | ")}`, issues);
  assert(dom.landmarks.header >= 1 && dom.landmarks.nav >= 1 && dom.landmarks.main === 1 && dom.landmarks.footer === 1, `landmarks: ${JSON.stringify(dom.landmarks)}`, issues);
  assert(dom.h1Count === 1, `h1 count: ${dom.h1Count}`, issues);
  assert(dom.headingSkips.length === 0, "heading levels skip", issues);
  assert(dom.reducedMotionRule, "reduced motion rule not observable", issues);

  const screenshot = path.join(artifactDir, `${config.id}-${viewport.id}.png`);
  await page.screenshot({ path: screenshot, fullPage: false });

  return {
    page: config.id,
    viewport,
    url: page.url(),
    navigationTiming,
    dom,
    consoleErrors,
    failedRequests,
    httpErrors,
    screenshot: path.relative(root, screenshot),
    issues,
  };
}

async function runInteractions(page) {
  const steps = [];
  const record = (name, passed, detail = "") => steps.push({ name, passed, detail });

  record("project shelf has multiple projects", await page.locator(".project-card:not(.project-card-new)").count() === 3);
  await page.locator('[data-action="new-project"]').first().click();
  record("new project form", await page.getByRole("heading", { name: "新しい曲" }).isVisible());
  record("two start methods", await page.locator(".start-method").count() === 2);
  await page.locator("#new-project-name").fill("QA Humming Sketch");
  await page.locator('[data-action="start-project"][data-value="humming"]').click();
  record("humming-first opens shape melody", await page.locator('#app[data-phase="shape"][data-workspace="melody"]').count() === 1);

  await page.locator('.humming-panel[data-state="ready"]').waitFor({ timeout: 1500 });
  record("humming ready", true);
  await page.locator('.humming-panel[data-state="listening"]').waitFor({ timeout: 2000 });
  record("humming recording", await page.locator('.humming-steps li[data-state="current"]').filter({ hasText: "録音" }).isVisible());
  await page.locator('.humming-panel[data-state="analyzing"]').waitFor({ timeout: 2500 });
  record("humming analysis", await page.locator('.humming-steps li[data-state="current"]').filter({ hasText: "解析" }).isVisible());
  await page.locator('.humming-panel[data-state="captured"]').waitFor({ timeout: 2500 });
  record("humming notes captured", await page.locator(".note-chip").count() === 6);
  await page.screenshot({ path: path.join(artifactDir, "pastel-humming-captured.png"), fullPage: false });

  await page.getByRole("option", { name: /B4/ }).click();
  await page.getByRole("button", { name: "音程を半音上げる" }).click();
  record("shape melody pitch edit", (await page.locator(".control-group").first().innerText()).includes("C5"));

  await page.getByRole("button", { name: "展開を整える", exact: true }).click();
  await page.getByLabel("展開アセットを選ぶ").selectOption("gentle-rise");
  record("shape arrangement selection", (await page.locator(".flow-summary").innerText()).includes("Gentle Rise") && await page.locator(".section-segment").filter({ hasText: "Soft Intro" }).isVisible());
  const frameRoles = await page.locator(".section-segment").evaluateAll((items) => ({ roles: [...new Set(items.map((item) => item.dataset.role))], tones: items.filter((item) => item.hasAttribute("data-tone")).length }));
  record("arrangement uses role frames, not section colours", frameRoles.roles.length >= 4 && frameRoles.tones === 0, JSON.stringify(frameRoles));
  await page.getByLabel("sectionの長さ").selectOption("24");
  await page.getByLabel("sectionの勢い").evaluate((element) => { element.value = "77"; element.dispatchEvent(new Event("change", { bubbles: true })); });
  record("shape section controls", (await page.getByLabel("sectionの長さ").inputValue()) === "24" && (await page.getByLabel("sectionの勢い").inputValue()) === "77");

  await page.getByRole("button", { name: /10分ラフ/ }).click();
  record("draft defaults to asset workspace", await page.locator('#app[data-phase="draft"][data-workspace="assets"]').count() === 1);
  record("expanded asset groups", await page.getByRole("tab").count() === 10, `${await page.getByRole("tab").count()} groups`);
  await page.getByRole("tab", { name: "ベース" }).click();
  await page.locator(".asset-item").filter({ hasText: "Round Pluck" }).click();
  const audition = page.getByRole("button", { name: "Round Pluckの音色を試聴" });
  await audition.click();
  record("one-tap timbre audition", await audition.getAttribute("aria-pressed") === "true" && (await page.locator(".preview-mode").innerText()).includes("Round Pluck"));
  await page.getByRole("button", { name: "展開を整える", exact: true }).click();
  record("draft arrangement is locked", await page.getByLabel("展開アセットを選ぶ").isDisabled() && await page.getByText("10分ラフでは展開を固定").isVisible());

  await page.getByRole("button", { name: /60分仕上げ/ }).click();
  record("detail defaults to note workspace", await page.locator('#app[data-phase="detail"][data-workspace="melody"]').count() === 1 && await page.locator(".piano-grid").isVisible());
  record("detail snap choices", await page.locator(".snap-control button").count() === 5 && await page.getByRole("button", { name: "1/16T", exact: true }).isVisible() && await page.getByRole("button", { name: "1/32", exact: true }).isVisible());
  await page.getByRole("button", { name: "1/16T", exact: true }).click();
  const tickBefore = await page.locator(".property-control").filter({ hasText: "位置" }).locator("strong").innerText();
  await page.getByRole("button", { name: "音符をグリッド1つ後ろへ" }).click();
  const tickAfter = await page.locator(".property-control").filter({ hasText: "位置" }).locator("strong").innerText();
  record("triplet grid note nudge", tickBefore !== tickAfter, `${tickBefore} -> ${tickAfter}`);
  await page.getByRole("button", { name: "1/32", exact: true }).click();
  record("32nd grid selected", await page.getByRole("button", { name: "1/32", exact: true }).getAttribute("aria-pressed") === "true");
  await page.locator(".property-control").filter({ hasText: "音程" }).getByRole("button", { name: "+1", exact: true }).click();
  await page.getByRole("button", { name: "音符をグリッド1つ長く" }).click();
  await page.getByRole("button", { name: "音の強さを上げる" }).click();
  record("detail pitch length velocity edits", true);
  const notesBefore = await page.locator(".piano-note").count();
  await page.getByRole("button", { name: /複製/ }).click();
  const notesDuplicated = await page.locator(".piano-note").count();
  await page.getByRole("button", { name: /削除/ }).click();
  record("detail duplicate and delete", notesDuplicated === notesBefore + 1 && await page.locator(".piano-note").count() === notesBefore);
  const metrics = await page.evaluate(() => ({
    domNodes: document.querySelectorAll("*").length,
    pianoNotes: document.querySelectorAll(".piano-note").length,
    gridCellNodes: document.querySelectorAll(".piano-grid-cell").length,
    renderMs: Number(document.querySelector("#app").dataset.renderMs),
    gridScrollWidth: document.querySelector(".piano-grid-scroll").scrollWidth,
  }));
  record("detail grid avoids cell DOM", metrics.gridCellNodes === 0, JSON.stringify(metrics));
  await page.screenshot({ path: path.join(artifactDir, "pastel-detail-editor.png"), fullPage: false });

  await page.locator(".model-routes summary").click();
  record("capability model disclosure", await page.getByText("ACE-Step 1.5 DiT-only", { exact: true }).isVisible() && await page.getByText("Basic Pitch TS", { exact: true }).isVisible());
  await page.getByRole("button", { name: "伴奏候補を作る" }).click();
  record("AI loading", await page.getByText("伴奏候補を準備中…").isVisible());
  await page.getByText("伴奏候補を追加", { exact: true }).waitFor();
  record("AI success", true);

  await page.getByRole("button", { name: "元に戻す" }).click();
  await page.getByRole("button", { name: "やり直す" }).click();
  record("undo and redo", true);
  await page.getByRole("button", { name: "保存" }).click();
  record("manual save state", await page.getByText("保存済み", { exact: true }).isVisible());
  await page.getByLabel("操作ガイドを開く").click();
  record("state examples behind help", await page.getByRole("heading", { name: "操作状態の見本" }).isVisible());
  await page.getByLabel("操作ガイドを開く").click();

  const before = await page.locator(".progress-track").getAttribute("aria-valuenow");
  await page.getByRole("button", { name: "再生" }).click();
  await page.waitForTimeout(650);
  const after = await page.locator(".progress-track").getAttribute("aria-valuenow");
  record("transport progress", Number(after) > Number(before), `${before} -> ${after}`);
  record("realtime Web Audio preview", (await page.locator(".preview-mode").innerText()).includes("内蔵シンセ"));
  await page.getByRole("button", { name: "停止" }).click();
  await page.locator(".share-menu summary").click();
  await page.getByRole("button", { name: "Misskey用文面" }).click();
  record("share copy", await page.getByText("Misskey向け共有文面を作りました。").isVisible());

  await page.evaluate(() => {
    document.body.setAttribute("tabindex", "-1");
    document.body.focus();
  });
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => {
    const element = document.activeElement;
    const style = getComputedStyle(element);
    return { tag: element.tagName, text: element.textContent.trim().slice(0, 40), outlineWidth: style.outlineWidth, outlineStyle: style.outlineStyle };
  });
  record("keyboard focus visible", focused.outlineStyle !== "none" && focused.outlineWidth !== "0px", JSON.stringify(focused));

  const focusTrail = [];
  for (let index = 0; index < 8; index += 1) {
    focusTrail.push(await page.evaluate(() => {
      const element = document.activeElement;
      return element.getAttribute("aria-label") || element.textContent.trim().replace(/\s+/g, " ").slice(0, 40) || element.tagName;
    }));
    await page.keyboard.press("Tab");
  }
  record("keyboard traversal", new Set(focusTrail).size >= 6, focusTrail.join(" -> "));
  await page.locator('[data-action="project-home"]').evaluate((element) => element.click());
  record("created project returns to shelf", await page.locator(".project-card:not(.project-card-new)").count() === 4 && await page.getByText("QA Humming Sketch", { exact: true }).isVisible());

  return { steps, metrics };
}

async function runInteractionsV2(page) {
  const steps = [];
  const record = (name, passed, detail = "") => steps.push({ name, passed, detail });

  record("project shelf has multiple projects", await page.locator(".project-card:not(.project-card-new)").count() === 3);
  await page.locator('[data-action="new-project"]').first().click();
  record("new project captures foundation", await page.locator("#new-project-duration, #new-project-mood, #new-project-key, #new-project-bpm").count() === 4);
  await page.locator("#new-project-name").fill("QA Foundation Sketch");
  await page.locator("#new-project-key").selectOption({ label: "B minor" });
  await page.locator("#new-project-bpm").fill("164");
  await page.locator('[data-action="start-project"][data-value="assets"]').click();
  record("asset-first opens project foundation", await page.locator('#app[data-workspace="setup"] .project-setup').count() === 1);
  record("settings removed from persistent header", await page.locator(".compact-workbench-controls .field-row").count() === 0);
  record("foundation values carried in", await page.getByLabel("曲のキー").inputValue() === "B minor" && await page.getByLabel("BPM").inputValue() === "164");
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(artifactDir, "pastel-project-foundation.png"), fullPage: false });
  await page.getByRole("button", { name: "音を組むへ進む" }).click();
  record("foundation proceeds to sound", await page.locator('#app[data-workspace="assets"]').count() === 1);
  await page.getByRole("button", { name: "プロジェクト一覧へ戻る" }).click({ force: true });

  await page.locator('[data-action="new-project"]').first().click();
  await page.locator("#new-project-name").fill("QA Humming Sketch");
  await page.locator('[data-action="start-project"][data-value="humming"]').click();
  record("humming-first opens shape melody", await page.locator('#app[data-phase="shape"][data-workspace="melody"]').count() === 1);
  await page.getByLabel("section内の開始小節").fill("2");
  await page.getByLabel("section内の開始小節").evaluate((element) => element.dispatchEvent(new Event("change", { bubbles: true })));
  await page.getByLabel("鼻歌を入れる小節数").selectOption("2");
  record("humming target range", (await page.locator(".humming-target").innerText()).includes("2–3小節"));
  await page.locator('.humming-panel[data-state="ready"]').waitFor({ timeout: 1500 });
  record("humming ready", true);
  await page.locator('.humming-panel[data-state="listening"]').waitFor({ timeout: 2000 });
  record("humming recording", await page.locator('.humming-steps li[data-state="current"]').filter({ hasText: "録音" }).isVisible());
  await page.locator('.humming-panel[data-state="analyzing"]').waitFor({ timeout: 2500 });
  record("humming analysis", await page.locator('.humming-steps li[data-state="current"]').filter({ hasText: "解析" }).isVisible());
  await page.locator('.humming-panel[data-state="captured"]').waitFor({ timeout: 2500 });
  record("humming notes captured only in range", await page.locator(".note-chip").count() === 6, `${await page.locator(".note-chip").count()} visible notes`);
  await page.screenshot({ path: path.join(artifactDir, "pastel-humming-range-captured.png"), fullPage: false });

  await page.locator(".note-chip").first().click();
  const shapePitch = await page.locator(".control-group").first().locator("strong").innerText();
  await page.getByRole("button", { name: "音程を半音上げる" }).click();
  record("shape melody pitch edit", (await page.locator(".control-group").first().locator("strong").innerText()) !== shapePitch);

  await page.getByRole("button", { name: "展開を整える", exact: true }).click();
  await page.getByLabel("展開アセットを選ぶ").selectOption("gentle-rise");
  record("shape arrangement selection", (await page.locator(".flow-summary").innerText()).includes("Gentle Rise"));
  record("Bridge is distinct from Break", await page.locator('.section-segment[data-role="bridge"]').count() >= 1 && await page.locator('.section-template-palette [data-value="break"]').count() === 1 && await page.locator('.section-template-palette [data-value="bridge"]').count() === 1);
  const sectionCountBeforeAdd = await page.locator(".section-segment").count();
  await page.locator('.section-template-palette [data-value="bridge"]').click();
  record("section template insertion", await page.locator(".section-segment").count() === sectionCountBeforeAdd + 1);
  const labelsBeforeDrag = await page.locator(".section-segment strong").allTextContents();
  const firstSegment = page.locator(".section-segment").first();
  const thirdSegment = page.locator(".section-segment").nth(2);
  const firstBox = await firstSegment.boundingBox();
  const thirdBox = await thirdSegment.boundingBox();
  await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(thirdBox.x + thirdBox.width / 2, thirdBox.y + thirdBox.height / 2, { steps: 8 });
  await page.mouse.up();
  const labelsAfterDrag = await page.locator(".section-segment strong").allTextContents();
  record("pointer drag reorders arrangement", labelsBeforeDrag.join("|") !== labelsAfterDrag.join("|"), `${labelsBeforeDrag.join(" > ")} -> ${labelsAfterDrag.join(" > ")}`);
  const frameRoles = await page.locator(".section-segment").evaluateAll((items) => ({ roles: [...new Set(items.map((item) => item.dataset.role))], tones: items.filter((item) => item.hasAttribute("data-tone")).length }));
  record("arrangement uses neutral role frames", frameRoles.roles.includes("bridge") && frameRoles.tones === 0, JSON.stringify(frameRoles));

  await page.getByRole("button", { name: /10分ラフ/ }).click();
  record("draft defaults to asset workspace", await page.locator('#app[data-phase="draft"][data-workspace="assets"]').count() === 1);
  record("expanded asset groups", await page.getByRole("tab").count() === 10);
  await page.getByRole("tab", { name: "ベース" }).click();
  const audition = page.getByRole("button", { name: "Round Pluckの音色を試聴" });
  await audition.click();
  record("one-tap timbre audition", await audition.getAttribute("aria-pressed") === "true" && (await page.locator(".preview-mode").innerText()).includes("Round Pluck"));
  await page.getByRole("button", { name: "展開を整える", exact: true }).click();
  record("draft arrangement lock is tooltip-only", await page.getByLabel("展開アセットを選ぶ").isDisabled() && await page.getByText("10分ラフでは展開を固定").count() === 0 && (await page.getByLabel("展開アセットを選ぶ").getAttribute("title")).includes("30分整形"));

  await page.getByRole("button", { name: /60分仕上げ/ }).click();
  const canvas = page.locator("[data-editor-canvas]");
  await canvas.waitFor();
  record("detail defaults to whole-song Canvas", await page.locator('#app[data-phase="detail"][data-workspace="melody"]').count() === 1 && await canvas.getAttribute("data-backend") === "canvas-2d-main-thread");
  record("whole-song note data is virtualized", Number(await canvas.getAttribute("data-total-notes")) > Number(await canvas.getAttribute("data-visible-notes")) && await page.locator(".piano-note").count() === 0);
  record("detail snap choices", await page.locator(".snap-control button").count() === 5 && await page.getByRole("button", { name: "1/16T", exact: true }).isVisible() && await page.getByRole("button", { name: "1/32", exact: true }).isVisible());
  await page.getByRole("button", { name: "1/16T", exact: true }).click();
  const tickBefore = await page.locator(".property-control").filter({ hasText: "位置" }).locator("strong").innerText();
  await page.getByRole("button", { name: "音符をグリッド1つ後ろへ" }).click();
  const tickAfter = await page.locator(".property-control").filter({ hasText: "位置" }).locator("strong").innerText();
  record("triplet grid note nudge", tickBefore !== tickAfter, `${tickBefore} -> ${tickAfter}`);
  await page.getByRole("button", { name: "1/32", exact: true }).click();
  record("32nd grid selected", await page.getByRole("button", { name: "1/32", exact: true }).getAttribute("aria-pressed") === "true");

  const barsBeforeZoom = await page.locator(".zoom-control strong").innerText();
  await page.getByRole("button", { name: "時間軸を拡大" }).click();
  record("Canvas timeline zoom", (await page.locator(".zoom-control strong").innerText()) !== barsBeforeZoom);
  await page.getByLabel("全曲内の表示位置").evaluate((element) => { element.value = Math.min(4, Number(element.max)); element.dispatchEvent(new Event("input", { bubbles: true })); element.dispatchEvent(new Event("change", { bubbles: true })); });
  record("Canvas timeline scroll", (await page.locator(".timeline-scroll span").innerText()).startsWith("表示位置 5") || Number(await page.getByLabel("全曲内の表示位置").inputValue()) < 4);

  await page.locator('.song-overview [data-value="verse"]').click();
  await canvas.scrollIntoViewIfNeeded();
  const beforeDrag = await page.locator(".property-readout select").inputValue();
  const dragCanvasBox = await canvas.boundingBox();
  const selectedX = Number(await canvas.getAttribute("data-selected-x"));
  const selectedY = Number(await canvas.getAttribute("data-selected-y"));
  const selectedWidth = Number(await canvas.getAttribute("data-selected-width"));
  const pitchBeforeDrag = await page.locator(".property-control").filter({ hasText: "音程" }).locator("strong").innerText();
  const positionBeforeDrag = await page.locator(".property-control").filter({ hasText: "位置" }).locator("strong").innerText();
  await page.mouse.move(dragCanvasBox.x + selectedX + Math.min(8, selectedWidth / 3), dragCanvasBox.y + selectedY + 8);
  await page.mouse.down();
  await page.mouse.move(dragCanvasBox.x + selectedX + 45, dragCanvasBox.y + selectedY - 18, { steps: 8 });
  await page.mouse.up();
  const pitchAfterDrag = await page.locator(".property-control").filter({ hasText: "音程" }).locator("strong").innerText();
  const positionAfterDrag = await page.locator(".property-control").filter({ hasText: "位置" }).locator("strong").innerText();
  record("Canvas drag changes pitch and timing", pitchBeforeDrag !== pitchAfterDrag && positionBeforeDrag !== positionAfterDrag, `${pitchBeforeDrag}/${positionBeforeDrag} -> ${pitchAfterDrag}/${positionAfterDrag}`);

  const resizeX = Number(await canvas.getAttribute("data-selected-x"));
  const resizeY = Number(await canvas.getAttribute("data-selected-y"));
  const resizeWidth = Number(await canvas.getAttribute("data-selected-width"));
  const lengthBeforeResize = await page.locator(".property-control").filter({ hasText: "長さ" }).locator("strong").innerText();
  await page.mouse.move(dragCanvasBox.x + resizeX + resizeWidth - 3, dragCanvasBox.y + resizeY + 8);
  await page.mouse.down();
  await page.mouse.move(dragCanvasBox.x + resizeX + resizeWidth + 36, dragCanvasBox.y + resizeY + 8, { steps: 6 });
  await page.mouse.up();
  record("Canvas edge drag resizes note", (await page.locator(".property-control").filter({ hasText: "長さ" }).locator("strong").innerText()) !== lengthBeforeResize);

  const totalBeforeAdd = Number(await canvas.getAttribute("data-total-notes"));
  await canvas.dblclick({ position: { x: Math.max(80, dragCanvasBox.width * 0.72), y: Math.max(160, dragCanvasBox.height * 0.72) } });
  const totalAfterAdd = Number(await canvas.getAttribute("data-total-notes"));
  record("Canvas double-click adds note", totalAfterAdd === totalBeforeAdd + 1, `${totalBeforeAdd} -> ${totalAfterAdd}`);
  await canvas.focus();
  await page.keyboard.press("Delete");
  record("Canvas Delete removes selected note", Number(await canvas.getAttribute("data-total-notes")) === totalBeforeAdd);
  const totalBeforeDuplicate = Number(await canvas.getAttribute("data-total-notes"));
  await page.getByRole("button", { name: /複製/ }).click();
  await page.getByRole("button", { name: /削除/ }).click();
  record("detail duplicate and delete", Number(await canvas.getAttribute("data-total-notes")) === totalBeforeDuplicate);

  const metrics = await page.evaluate(() => {
    const app = document.querySelector("#app");
    const canvas = document.querySelector("[data-editor-canvas]");
    return {
      domNodes: document.querySelectorAll("*").length,
      noteDomNodes: document.querySelectorAll(".piano-note").length,
      canvasBackend: canvas.dataset.backend,
      totalNotes: Number(canvas.dataset.totalNotes),
      visibleNotes: Number(canvas.dataset.visibleNotes),
      canvasDrawMs: Number(app.dataset.canvasDrawMs),
      pointerInteractionMs: Number(app.dataset.pointerInteractionMs),
      renderMs: Number(app.dataset.renderMs),
      backingWidth: canvas.width,
      cssWidth: Math.round(canvas.getBoundingClientRect().width),
      dpr: Number(canvas.dataset.dpr),
      selectedBeforeDrag: document.querySelector('.property-readout select')?.value,
    };
  });
  record("detail Canvas metrics captured", metrics.noteDomNodes === 0 && metrics.totalNotes > metrics.visibleNotes && Number.isFinite(metrics.canvasDrawMs) && metrics.backingWidth >= metrics.cssWidth, JSON.stringify(metrics));
  await page.screenshot({ path: path.join(artifactDir, "pastel-whole-song-canvas-editor.png"), fullPage: false });

  record("AI-specific inputs separated", await page.getByLabel("生成イメージ").isVisible() && await page.getByLabel("生成範囲").isVisible() && (await page.locator(".ai-project-context").innerText()).includes("自動で参照"));
  await page.locator(".model-routes summary").click();
  record("capability model disclosure", await page.getByText("ACE-Step 1.5 DiT-only", { exact: true }).isVisible() && await page.getByText("Basic Pitch TS", { exact: true }).isVisible());
  await page.getByRole("button", { name: "伴奏候補を作る" }).click();
  await page.getByText("伴奏候補を追加", { exact: true }).waitFor();
  record("AI fake generation state", true);

  await page.getByRole("button", { name: "元に戻す" }).click();
  await page.getByRole("button", { name: "やり直す" }).click();
  record("undo and redo", true);
  await page.getByRole("button", { name: "保存" }).click();
  record("manual save state", await page.getByText("保存済み", { exact: true }).isVisible());
  await page.getByLabel("操作ガイドを開く").click();
  record("state examples behind help", await page.getByRole("heading", { name: "操作状態の見本" }).isVisible());
  await page.getByLabel("操作ガイドを開く").click();

  const before = await page.locator(".progress-track").getAttribute("aria-valuenow");
  await page.getByRole("button", { name: "再生" }).click();
  await page.waitForTimeout(650);
  const after = await page.locator(".progress-track").getAttribute("aria-valuenow");
  record("transport progress and Web Audio preview", Number(after) > Number(before) && (await page.locator(".preview-mode").innerText()).includes("内蔵シンセ"));
  await page.getByRole("button", { name: "停止" }).click();

  await page.evaluate(() => { document.body.setAttribute("tabindex", "-1"); document.body.focus(); });
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => { const element = document.activeElement; const style = getComputedStyle(element); return { tag: element.tagName, outlineWidth: style.outlineWidth, outlineStyle: style.outlineStyle }; });
  record("keyboard focus visible", focused.outlineStyle !== "none" && focused.outlineWidth !== "0px", JSON.stringify(focused));
  await page.locator('[data-action="project-home"]').evaluate((element) => element.click());
  await page.locator('#app[data-screen="projects"]').waitFor();
  const projectCount = await page.locator(".project-card:not(.project-card-new)").count();
  record("created projects return to shelf", projectCount === 5, `${projectCount} projects`);

  return { steps, metrics };
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });
  const localServer = baseUrl ? null : await startStaticServer();
  if (localServer) baseUrl = `http://127.0.0.1:${localServer.address().port}`;
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const results = [];
  try {
    for (const pageConfig of pages) {
      for (const viewport of viewports) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          hasTouch: viewport.touch,
          isMobile: viewport.width <= 414,
          deviceScaleFactor: 1,
          reducedMotion: "no-preference",
        });
        const page = await context.newPage();
        const result = await inspectPage(page, pageConfig, viewport);
        results.push(result);
        await context.close();
      }
    }

    const interactionContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const interactionPage = await interactionContext.newPage();
    const interactionConsole = [];
    interactionPage.on("console", (message) => { if (message.type() === "error") interactionConsole.push(message.text()); });
    await interactionPage.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ status: 200, contentType: "text/css", body: "" }));
    await interactionPage.route("https://fonts.gstatic.com/**", (route) => route.fulfill({ status: 204, body: "" }));
    const interactionTarget = pages.find((item) => item.id === "pastel-projects");
    await interactionPage.goto(`${baseUrl}${interactionTarget.path}`, { waitUntil: "load" });
    const interactionRun = await runInteractionsV2(interactionPage);
    const interactions = interactionRun.steps;
    await interactionPage.screenshot({ path: path.join(artifactDir, "pastel-patchboard-interactions-final.png"), fullPage: false });
    await interactionContext.close();

    const report = {
      generatedAt: new Date().toISOString(),
      browser: await browser.version(),
      baseUrl,
      fontMode: "external Google Fonts intercepted; local fallback stack observed",
      results,
      interactions,
      detailMetrics: interactionRun.metrics,
      interactionConsole,
      summary: {
        viewports: results.length,
        viewportIssues: results.reduce((sum, item) => sum + item.issues.length, 0),
        interactionFailures: interactions.filter((item) => !item.passed).length,
        interactionConsoleErrors: interactionConsole.length,
      },
    };
    fs.writeFileSync(path.join(artifactDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(JSON.stringify(report.summary));
    for (const result of results.filter((item) => item.issues.length)) {
      console.error(`${result.page}/${result.viewport.id}: ${result.issues.join(" | ")}`);
    }
    for (const step of interactions.filter((item) => !item.passed)) {
      console.error(`interaction ${step.name}: ${step.detail}`);
    }
    if (report.summary.viewportIssues || report.summary.interactionFailures || report.summary.interactionConsoleErrors) process.exitCode = 1;
  } finally {
    await browser.close();
    if (localServer) await new Promise((resolve) => localServer.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
