const chapters = [
  {
    id: "preface-goals",
    title: "前言 学习库目标",
    subtitle: "适合读者、使用方式与实践项目",
    sourcePath: "前言/学习库目标.md"
  },
  {
    id: "chapter-foundation",
    title: "第一章 筑基",
    subtitle: "IDE + Agent + 更多工具",
    sourcePath: "第一章-筑基/第一章-筑基.md"
  },
  {
    id: "chapter-skills",
    title: "第二章 Skills",
    subtitle: "Skills 机制与可复用能力封装",
    sourcePath: "第二章-Skills/第二章-Skills.md"
  },
  {
    id: "chapter-mcp-cli",
    title: "第三章 MCP/CLI",
    subtitle: "MCP 原理、CLI 工具接入与调试",
    sourcePath: "第三章-MCP-CLI/第三章-MCP-CLI.md"
  },
  {
    id: "chapter-lightweight-agent",
    title: "第四章 轻量 Agent 框架入门",
    subtitle: "Nanobot 精读：从 LLM 到 Agent Runtime",
    sourcePath: "第四章-轻量-Agent-框架入门/第四章-轻量-Agent-框架入门.md"
  },
  {
    id: "chapter-pi-minimal-agent",
    title: "第五章 极简主义的 Agent 框架：Pi",
    subtitle: "极简终端 coding harness、Agent loop、资源扩展系统",
    sourcePath: "PI-极简主义的-Agent-框架/PI.md"
  },
  {
    id: "chapter-agent-memory",
    title: "第九章 Agent Memory 机制",
    subtitle: "短期记忆、长期记忆、检索记忆、用户建模",
    sourcePath: "第九章-Agent-Memory/Agent_Memory.md"
  },
  {
    id: "chapter-protocodebase",
    title: "第十四章 ProtoCodeBase",
    subtitle: "项目级协同、ACP 协议与 Agent 接管逻辑",
    sourcePath: "ProtoCodeBase/ProtoCodeBase.md"
  },
  {
    id: "chapter-protocol-agent-cli",
    title: "第十八章 协议 + Agent + CLI 协同",
    subtitle: "项目协议、命令行入口、Agent 执行链的结合",
    sourcePath: "协议+Agent+CLI协同/协议+Agent+CLI协同.md"
  },
  {
    id: "essay-epilogue",
    title: "末了杂谈",
    subtitle: "从执行力时代到调度力时代：智能体带来的范式变革",
    sourcePath: "末了杂谈/从执行力时代到调度力时代-智能体带来的范式变革.md"
  }
];

const chapterList = document.querySelector("#chapter-list");
const welcomeTocList = document.querySelector("#welcome-toc-list");
const welcomeReadme = document.querySelector("#welcome-readme");
const article = document.querySelector("#article");
const currentTitle = document.querySelector("#current-title");
const previousButton = document.querySelector("#previous-chapter");
const nextButton = document.querySelector("#next-chapter");
const progress = document.querySelector("#reading-progress");
const bannerImage = document.querySelector("[data-banner-image]");
const welcomePage = document.querySelector("#welcome-page");
const content = document.querySelector("#content");
const startReadingButton = document.querySelector("#start-reading");
const openCourseMapButton = document.querySelector("#open-course-map");

