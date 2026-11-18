(() => {
  const tools = [
    {
      title: "Min-Max clamp() Calculator",
      description: "サイズとビューポート幅から、レスポンシブな CSS clamp() を計算。挙動プレビューや px ⇄ rem 変換もできます。",
      href: "./app-01/",
      category: "css",
      categoryLabel: "CSS",
      keywords: "clamp responsive typography font-size px rem calculator 計算",
      index: "01",
    },
    {
      title: "WebP Bulk Converter",
      description: "画像をブラウザー内で一括 WebP 変換・リサイズ。変換した画像は個別または ZIP で保存できます。",
      href: "./app-02/",
      category: "image",
      categoryLabel: "画像",
      keywords: "webp image convert resize compression zip 変換 圧縮",
      index: "02",
    },
    {
      title: "Code Work",
      description: "HTML・CSS・JavaScript・jQuery のコードを打ち込んで練習できる、タイピングトレーニングツールです。",
      href: "./code-work/",
      category: "practice",
      categoryLabel: "練習",
      keywords: "code typing html css javascript jquery practice コーディング タイピング",
      index: "03",
    },
  ];

  const elements = {
    themeToggle: document.querySelector("#theme-toggle"),
    searchInput: document.querySelector("#search-input"),
    resetFilters: document.querySelector("#reset-filters"),
    filters: document.querySelectorAll(".category-filter"),
    toolList: document.querySelector("#tool-list"),
    resultsCount: document.querySelector("#results-count"),
    emptyState: document.querySelector("#empty-state"),
  };
  let activeCategory = "all";

  function updateThemeToggle() {
    const isDark = document.documentElement.classList.contains("dark");
    document.querySelector('meta[name="theme-color"]').content = isDark
      ? "#020617"
      : "#f8fafc";
    elements.themeToggle.textContent = isDark
      ? "ライトモードに切り替え"
      : "ダークモードに切り替え";
    elements.themeToggle.setAttribute("aria-pressed", String(isDark));
  }

  function applyTheme(theme) {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    updateThemeToggle();
  }

  function updateFilterStyles() {
    elements.filters.forEach((button) => {
      const selected = button.dataset.category === activeCategory;
      button.setAttribute("aria-pressed", String(selected));
      button.className = [
        "category-filter rounded-full border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500",
        selected
          ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500"
          : "border-slate-300 bg-white text-slate-700 hover:border-indigo-500 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white",
      ].join(" ");
    });
  }

  function renderTools() {
    const query = elements.searchInput.value.trim().toLocaleLowerCase();
    const matchingTools = tools.filter((tool) => {
      const matchesCategory = activeCategory === "all" || tool.category === activeCategory;
      const searchableText = `${tool.title} ${tool.description} ${tool.categoryLabel} ${tool.keywords}`.toLocaleLowerCase();
      return matchesCategory && searchableText.includes(query);
    });

    elements.toolList.replaceChildren();
    matchingTools.forEach((tool) => {
      const card = document.createElement("article");
      card.className = "group flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-950/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700 dark:hover:shadow-black/20";

      const header = document.createElement("div");
      header.className = "mb-5 flex items-center justify-between";
      const number = document.createElement("span");
      number.className = "font-mono text-sm font-semibold text-slate-400 dark:text-slate-500";
      number.textContent = `TOOL ${tool.index}`;
      const category = document.createElement("span");
      category.className = "rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300";
      category.textContent = tool.categoryLabel;
      header.append(number, category);

      const title = document.createElement("h3");
      title.className = "text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100";
      title.textContent = tool.title;
      const description = document.createElement("p");
      description.className = "mt-2 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-400";
      description.textContent = tool.description;

      const link = document.createElement("a");
      link.href = tool.href;
      link.className = "mt-6 inline-flex items-center gap-2 self-start rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900";
      link.append(document.createTextNode("ツールを開く"));
      const arrow = document.createElement("span");
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "→";
      link.append(arrow);

      card.append(header, title, description, link);
      elements.toolList.append(card);
    });

    elements.resultsCount.textContent = `${matchingTools.length} / ${tools.length} 件`;
    elements.emptyState.classList.toggle("hidden", matchingTools.length !== 0);
  }

  elements.filters.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      updateFilterStyles();
      renderTools();
    });
  });
  elements.searchInput.addEventListener("input", renderTools);
  elements.resetFilters.addEventListener("click", () => {
    elements.searchInput.value = "";
    activeCategory = "all";
    updateFilterStyles();
    renderTools();
  });
  elements.themeToggle.addEventListener("click", () => {
    const theme = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";
    localStorage.setItem("web-tools-theme", theme);
    applyTheme(theme);
  });

  applyTheme(localStorage.getItem("web-tools-theme"));
  updateFilterStyles();
  renderTools();
})();
