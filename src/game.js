const challengeForm = document.getElementById("challengeForm");
const sourceInput = document.getElementById("sourceInput");
const targetInput = document.getElementById("targetInput");
const startButton = document.getElementById("startButton");
const featuredButton = document.getElementById("featuredButton");
const resetRunButton = document.getElementById("resetRunButton");
const solutionButton = document.getElementById("solutionButton");
const readTargetButton = document.getElementById("readTargetButton");
const sourceTitle = document.getElementById("sourceTitle");
const targetTitle = document.getElementById("targetTitle");
const sourceImage = document.getElementById("sourceImage");
const targetImage = document.getElementById("targetImage");
const statusLabel = document.getElementById("statusLabel");
const distanceLabel = document.getElementById("distanceLabel");
const hintLabel = document.getElementById("hintLabel");
const pathList = document.getElementById("pathList");
const moveCounter = document.getElementById("moveCounter");
const currentTitle = document.getElementById("currentTitle");
const wikiLink = document.getElementById("wikiLink");
const extractText = document.getElementById("extractText");
const linkWindow = document.getElementById("linkWindow");
const resultModal = document.getElementById("resultModal");
const resultKicker = document.getElementById("resultKicker");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");
const playAgainButton = document.getElementById("playAgainButton");
const closeResultButton = document.getElementById("closeResultButton");

const WIKI_HOST = "zh.wikipedia.org";
const WIKI_VARIANT = "zh-hans";
const API = `https://${WIKI_HOST}/w/api.php`;
const MAX_DEPTH = 4;
const SEARCH_BATCH_LIMIT = 14;
const BACKLINK_SEARCH_LIMIT = 500;
const FEATURED_MIN_DISTANCE = 3;
const FEATURED_MAX_DISTANCE = 3;
const FEATURED_BFS_PAGE_LIMIT = 36;
const FEATURED_BFS_BRANCH_LIMIT = 8;
const CACHE = new Map();

const game = {
  source: "",
  target: "",
  shortestPath: [],
  shortestDistance: null,
  moveLimit: null,
  current: "",
  path: [],
  currentLinks: [],
  isPlaying: false,
  requestId: 0,
};

function todayParts() {
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: String(today.getMonth() + 1).padStart(2, "0"),
    day: String(today.getDate()).padStart(2, "0"),
  };
}

function titleKey(title) {
  return title.replace(/_/g, " ").trim().toLowerCase();
}

function wikiUrl(title) {
  return `https://${WIKI_HOST}/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}?variant=${WIKI_VARIANT}`;
}

async function wikiGet(params) {
  const url = new URL(API);
  url.search = new URLSearchParams({
    origin: "*",
    format: "json",
    formatversion: "2",
    uselang: WIKI_VARIANT,
    variant: WIKI_VARIANT,
    converttitles: "1",
    ...params,
  });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Chinese Wikipedia request failed with ${response.status}`);
  }
  return response.json();
}

async function getTodaysFeaturedArticle() {
  const { year, month, day } = todayParts();
  const url = `https://${WIKI_HOST}/api/rest_v1/feed/featured/${year}/${month}/${day}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not load today's featured Chinese Wikipedia article.");
  }

  const data = await response.json();
  const title = data.tfa?.titles?.normalized || data.tfa?.title;
  if (!title) {
    throw new Error("Today's featured Chinese Wikipedia article was not available.");
  }
  return title;
}

async function getPageSummary(title) {
  const key = `summary:${titleKey(title)}`;
  if (CACHE.has(key)) return CACHE.get(key);

  const data = await wikiGet({
    action: "query",
    prop: "extracts|pageimages",
    exintro: "1",
    explaintext: "1",
    exsentences: "3",
    piprop: "thumbnail",
    pithumbsize: "420",
    redirects: "1",
    titles: title,
  });

  const page = data.query.pages[0];
  if (page.missing) {
    throw new Error(`No Chinese Wikipedia page found for "${title}".`);
  }

  const displayTitle = await getPageDisplayTitle(page.title);
  const summary = {
    title: displayTitle,
    canonicalTitle: page.title,
    extract: page.extract || "No page summary is available, but its links can still be explored.",
    thumbnail: page.thumbnail?.source || "",
  };
  CACHE.set(key, summary);
  return summary;
}