let currentIndex = 0;
let contentVisible = false;
const markdownCache = new Map();
const outlineCache = new Map();
const expandedChapters = new Set();
const repoUrl = document.body.dataset.repoUrl;
const repoPath = new URL(repoUrl).pathname.replace(/^\/|\/$/g, "");
const contentBase = location.pathname.includes("/web/") ? "../" : "./";
const bannerPath = `${contentBase}assets/github-header-banner.png`;
const codeFencePattern = /^\s*```(?:[A-Za-z0-9_-]+)?\s*$/;

if (bannerImage) {
  bannerImage.src = bannerPath;
}

document.querySelectorAll("[data-repo-link]").forEach((link) => {
  const suffix = link.dataset.repoLink;
  link.href = suffix ? `${repoUrl}/${suffix}` : repoUrl;
});

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function inlineMarkdown(value) {
  return value
    .replace(/```([^`]+)```/g, "<code>$1</code>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function plainText(value) {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function headingId(chapter, headingIndex) {
  return `${chapter.id}-section-${headingIndex}`;
}

function formatCount(value) {
  if (typeof value !== "number") return "--";
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return String(value);
}

function setStat(name, value) {
  const stat = document.querySelector(`[data-stat="${name}"]`);
  if (stat) stat.textContent = value;
}

function parseLastPage(linkHeader) {
  const page = linkHeader?.match(/[?&]page=(\d+)>;\s*rel="last"/)?.[1];
  return page ? Number(page) : null;
}

async function loadProjectStats() {
  try {
    const repoResponse = await fetch(`https://api.github.com/repos/${repoPath}`);
    if (!repoResponse.ok) throw new Error("repo stats unavailable");

    const repo = await repoResponse.json();
    setStat("stars", formatCount(repo.stargazers_count));
    setStat("forks", formatCount(repo.forks_count));
    setStat("watch", formatCount(repo.subscribers_count ?? repo.watchers_count));
  } catch (error) {
    setStat("stars", "--");
    setStat("forks", "--");
    setStat("watch", "--");
  }

  try {
    const contributorsResponse = await fetch(
      `https://api.github.com/repos/${repoPath}/contributors?per_page=1&anon=1`
    );
    if (!contributorsResponse.ok) throw new Error("contributors unavailable");
    const contributorsLink = contributorsResponse.headers.get("Link");
    const lastPage = parseLastPage(contributorsLink);
    if (lastPage) {
      setStat("contributors", formatCount(lastPage));
    } else {
      const contributors = await contributorsResponse.json();
      setStat("contributors", formatCount(contributors.length));
    }
  } catch (error) {
    setStat("contributors", "--");
  }
}

function extractOutline(markdown, chapter) {
  const outline = [];
  let headingIndex = 0;

  for (const line of markdown.split("\n")) {
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (!heading) continue;

    headingIndex += 1;
    const rawLevel = heading[1].length;
    const text = plainText(heading[2]);
    if (rawLevel === 1 && headingIndex === 1) continue;

    outline.push({
      id: headingId(chapter, headingIndex),
      level: rawLevel === 1 ? 2 : rawLevel,
      text
    });
  }

  return outline;
}

function renderTable(lines) {
  const rows = lines
    .filter((line, index) => index !== 1 || !/^\|?\s*:?-{3,}:?\s*\|/.test(line))
    .map((line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => inlineMarkdown(cell.trim())));

  return `<div class="table-wrap"><table><thead><tr>${rows[0]
    .map((cell) => `<th>${cell}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .slice(1)
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
}

function renderList(items, type) {
  const tag = type === "ol" ? "ol" : "ul";
  const topLevelItems = [];
  let currentTopLevel = null;

  for (const item of items) {
    const content = inlineMarkdown(item.text);
    if (item.indent === 0 || !currentTopLevel) {
      currentTopLevel = { content, children: [] };
      topLevelItems.push(currentTopLevel);
    } else {
      currentTopLevel.children.push(content);
    }
  }

  return `<${tag}>${topLevelItems
    .map((item) => {
      const children = item.children.length
        ? `<${tag}>${item.children.map((child) => `<li>${child}</li>`).join("")}</${tag}>`
        : "";
      return `<li>${item.content}${children}</li>`;
    })
    .join("")}</${tag}>`;
}

function renderMarkdown(markdown, chapter) {
  const htmlBlocks = [];
  const preserved = markdown.replace(/<(details|table|pre)[\s\S]*?<\/\1>/g, (match) => {
    htmlBlocks.push(match);
    return `@@HTML_BLOCK_${htmlBlocks.length - 1}@@`;
  });

  const footnoteDefs = [];
  const footnoteIndex = new Map();
  const rawLines = preserved.split("\n");
  const lines = [];
  let currentDef = null;
  for (const rawLine of rawLines) {
    const defMatch = rawLine.match(/^\[\^([^\]]+)\]:\s*(.*)$/);
    if (defMatch) {
      currentDef = { id: defMatch[1], body: defMatch[2] };
      footnoteIndex.set(currentDef.id, footnoteDefs.length + 1);
      footnoteDefs.push(currentDef);
      continue;
    }
    if (currentDef && /^\s{2,}\S/.test(rawLine)) {
      currentDef.body += " " + rawLine.trim();
      continue;
    }
    currentDef = null;
    lines.push(rawLine);
  }

  function applyFootnoteRefs(value) {
    if (!footnoteIndex.size) return value;
    return value.replace(/\[\^([^\]]+)\]/g, (match, id) => {
      const n = footnoteIndex.get(id);
      if (!n) return match;
      return `<sup class="footnote-ref"><a href="#fn-${id}" id="fnref-${id}">[${n}]</a></sup>`;
    });
  }

  const output = [];
  let paragraph = [];
  let quote = [];
  let code = [];
  let table = [];
  let list = [];
  let listType = null;
  let inCode = false;
  let headingIndex = 0;

  function flushParagraph() {
    if (!paragraph.length) return;
    output.push(`<p>${applyFootnoteRefs(inlineMarkdown(paragraph.join(" ")))}</p>`);
    paragraph = [];
  }

  function flushQuote() {
    if (!quote.length) return;
    const body = quote
      .join("\n")
      .replace(/^\[!NOTE\]\s*/m, "<strong>Note</strong>\n")
      .split(/\n{2,}/)
      .map((part) => `<p>${inlineMarkdown(part.replace(/\n/g, "<br>"))}</p>`)
      .join("");
    output.push(`<blockquote>${body}</blockquote>`);
    quote = [];
  }

  function flushTable() {
    if (!table.length) return;
    output.push(renderTable(table));
    table = [];
  }

  function flushList() {
    if (!list.length) return;
    output.push(renderList(list, listType));
    list = [];
    listType = null;
  }

  for (const line of lines) {
    if (codeFencePattern.test(line)) {
      flushParagraph();
      flushQuote();
      flushTable();
      flushList();
      if (inCode) {
        output.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      code.push(line);
      continue;
    }

    if (line.startsWith("@@HTML_BLOCK_")) {
      flushParagraph();
      flushQuote();
      flushTable();
      flushList();
      output.push(line);
      continue;
    }

    if (/^\|.+\|$/.test(line.trim())) {
      flushParagraph();
      flushQuote();
      flushList();
      table.push(line);
      continue;
    }

    flushTable();

    if (line.startsWith(">")) {
      flushParagraph();
      flushList();
      quote.push(line.replace(/^>\s?/, ""));
      continue;
    }

    flushQuote();

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      flushParagraph();
      flushList();
      output.push("<hr>");
      continue;
    }

    const listItem = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
    if (listItem) {
      flushParagraph();
      const nextListType = /\d+\./.test(listItem[2]) ? "ol" : "ul";
      if (listType && listType !== nextListType) flushList();
      listType = nextListType;
      list.push({
        indent: Math.floor(listItem[1].replace(/\t/g, "    ").length / 2),
        text: listItem[3].trim()
      });
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      headingIndex += 1;
      const level = heading[1].length;
      const text = inlineMarkdown(heading[2]);
      output.push(`<h${level} id="${headingId(chapter, headingIndex)}">${text}</h${level}>`);
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushQuote();
  flushTable();
  flushList();

  if (footnoteDefs.length) {
    const items = footnoteDefs
      .map(
        (def) =>
          `<li id="fn-${def.id}">${applyFootnoteRefs(inlineMarkdown(def.body))} <a href="#fnref-${def.id}" class="footnote-back" aria-label="返回正文">↩</a></li>`
      )
      .join("");
    output.push(`<section class="footnotes"><hr><ol>${items}</ol></section>`);
  }

  return output
    .join("\n")
    .replace(/@@HTML_BLOCK_(\d+)@@/g, (_, index) => htmlBlocks[Number(index)]);
}

async function loadMarkdown(chapter) {
  if (markdownCache.has(chapter.id)) return markdownCache.get(chapter.id);

  const response = await fetch(`${contentBase}${chapter.sourcePath}`);
  if (!response.ok) {
    throw new Error(`无法读取 ${chapter.sourcePath}`);
  }

  const markdown = await response.text();
  markdownCache.set(chapter.id, markdown);
  outlineCache.set(chapter.id, extractOutline(markdown, chapter));
  return markdown;
}

function showWelcome() {
  contentVisible = false;
  welcomePage.classList.remove("is-page-hidden");
  content.classList.add("is-content-hidden");
  history.replaceState(null, "", location.pathname);
  window.scrollTo({ top: 0, behavior: "smooth" });
  updateProgress();
}

function showContent({ scroll = true } = {}) {
  contentVisible = true;
  welcomePage.classList.add("is-page-hidden");
  content.classList.remove("is-content-hidden");
  if (scroll) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

async function renderChapter(index, options = {}) {
  const { updateHash = true, revealContent = true, scrollToContent = true, targetId = null } = options;
  currentIndex = index;
  if (targetId) {
    expandedChapters.clear();
    expandedChapters.add(index);
  }
  const chapter = chapters[index];
  currentTitle.textContent = chapter.title;
  previousButton.disabled = index === 0;
  nextButton.disabled = index === chapters.length - 1;
  updateChapterListState();
  article.innerHTML = '<div class="article-body"><p>正在加载教程内容...</p></div>';

  try {
    const markdown = await loadMarkdown(chapter);
    article.innerHTML = `<div class="article-body">${renderMarkdown(markdown, chapter)}</div>`;
  } catch (error) {
    article.innerHTML = `
      <div class="article-body">
        <h1>需要通过本地服务打开</h1>
        <p>浏览器直接打开 file 文件时可能无法读取 Markdown。请在项目根目录运行一个静态服务后访问 <code>web/index.html</code>。</p>
        <pre><code>python3 -m http.server 8080</code></pre>
      </div>
    `;
  }

  if (updateHash) {
    history.replaceState(null, "", `#${targetId || chapter.id}`);
  }
  if (revealContent) {
    showContent({ scroll: scrollToContent && !targetId });
  }
  if (targetId) {
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  updateProgress();
}

function updateChapterListState() {
  document.querySelectorAll(".chapter-toc").forEach((item, itemIndex) => {
    const isExpanded = expandedChapters.has(itemIndex);
    const isActive = itemIndex === currentIndex;
    item.classList.toggle("is-expanded", isExpanded);
    item.querySelector(".chapter-button")?.classList.toggle("is-active", isActive);
    item.querySelector(".chapter-toggle")?.setAttribute("aria-expanded", String(isExpanded));
  });
}

function renderWelcomeToc() {
  welcomeTocList.innerHTML = chapters
    .map(
      (chapter, index) => `
        <button class="welcome-toc-card" type="button" data-welcome-index="${index}">
          <span>0${index + 1}</span>
          <strong>${chapter.title}</strong>
          <small>${chapter.subtitle}</small>
        </button>
      `
    )
    .join("");

  welcomeTocList.addEventListener("click", (event) => {
    const card = event.target.closest("[data-welcome-index]");
    if (!card) return;
    renderChapter(Number(card.dataset.welcomeIndex), { scrollToContent: true });
  });
}

function prepareReadmeMarkdown(markdown) {
  return markdown
    .replace(/^# Agent GO!\s*/m, "")
    .replace(/^!\[Agent GO!\]\(\.\/assets\/github-header-banner\.png\)\s*/m, "")
    .replaceAll("](./", `](${contentBase}`);
}

async function renderWelcomeReadme() {
  try {
    const response = await fetch(`${contentBase}README.md`);
    if (!response.ok) throw new Error("README unavailable");
    const markdown = prepareReadmeMarkdown(await response.text());
    welcomeReadme.innerHTML = renderMarkdown(markdown, { id: "readme" });
  } catch (error) {
    welcomeReadme.innerHTML = `
      <h2>README</h2>
      <p>暂时无法读取 README 内容。请通过本地静态服务或 GitHub Pages 打开页面。</p>
    `;
  }
}

async function renderChapterList() {
  const outlines = await Promise.all(
    chapters.map(async (chapter) => {
      try {
        await loadMarkdown(chapter);
      } catch (error) {
        outlineCache.set(chapter.id, []);
      }
      return outlineCache.get(chapter.id) || [];
    })
  );

  chapterList.innerHTML = chapters
    .map(
      (chapter, index) => `
        <section class="chapter-toc">
          <div class="chapter-row">
            <button class="chapter-button" type="button" data-index="${index}">
              <strong>${chapter.title}</strong>
              <span>${chapter.subtitle}</span>
            </button>
            <button class="chapter-toggle" type="button" data-toggle-index="${index}" aria-label="展开或收起 ${chapter.title}" aria-expanded="false">
              <span aria-hidden="true">⌄</span>
            </button>
          </div>
          <div class="section-list">
            ${outlines[index]
              .map(
                (heading) => `
                  <button class="section-link is-level-${heading.level}" type="button" data-index="${index}" data-target="${heading.id}">
                    ${escapeHtml(heading.text)}
                  </button>
                `
              )
              .join("")}
          </div>
        </section>
      `
    )
    .join("");

  updateChapterListState();

  chapterList.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-toggle-index]");
    if (toggle) {
      const index = Number(toggle.dataset.toggleIndex);
      if (expandedChapters.has(index)) {
        expandedChapters.delete(index);
      } else {
        expandedChapters.clear();
        expandedChapters.add(index);
      }
      updateChapterListState();
      return;
    }

    const button = event.target.closest("[data-index]");
    if (!button) return;
    renderChapter(Number(button.dataset.index), { targetId: button.dataset.target || null });
  });
}

function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const percent = max <= 0 ? 0 : Math.min(1, window.scrollY / max);
  progress.style.width = `${percent * 100}%`;
}

