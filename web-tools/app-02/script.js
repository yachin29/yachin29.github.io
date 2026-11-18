(() => {
  const acceptedTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
  const elements = {
    themeToggle: document.querySelector("#theme-toggle"),
    quality: document.querySelector("#quality"),
    qualityValue: document.querySelector("#quality-value"),
    resizeEnabled: document.querySelector("#resize-enabled"),
    maxWidth: document.querySelector("#max-width"),
    suffix: document.querySelector("#suffix"),
    settingsError: document.querySelector("#settings-error"),
    dropzone: document.querySelector("#dropzone"),
    fileInput: document.querySelector("#file-input"),
    progress: document.querySelector("#progress"),
    results: document.querySelector("#results"),
    summary: document.querySelector("#summary"),
    fileList: document.querySelector("#file-list"),
    clearAll: document.querySelector("#clear-all"),
    downloadZip: document.querySelector("#download-zip"),
    zipError: document.querySelector("#zip-error"),
  };
  const files = [];
  let nextId = 0;
  let settingsVersion = 0;
  let isProcessing = false;
  let isZipping = false;
  let widthDebounceTimer = null;

  function updateThemeToggle() {
    const isDark = document.documentElement.classList.contains("dark");
    document.querySelector('meta[name="theme-color"]').content = isDark
      ? "#020617"
      : "#f8fafc";
    elements.themeToggle.textContent = isDark ? "ライトモードに切り替え" : "ダークモードに切り替え";
    elements.themeToggle.setAttribute("aria-pressed", String(isDark));
  }

  function applyTheme(theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
    updateThemeToggle();
  }

  function formatBytes(bytes) {
    if (bytes < 1000) return `${bytes} B`;
    if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(bytes < 10_000 ? 1 : 0)} KB`;
    return `${(bytes / 1_000_000).toFixed(bytes < 10_000_000 ? 1 : 0)} MB`;
  }

  function safeFilePart(value) {
    return value.replace(/[\\/\\:\u0000-\u001f\u007f]/g, "_").trim() || "image";
  }

  function makeOutputNames() {
    const used = new Set();
    const suffix = elements.suffix.value
      ? safeFilePart(elements.suffix.value)
      : "";
    return files.map((entry) => {
      const sourceName = entry.file.name;
      const dot = sourceName.lastIndexOf(".");
      const stem = dot > 0 ? sourceName.slice(0, dot) : sourceName;
      const base = `${safeFilePart(stem)}${suffix}` || "image";
      let candidate = `${base}.webp`;
      let sequence = 1;
      while (used.has(candidate.toLocaleLowerCase())) {
        candidate = `${base}(${sequence}).webp`;
        sequence += 1;
      }
      used.add(candidate.toLocaleLowerCase());
      return candidate;
    });
  }

  function updateSummary() {
    const inputBytes = files.reduce((total, entry) => total + entry.file.size, 0);
    const outputBytes = files.reduce((total, entry) => total + (entry.blob?.size ?? 0), 0);
    const reduction = inputBytes > 0 ? Math.round((1 - outputBytes / inputBytes) * 100) : 0;
    elements.summary.textContent = `合計 ${files.length}枚 | ${formatBytes(inputBytes)} → ${formatBytes(outputBytes)} (${reduction >= 0 ? "-" : "+"}${Math.abs(reduction)}%)`;
    elements.results.classList.toggle("hidden", files.length === 0);
    elements.downloadZip.disabled = isProcessing || isZipping || widthDebounceTimer !== null || !files.some((entry) => entry.blob);
    elements.clearAll.disabled = files.length === 0;
  }

  function render() {
    const names = makeOutputNames();
    elements.fileList.replaceChildren();

    files.forEach((entry, index) => {
      const row = document.createElement("li");
      row.className = "flex flex-col gap-3 py-4 sm:flex-row sm:items-center";

      const thumbnail = document.createElement("div");
      thumbnail.className = "checkerboard flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700";
      thumbnail.style.backgroundImage = "linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)";
      thumbnail.style.backgroundPosition = "0 0, 0 6px, 6px -6px, -6px 0";
      thumbnail.style.backgroundSize = "12px 12px";
      if (entry.url) {
        const image = document.createElement("img");
        image.src = entry.url;
        image.alt = "";
        image.className = "h-full w-full object-contain";
        thumbnail.append(image);
      } else {
        thumbnail.textContent = entry.status === "error" ? "!" : "…";
        thumbnail.setAttribute("aria-hidden", "true");
      }

      const details = document.createElement("div");
      details.className = "min-w-0 flex-1";
      const name = document.createElement("p");
      name.className = "break-all text-sm font-semibold text-slate-900 dark:text-slate-100";
      name.textContent = names[index];
      const dimensions = document.createElement("p");
      dimensions.className = "mt-1 text-xs text-slate-500 dark:text-slate-400";
      dimensions.textContent = entry.width && entry.height
        ? `${entry.width} × ${entry.height}${entry.status === "error" ? ` · ${entry.error}` : ""}`
        : entry.status === "error" ? entry.error : "変換待ち";
      details.append(name, dimensions);

      const metrics = document.createElement("div");
      metrics.className = "flex flex-wrap items-center gap-2 text-xs";
      if (entry.blob) {
        const size = document.createElement("span");
        size.className = "text-slate-600 dark:text-slate-400";
        size.textContent = `${formatBytes(entry.file.size)} → ${formatBytes(entry.blob.size)}`;
        const change = entry.file.size > 0 ? Math.round((entry.blob.size / entry.file.size - 1) * 100) : 0;
        const badge = document.createElement("span");
        badge.className = change > 0
          ? "rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300"
          : "rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
        badge.textContent = change > 0 ? `+${change}% 増加` : `-${Math.abs(change)}%`;
        metrics.append(size, badge);
      } else if (entry.status === "processing") {
        const state = document.createElement("span");
        state.className = "text-indigo-700 dark:text-indigo-300";
        state.textContent = "変換中…";
        metrics.append(state);
      }

      const actions = document.createElement("div");
      actions.className = "flex shrink-0 items-center gap-2";
      if (entry.blob) {
        const download = document.createElement("a");
        download.href = entry.url;
        download.download = names[index];
        download.className = "rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500";
        download.textContent = "ダウンロード";
        actions.append(download);
      }
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-rose-400 hover:text-rose-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-rose-300";
      remove.textContent = "削除";
      remove.setAttribute("aria-label", `${names[index]} を削除`);
      remove.addEventListener("click", () => removeEntry(entry));
      actions.append(remove);

      row.append(thumbnail, details, metrics, actions);
      elements.fileList.append(row);
    });
    updateSummary();
  }

  function revokeEntryUrl(entry) {
    if (!entry.url) return;
    URL.revokeObjectURL(entry.url);
    entry.url = null;
  }

  function removeEntry(entry) {
    revokeEntryUrl(entry);
    const index = files.indexOf(entry);
    if (index !== -1) files.splice(index, 1);
    render();
  }

  function getSettings() {
    const quality = Number(elements.quality.value);
    const maxWidth = Number(elements.maxWidth.value);
    if (!Number.isInteger(maxWidth) || maxWidth < 1) {
      elements.settingsError.textContent = "最大横幅には1以上の整数を入力してください。";
      return null;
    }
    elements.settingsError.textContent = "";
    return { quality: quality / 100, maxWidth: elements.resizeEnabled.checked ? maxWidth : Infinity };
  }

  function loadImage(file) {
    if (typeof createImageBitmap === "function") {
      return createImageBitmap(file).then((bitmap) => ({
        image: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      }));
    }
    return new Promise((resolve, reject) => {
      const sourceUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => resolve({
        image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        close: () => URL.revokeObjectURL(sourceUrl),
      });
      image.onerror = () => {
        URL.revokeObjectURL(sourceUrl);
        reject(new Error("画像を読み込めませんでした"));
      };
      image.src = sourceUrl;
    });
  }

  function canvasToWebp(canvas, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("WebPに変換できませんでした"));
          return;
        }
        if (blob.type !== "image/webp") {
          reject(new Error("このブラウザーはWebP出力に対応していません"));
          return;
        }
        resolve(blob);
      }, "image/webp", quality);
    });
  }

  async function convert(entry, settings) {
    const loaded = await loadImage(entry.file);
    try {
      const width = Math.min(loaded.width, settings.maxWidth);
      const height = Math.max(1, Math.round(loaded.height * width / loaded.width));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("画像処理用のCanvasを作成できませんでした");
      context.drawImage(loaded.image, 0, 0, width, height);
      const blob = await canvasToWebp(canvas, settings.quality);
      return { blob, width, height };
    } finally {
      loaded.close();
    }
  }

  async function processQueue() {
    if (isProcessing || widthDebounceTimer !== null) return;
    isProcessing = true;
    render();
    try {
      while (widthDebounceTimer === null) {
        const pending = files.filter((entry) => entry.convertedVersion !== settingsVersion);
        if (pending.length === 0) break;
        const currentVersion = settingsVersion;
        const settings = getSettings();
        if (!settings) break;

        for (const entry of pending) {
          if (settingsVersion !== currentVersion || widthDebounceTimer !== null) break;
          if (!files.includes(entry)) continue;
          entry.status = "processing";
          entry.error = "";
          render();
          elements.progress.textContent = `変換中... ${pending.indexOf(entry) + 1} / ${pending.length}枚`;
          await new Promise((resolve) => window.setTimeout(resolve, 0));
          try {
            const result = await convert(entry, settings);
            if (settingsVersion !== currentVersion || !files.includes(entry)) continue;
            revokeEntryUrl(entry);
            entry.blob = result.blob;
            entry.url = URL.createObjectURL(result.blob);
            entry.width = result.width;
            entry.height = result.height;
            entry.status = "done";
            entry.convertedVersion = currentVersion;
          } catch (error) {
            if (settingsVersion !== currentVersion || !files.includes(entry)) continue;
            revokeEntryUrl(entry);
            entry.blob = null;
            entry.status = "error";
            entry.error = error instanceof Error ? error.message : "変換に失敗しました";
            entry.convertedVersion = currentVersion;
            console.error("Image conversion failed:", error);
          }
          render();
        }
      }
    } finally {
      isProcessing = false;
      elements.progress.textContent = widthDebounceTimer !== null && files.length
        ? "設定変更を待っています..."
        : files.some((entry) => entry.status === "error")
        ? "変換に失敗した画像があります。ファイル形式や画像の状態をご確認ください。"
        : files.length ? `変換完了: ${files.length}枚` : "";
      render();
    }
  }

  function addFiles(fileList) {
    const incoming = Array.from(fileList);
    const validFiles = incoming.filter((file) =>
      acceptedTypes.has(file.type) || (!file.type && /\.(jpe?g|png|gif|webp)$/i.test(file.name))
    );
    const rejectedCount = incoming.length - validFiles.length;
    if (rejectedCount > 0) {
      elements.progress.textContent = `${rejectedCount}個のファイルは未対応の形式のため追加されませんでした。`;
    }
    if (validFiles.length === 0) return;

    validFiles.forEach((file) => files.push({
      id: nextId++,
      file,
      blob: null,
      url: null,
      width: 0,
      height: 0,
      status: "pending",
      error: "",
      convertedVersion: -1,
    }));
    render();
    processQueue();
  }

  function clearAll() {
    files.forEach(revokeEntryUrl);
    files.splice(0, files.length);
    elements.progress.textContent = "";
    elements.zipError.textContent = "";
    render();
  }

  async function downloadZip() {
    const converted = files.filter((entry) => entry.blob);
    if (converted.length === 0) return;
    if (typeof window.JSZip !== "function") {
      elements.zipError.textContent = "ZIPライブラリーを読み込めませんでした。ネットワーク接続を確認してください。";
      return;
    }
    isZipping = true;
    elements.zipError.textContent = "";
    updateSummary();
    try {
      const zip = new window.JSZip();
      const names = makeOutputNames();
      converted.forEach((entry) => zip.file(names[files.indexOf(entry)], entry.blob));
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "webp-images.zip";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      elements.zipError.textContent = "ZIPファイルを作成できませんでした。";
      console.error("ZIP generation failed:", error);
    } finally {
      isZipping = false;
      updateSummary();
    }
  }

  elements.quality.addEventListener("input", () => {
    elements.qualityValue.textContent = `${elements.quality.value}%`;
    document.querySelectorAll("[data-quality]").forEach((button) => {
      const selected = button.dataset.quality === elements.quality.value;
      button.classList.toggle("border-indigo-500", selected);
      button.classList.toggle("bg-indigo-50", selected);
      button.classList.toggle("text-indigo-700", selected);
      button.classList.toggle("dark:bg-indigo-950", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    settingsVersion += 1;
    processQueue();
  });
  document.querySelectorAll("[data-quality]").forEach((button) => {
    button.addEventListener("click", () => {
      elements.quality.value = button.dataset.quality;
      elements.quality.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });
  elements.maxWidth.addEventListener("input", () => {
    settingsVersion += 1;
    window.clearTimeout(widthDebounceTimer);
    widthDebounceTimer = window.setTimeout(() => {
      widthDebounceTimer = null;
      processQueue();
    }, 300);
    render();
  });
  elements.resizeEnabled.addEventListener("change", () => {
    settingsVersion += 1;
    processQueue();
  });
  elements.suffix.addEventListener("input", render);
  document.querySelectorAll("[data-width]").forEach((button) => {
    button.addEventListener("click", () => {
      elements.maxWidth.value = button.dataset.width;
      window.clearTimeout(widthDebounceTimer);
      widthDebounceTimer = null;
      settingsVersion += 1;
      processQueue();
    });
  });

  elements.dropzone.addEventListener("click", () => elements.fileInput.click());
  elements.dropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      elements.fileInput.click();
    }
  });
  elements.fileInput.addEventListener("change", () => {
    addFiles(elements.fileInput.files);
    elements.fileInput.value = "";
  });
  elements.dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    elements.dropzone.classList.add("border-indigo-500", "bg-indigo-50", "dark:bg-indigo-950/30");
  });
  elements.dropzone.addEventListener("dragleave", (event) => {
    if (!elements.dropzone.contains(event.relatedTarget)) {
      elements.dropzone.classList.remove("border-indigo-500", "bg-indigo-50", "dark:bg-indigo-950/30");
    }
  });
  elements.dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    elements.dropzone.classList.remove("border-indigo-500", "bg-indigo-50", "dark:bg-indigo-950/30");
    addFiles(event.dataTransfer.files);
  });
  elements.clearAll.addEventListener("click", clearAll);
  elements.downloadZip.addEventListener("click", downloadZip);
  elements.themeToggle.addEventListener("click", () => {
    const theme = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";
    localStorage.setItem("web-tools-theme", theme);
    applyTheme(theme);
  });

  applyTheme(localStorage.getItem("web-tools-theme"));
  document.querySelector('[data-quality="80"]').dispatchEvent(new Event("click"));
  render();
})();