async function getPageDisplayTitle(title) {
  const key = `display-title:${titleKey(title)}`;
  if (CACHE.has(key)) return CACHE.get(key);

  const data = await wikiGet({
    action: "parse",
    page: title,
    prop: "displaytitle",
    redirects: "1",
  });

  if (data.error) {
    return title;
  }

  const template = document.createElement("template");
  template.innerHTML = data.parse.displaytitle || data.parse.title || title;
  const displayTitle = template.content.textContent.trim() || data.parse.title || title;
  CACHE.set(key, displayTitle);
  return displayTitle;
}

async function getPageHtml(title) {
  const key = `html:${titleKey(title)}`;
  if (CACHE.has(key)) return CACHE.get(key);

  const data = await wikiGet({
    action: "parse",
    page: title,
    prop: "text",
    redirects: "1",
    disableeditsection: "1",
    disablelimitreport: "1",
  });

  if (data.error) {
    throw new Error(`Could not load the article view for "${title}".`);
  }

  const template = document.createElement("template");
  template.innerHTML = data.parse.text;

  for (const node of template.content.querySelectorAll("script, style, form, iframe, .mw-editsection")) {
    node.remove();
  }

  for (const node of template.content.querySelectorAll(
    [
      ".ambox",
      ".catlinks",
      ".hatnote",
      ".infobox",
      ".metadata",
      ".navbox",
      ".printfooter",
      ".reflist",
      ".shortdescription",
      ".sidebar",
      ".sistersitebox",
      ".toc",
      ".thumb",
      "figure",
      "sup.reference",
      "table.vertical-navbox",
    ].join(", "),
  )) {
    node.remove();
  }

  removeCitationLinks(template.content);
  removeBackMatterSections(template.content);

  for (const link of template.content.querySelectorAll("a[href]")) {
    const href = link.getAttribute("href");
    if (!href) continue;

    link.removeAttribute("onclick");

    if (href.startsWith("//")) link.href = `https:${href}`;
    if (href.startsWith("/wiki/")) {
      const wikiTitle = decodeURIComponent(href.slice("/wiki/".length)).replaceAll("_", " ");
      if (isGoodChallengeLink(wikiTitle)) {
        link.href = wikiUrl(wikiTitle);
        link.dataset.wikiTitle = wikiTitle;
      } else {
        link.href = wikiUrl(wikiTitle);
        link.target = "_blank";
        link.rel = "noreferrer";
      }
    } else if (link.href) {
      link.target = "_blank";
      link.rel = "noreferrer";
    }
  }

  for (const image of template.content.querySelectorAll("img[src]")) {
    const src = image.getAttribute("src");
    if (src?.startsWith("//")) image.src = `https:${src}`;
  }

  const html = template.innerHTML;
  CACHE.set(key, html);
  return html;
}

function removeCitationLinks(root) {
  const citationSelectors = [
    ".citation",
    ".citation-needed",
    ".noprint.Inline-Template",
    ".reference",
    ".reference-accessdate",
    ".reference-text",
    ".Template-Fact",
    "a[href^=\"#cite_note\"]",
    "a[href^=\"#cite_ref\"]",
    "a[href*=\"#cite_note\"]",
    "a[href*=\"#cite_ref\"]",
    "a[href^=\"./#cite_note\"]",
    "a[href^=\"./#cite_ref\"]",
    "span[id^=\"cite_note\"]",
    "span[id^=\"cite_ref\"]",
  ];

  for (const node of root.querySelectorAll(citationSelectors.join(", "))) {
    node.remove();
  }
}