previousButton.addEventListener("click", () => {
  if (currentIndex > 0) renderChapter(currentIndex - 1);
});

nextButton.addEventListener("click", () => {
  if (currentIndex < chapters.length - 1) renderChapter(currentIndex + 1);
});

startReadingButton.addEventListener("click", () => {
  renderChapter(currentIndex, { scrollToContent: true });
});

openCourseMapButton?.addEventListener("click", () => {
  showContent({ scroll: true });
});

document.querySelectorAll("[data-chapter-link]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    renderChapter(Number(link.dataset.chapterLink));
  });
});

window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("hashchange", () => {
  if (!window.location.hash) {
    showWelcome();
    return;
  }
  const nextIndex = chapters.findIndex((chapter) => `#${chapter.id}` === window.location.hash);
  if (nextIndex >= 0 && nextIndex !== currentIndex) renderChapter(nextIndex, { updateHash: false });
});

async function init() {
  loadProjectStats();
  renderWelcomeToc();
  renderWelcomeReadme();
  await renderChapterList();
  const initialHash = window.location.hash.slice(1);
  const initialIndex = chapters.findIndex((chapter) => chapter.id === initialHash);
  const sectionIndex = chapters.findIndex((chapter) =>
    (outlineCache.get(chapter.id) || []).some((heading) => heading.id === initialHash)
  );

  renderChapter(Math.max(0, initialIndex, sectionIndex), {
    updateHash: false,
    revealContent: initialIndex >= 0 || sectionIndex >= 0,
    scrollToContent: initialIndex >= 0,
    targetId: sectionIndex >= 0 ? initialHash : null
  });
}

init();