function removeBackMatterSections(root) {
  const backMatterHeadings = new Set([
    "bibliography",
    "external links",
    "further reading",
    "notes",
    "references",
    "see also",
    "参考",
    "参考文献",
    "参考来源",
    "参考资料",
    "參考",
    "參考文獻",
    "參考來源",
    "參考資料",
    "参见",
    "參見",
    "外部链接",
    "外部連結",
    "延伸阅读",
    "延伸閱讀",
    "相关条目",
    "相關條目",
    "注释",
    "註釋",
    "脚注",
    "腳註",
  ]);

  for (const heading of [...root.querySelectorAll("h2")]) {
    const headingText = heading.textContent.replace(/\[edit\]/gi, "").trim().toLowerCase();
    if (!backMatterHeadings.has(headingText)) continue;

    let node = heading;
    while (node) {
      const next = node.nextElementSibling;
      node.remove();
      if (next?.tagName === "H2") break;
      node = next;
    }
  }
}

async function getPlayablePageLinks(title) {
  const key = `playable-links:${titleKey(title)}`;
  if (CACHE.has(key)) return CACHE.get(key);

  const html = await getPageHtml(title);
  const template = document.createElement("template");
  template.innerHTML = html;
  const links = [...template.content.querySelectorAll("a[data-wiki-title]")]
    .filter((link) => !isCitationHref(link.getAttribute("href") || ""))
    .map((link) => link.dataset.wikiTitle)
    .filter(Boolean);
  const uniqueLinks = [...new Set(links)];
  CACHE.set(key, uniqueLinks);
  return uniqueLinks;
}

function isCitationHref(href) {
  return href.includes("#cite_note") || href.includes("#cite_ref");
}

async function getPageLinks(title) {
  const key = `links:${titleKey(title)}`;
  if (CACHE.has(key)) return CACHE.get(key);

  let links = [];
  let plcontinue = null;

  do {
    const data = await wikiGet({
      action: "query",
      prop: "links",
      plnamespace: "0",
      pllimit: "max",
      redirects: "1",
      titles: title,
      ...(plcontinue ? { plcontinue } : {}),
    });

    const page = data.query.pages[0];
    if (page.missing) {
      throw new Error(`No Chinese Wikipedia page found for "${title}".`);
    }

    links = links.concat((page.links || []).map((link) => link.title));
    plcontinue = data.continue?.plcontinue || null;
  } while (plcontinue);

  const uniqueLinks = [...new Set(links)]
    .filter((link) => !link.includes(":"))
    .sort((a, b) => a.localeCompare(b));
  CACHE.set(key, uniqueLinks);
  return uniqueLinks;
}

async function getBacklinks(title) {
  const key = `backlinks:${titleKey(title)}`;
  if (CACHE.has(key)) return CACHE.get(key);

  const data = await wikiGet({
    action: "query",
    list: "backlinks",
    blnamespace: "0",
    bllimit: String(BACKLINK_SEARCH_LIMIT),
    bltitle: title,
    blfilterredir: "nonredirects",
  });

  const links = (data.query.backlinks || []).map((link) => link.title);

  const uniqueLinks = [...new Set(links)]
    .filter((link) => !link.includes(":"))
    .sort((a, b) => a.localeCompare(b));
  CACHE.set(key, uniqueLinks);
  return uniqueLinks;
}

function stableHash(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let value = seed || 1;
  return () => {
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleStable(items, seedText) {
  const random = seededRandom(stableHash(seedText));
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function shuffleRandom(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function isGoodChallengeLink(title) {
  return (
    title.length >= 4 &&
    title.length <= 72 &&
    !title.includes(":") &&
    !title.includes("：") &&
    !title.includes("(disambiguation)") &&
    !title.includes("(消歧义)") &&
    !title.includes("（消歧义）") &&
    !title.startsWith("List of ") &&
    !title.startsWith("Index of ") &&
    !title.startsWith("Outline of ") &&
    !title.startsWith("Portal:") &&
    !title.startsWith("列表") &&
    !title.startsWith("索引") &&
    !title.startsWith("大纲") &&
    !title.startsWith("大綱")
  );
}

function pickBfsLinks(links) {
  const goodLinks = links.filter(isGoodChallengeLink);
  return shuffleRandom(goodLinks).slice(0, FEATURED_BFS_BRANCH_LIMIT);
}

async function findFeaturedTargetPath(source) {
  const sourceSummary = await getPageSummary(source);
  const sourceCanonical = sourceSummary.title;
  const visited = new Set([titleKey(sourceCanonical)]);
  let frontier = [{ title: sourceCanonical, path: [sourceCanonical] }];
  let pagesScanned = 0;
  const candidates = [];

  for (let depth = 1; depth <= FEATURED_MAX_DISTANCE; depth += 1) {
    const nextFrontier = [];
    const remainingBudget = FEATURED_BFS_PAGE_LIMIT - pagesScanned;
    const levelEntries = frontier.slice(0, remainingBudget);
    pagesScanned += levelEntries.length;

    const linkGroups = await Promise.all(
      levelEntries.map(async (entry) => {
        try {
          return { entry, links: await getPlayablePageLinks(entry.title) };
        } catch {
          return { entry, links: [] };
        }
      }),
    );

    for (const { entry, links: pageLinks } of linkGroups) {
      if (pageLinks.length === 0) {
        continue;
      }

      const links = pickBfsLinks(pageLinks);
      for (const linkedTitle of links) {
        const linkedKey = titleKey(linkedTitle);
        if (visited.has(linkedKey)) continue;

        visited.add(linkedKey);
        const path = [...entry.path, linkedTitle];
        const nextEntry = { title: linkedTitle, path };

        if (depth >= FEATURED_MIN_DISTANCE) {
          candidates.push(path);
        } else {
          nextFrontier.push(nextEntry);
        }
      }
    }

    if (candidates.length > 0) {
      const shuffledCandidates = shuffleRandom(candidates);
      for (const path of shuffledCandidates.slice(0, 30)) {
        try {
          await getPageSummary(path[path.length - 1]);
          return path;
        } catch {
          continue;
        }
      }
    }

    if (nextFrontier.length === 0 || pagesScanned >= FEATURED_BFS_PAGE_LIMIT) break;
    frontier = shuffleRandom(nextFrontier).slice(0, FEATURED_BFS_PAGE_LIMIT);
  }

  throw new Error("Could not find a 3-step featured challenge from today's article. Try again.");
}

async function findShortestPath(source, target) {
  const sourceSummary = await getPageSummary(source);
  const targetSummary = await getPageSummary(target);
  const sourceCanonical = sourceSummary.title;
  const targetCanonical = targetSummary.title;

  if (titleKey(sourceCanonical) === titleKey(targetCanonical)) {
    return [sourceCanonical];
  }

  const forwardVisited = new Map([[titleKey(sourceCanonical), [sourceCanonical]]]);
  const backwardVisited = new Map([[titleKey(targetCanonical), [targetCanonical]]]);
  let forwardFrontier = [sourceCanonical];
  let backwardFrontier = [targetCanonical];

  for (let depth = 0; depth < MAX_DEPTH; depth += 1) {
    const expandForward = forwardFrontier.length <= backwardFrontier.length;
    const frontier = expandForward ? forwardFrontier : backwardFrontier;
    const ownVisited = expandForward ? forwardVisited : backwardVisited;
    const otherVisited = expandForward ? backwardVisited : forwardVisited;
    const limitedFrontier = frontier.slice(0, SEARCH_BATCH_LIMIT);
    const nextFrontier = [];

    const linkGroups = await Promise.all(
      limitedFrontier.map((page) => (expandForward ? getPageLinks(page) : getBacklinks(page))),
    );

    for (let index = 0; index < limitedFrontier.length; index += 1) {
      const page = limitedFrontier[index];
      const basePath = ownVisited.get(titleKey(page));

      for (const linkedTitle of linkGroups[index]) {
        const linkedKey = titleKey(linkedTitle);
        if (ownVisited.has(linkedKey)) continue;

        const path = expandForward ? [...basePath, linkedTitle] : [linkedTitle, ...basePath];
        ownVisited.set(linkedKey, path);

        if (otherVisited.has(linkedKey)) {
          const otherPath = otherVisited.get(linkedKey);
          return expandForward ? [...path, ...otherPath.slice(1)] : [...otherPath, ...path.slice(1)];
        }

        nextFrontier.push(linkedTitle);
      }
    }

    if (expandForward) {
      forwardFrontier = nextFrontier;
    } else {
      backwardFrontier = nextFrontier;
    }
  }

  throw new Error(`No route found within ${MAX_DEPTH + 1} links. Try a broader or more closely related page pair.`);
}

function setLoading(isLoading, label = "Searching...") {
  if (startButton) {
    startButton.disabled = isLoading;
    startButton.textContent = isLoading ? label : "Find Path";
  }
  featuredButton.disabled = isLoading;
  solutionButton.disabled = isLoading || game.shortestPath.length === 0;
  featuredButton.textContent = isLoading ? "Building..." : "New Challenge";
  if (sourceInput) sourceInput.disabled = isLoading;
  if (targetInput) targetInput.disabled = isLoading;
}

function setImage(img, summary) {
  img.src = summary.thumbnail || "";
  img.classList.toggle("empty", !summary.thumbnail);
  img.alt = summary.thumbnail ? `${summary.title} thumbnail` : "";
}

function renderPath() {
  pathList.innerHTML = "";
  for (const [index, title] of game.path.entries()) {
    const item = document.createElement("li");
    item.innerHTML = `<span>${index}</span><strong>${title}</strong>`;
    pathList.appendChild(item);
  }
  moveCounter.textContent = moveLabel(Math.max(0, game.path.length - 1));
}

function renderArticle(html = "") {
  if (!game.isPlaying) {
    linkWindow.innerHTML = `<p class="empty-state">Start a challenge to browse the article.</p>`;
    return;
  }

  linkWindow.innerHTML = html || `<p class="empty-state">Loading article...</p>`;
  for (const link of linkWindow.querySelectorAll("a[data-wiki-title]")) {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (game.isPlaying) {
        chooseLink(link.dataset.wikiTitle);
      }
    });
  }
}

async function loadCurrentPage(title) {
  const requestId = ++game.requestId;
  currentTitle.textContent = title;
  wikiLink.href = wikiUrl(title);
  extractText.textContent = "Loading page summary and article...";
  linkWindow.innerHTML = `<p class="empty-state">Loading article...</p>`;

  const [summary, links, html] = await Promise.all([
    getPageSummary(title),
    getPlayablePageLinks(title),
    getPageHtml(title),
  ]);
  if (requestId !== game.requestId) return;

  game.current = summary.title;
  game.currentLinks = links;
  currentTitle.textContent = summary.title;
  wikiLink.href = wikiUrl(summary.title);
  extractText.textContent = summary.extract;
  renderArticle(html);
}

function showResult(kind, title, text) {
  resultModal.classList.remove("hidden");
  resultKicker.textContent = kind;
  resultTitle.textContent = title;
  resultText.textContent = text;
}

function hideResult() {
  resultModal.classList.add("hidden");
}

function moveLabel(count) {
  return `${count} move${count === 1 ? "" : "s"}`;
}

function allowedMoveLabel() {
  return `${moveLabel(game.shortestDistance)} path, ${moveLabel(game.moveLimit)} allowed`;
}

function clearChallengeActions() {
  game.shortestPath = [];
  game.shortestDistance = null;
  game.moveLimit = null;
  resetRunButton.disabled = true;
  solutionButton.disabled = true;
  readTargetButton.disabled = true;
}

async function startChallenge(event) {
  event?.preventDefault();
  hideResult();
  clearChallengeActions();
  setLoading(true);
  statusLabel.textContent = "Searching";
  distanceLabel.textContent = "...";
  hintLabel.textContent = "Finding the shortest route through Chinese Wikipedia links.";
  linkWindow.innerHTML = `<p class="empty-state">Computing shortest path...</p>`;

  try {
    const path = await findShortestPath(sourceInput.value, targetInput.value);
    const sourceSummary = await getPageSummary(path[0]);
    const targetSummary = await getPageSummary(path[path.length - 1]);

    game.source = sourceSummary.title;
    game.target = targetSummary.title;
    game.shortestPath = path;
    game.shortestDistance = path.length - 1;
    game.moveLimit = game.shortestDistance + 1;
    game.current = sourceSummary.title;
    game.path = [sourceSummary.title];
    game.isPlaying = true;

    sourceTitle.textContent = sourceSummary.title;
    targetTitle.textContent = targetSummary.title;
    if (sourceInput) sourceInput.value = sourceSummary.title;
    if (targetInput) targetInput.value = targetSummary.title;
    setImage(sourceImage, sourceSummary);
    setImage(targetImage, targetSummary);
    statusLabel.textContent = "Challenge ready";
    distanceLabel.textContent = allowedMoveLabel();
    hintLabel.textContent = `Reach the goal in ${moveLabel(game.moveLimit)} or fewer.`;
    resetRunButton.disabled = false;
    solutionButton.disabled = false;
    readTargetButton.disabled = false;
    renderPath();
    await loadCurrentPage(sourceSummary.title);
  } catch (error) {
    game.isPlaying = false;
    statusLabel.textContent = "Failed";
    distanceLabel.textContent = "-";
    hintLabel.textContent = error.message;
    linkWindow.innerHTML = `<p class="empty-state">${error.message}</p>`;
    resetRunButton.disabled = true;
    solutionButton.disabled = true;
    readTargetButton.disabled = true;
  } finally {
    setLoading(false);
  }
}

async function startWithKnownPath(path, statusText) {
  const sourceSummary = await getPageSummary(path[0]);
  const targetSummary = await getPageSummary(path[path.length - 1]);

  game.source = sourceSummary.title;
  game.target = targetSummary.title;
  game.shortestPath = path;
  game.shortestDistance = path.length - 1;
  game.moveLimit = game.shortestDistance + 1;
  game.current = sourceSummary.title;
  game.path = [sourceSummary.title];
  game.isPlaying = true;

  sourceTitle.textContent = sourceSummary.title;
  targetTitle.textContent = targetSummary.title;
  if (sourceInput) sourceInput.value = sourceSummary.title;
  if (targetInput) targetInput.value = targetSummary.title;
  setImage(sourceImage, sourceSummary);
  setImage(targetImage, targetSummary);
  statusLabel.textContent = statusText;
  distanceLabel.textContent = allowedMoveLabel();
  hintLabel.textContent = `Start at today's featured article and reach the goal in ${moveLabel(game.moveLimit)} or fewer.`;
  resetRunButton.disabled = false;
  solutionButton.disabled = false;
  readTargetButton.disabled = false;
  renderPath();
  await loadCurrentPage(sourceSummary.title);
}

async function startFeaturedChallenge() {
  hideResult();
  clearChallengeActions();
  setLoading(true, "Searching...");
  statusLabel.textContent = "Featured article";
  distanceLabel.textContent = "...";
  hintLabel.textContent = "Loading today's Chinese Wikipedia featured article, then running BFS for a 3-step target.";
  linkWindow.innerHTML = `<p class="empty-state">Building today's featured challenge...</p>`;

  try {
    const featuredTitle = await getTodaysFeaturedArticle();
    statusLabel.textContent = "BFS running";
    sourceTitle.textContent = featuredTitle;
    if (sourceInput) sourceInput.value = featuredTitle;
    hintLabel.textContent = `Starting from ${featuredTitle}. Searching outward for a Chinese Wikipedia page 3 clicks away.`;

    const path = await findFeaturedTargetPath(featuredTitle);
    await startWithKnownPath(path, "Featured challenge");
  } catch (error) {
    game.isPlaying = false;
    statusLabel.textContent = "Failed";
    distanceLabel.textContent = "-";
    hintLabel.textContent = error.message;
    linkWindow.innerHTML = `<p class="empty-state">${error.message}</p>`;
    resetRunButton.disabled = true;
    solutionButton.disabled = true;
    readTargetButton.disabled = true;
  } finally {
    setLoading(false);
  }
}

async function chooseLink(title) {
  if (!game.isPlaying) return;

  game.path.push(title);
  renderPath();

  if (titleKey(title) === titleKey(game.target)) {
    game.isPlaying = false;
    showResult("Solved", "Great!", `You reached ${game.target} in ${moveLabel(game.path.length - 1)}.`);
    return;
  }

  if (game.path.length - 1 > game.moveLimit) {
    game.isPlaying = false;
    showResult(
      "Failed",
      "Out of moves",
      `The shortest path is ${moveLabel(game.shortestDistance)}. You had ${moveLabel(game.moveLimit)} and used your last move on ${title}.`,
    );
    return;
  }

  await loadCurrentPage(title);
}

async function readTargetPage() {
  if (!game.target) return;
  hideResult();
  resultModal.classList.remove("hidden");
  resultKicker.textContent = "Goal page";
  resultTitle.textContent = game.target;
  resultText.innerHTML = `<span class="reader-loading">Loading destination article...</span>`;

  try {
    const html = await getPageHtml(game.target);
    const template = document.createElement("template");
    template.innerHTML = html;
    for (const link of template.content.querySelectorAll("a[href]")) {
      link.target = "_blank";
      link.rel = "noreferrer";
    }
    resultText.innerHTML = `<div class="target-reader">${template.innerHTML}</div>`;
  } catch (error) {
    resultText.textContent = error.message;
  }
}

function showSolution() {
  if (!game.shortestPath.length) return;

  hideResult();
  resultModal.classList.remove("hidden");
  resultKicker.textContent = "Solution";
  resultTitle.textContent = `${moveLabel(game.shortestDistance)} path`;
  resultText.innerHTML = `
    <div class="solution-destination">
      Destination: <a href="${wikiUrl(game.target)}" target="_blank" rel="noreferrer">${game.target}</a>
    </div>
    <ol class="solution-list">
      ${game.shortestPath
        .map(
          (title, index) => `
            <li class="${index === game.shortestPath.length - 1 ? "destination-step" : ""}">
              <span>${index}</span>
              <a href="${wikiUrl(title)}" target="_blank" rel="noreferrer">${title}</a>
              ${index === game.shortestPath.length - 1 ? "<strong>Destination</strong>" : ""}
            </li>
          `,
        )
        .join("")}
    </ol>
  `;
}

function resetRun() {
  if (!game.source) return;
  hideResult();
  game.path = [game.source];
  game.current = game.source;
  game.isPlaying = true;
  renderPath();
  loadCurrentPage(game.source);
}

challengeForm?.addEventListener("submit", startChallenge);
featuredButton.addEventListener("click", startFeaturedChallenge);
resetRunButton.addEventListener("click", resetRun);
solutionButton.addEventListener("click", showSolution);
readTargetButton.addEventListener("click", readTargetPage);

linkWindow.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link || !game.isPlaying) return;
  if (!link.dataset.wikiTitle) return;
  event.preventDefault();
  chooseLink(link.dataset.wikiTitle);
});

playAgainButton.addEventListener("click", () => {
  hideResult();
  resetRun();
});

closeResultButton.addEventListener("click", hideResult);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideResult();
});

renderPath();
renderArticle();
startFeaturedChallenge();
