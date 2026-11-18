(() => {
  const rootSize = 16;
  const elements = {
    themeToggle: document.querySelector("#theme-toggle"),
    minSize: document.querySelector("#min-size"),
    maxSize: document.querySelector("#max-size"),
    minVw: document.querySelector("#min-vw"),
    maxVw: document.querySelector("#max-vw"),
    minRem: document.querySelector("#min-rem"),
    maxRem: document.querySelector("#max-rem"),
    minVwRem: document.querySelector("#min-vw-rem"),
    maxVwRem: document.querySelector("#max-vw-rem"),
    includeProperty: document.querySelector("#include-property"),
    output: document.querySelector("#css-output"),
    calculationError: document.querySelector("#calculation-error"),
    copyCss: document.querySelector("#copy-css"),
    previewWidth: document.querySelector("#preview-width"),
    previewResult: document.querySelector("#preview-result"),
    sampleText: document.querySelector("#sample-text"),
    convertPx: document.querySelector("#convert-px"),
    convertRem: document.querySelector("#convert-rem"),
    converterError: document.querySelector("#converter-error"),
    copyRem: document.querySelector("#copy-rem"),
  };

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

  const precision = (value) => {
    if (!Number.isFinite(value)) return "";
    return String(Number(value.toFixed(4)));
  };

  const numericValue = (input) => {
    if (input.value.trim() === "") return null;
    const value = Number(input.value);
    return Number.isFinite(value) ? value : null;
  };

  function getValues() {
    return {
      min: numericValue(elements.minSize),
      max: numericValue(elements.maxSize),
      minVw: numericValue(elements.minVw),
      maxVw: numericValue(elements.maxVw),
      root: rootSize,
    };
  }

  function updateUrl(values) {
    if ([values.min, values.max, values.minVw, values.maxVw].some((value) => value === null)) return;
    const query = [values.min, values.max, values.minVw, values.maxVw].map(precision).join(",");
    window.history.replaceState(null, "", `${window.location.pathname}?${query}${window.location.hash}`);
  }

  function updateRemLabels(values) {
    elements.minRem.textContent = values.min === null || values.root === null ? "—" : `${precision(values.min / values.root)}rem`;
    elements.maxRem.textContent = values.max === null || values.root === null ? "—" : `${precision(values.max / values.root)}rem`;
    elements.minVwRem.textContent = values.minVw === null || values.root === null ? "—" : `${precision(values.minVw / values.root)}rem`;
    elements.maxVwRem.textContent = values.maxVw === null || values.root === null ? "—" : `${precision(values.maxVw / values.root)}rem`;
  }

  function sizeAtWidth(values, width) {
    const slope = (values.max - values.min) / (values.maxVw - values.minVw);
    const interpolatedSize = values.min + (width - values.minVw) * slope;
    const lowerBound = Math.min(values.min, values.max);
    const upperBound = Math.max(values.min, values.max);
    return Math.max(lowerBound, Math.min(upperBound, interpolatedSize));
  }

  function updatePreview(values, valid) {
    if (!valid) {
      elements.previewResult.textContent = "入力値を確認してください";
      elements.sampleText.style.removeProperty("font-size");
      return;
    }

    const width = Number(elements.previewWidth.value);
    const size = sizeAtWidth(values, width);
    if (!Number.isFinite(size)) {
      elements.previewResult.textContent = "プレビューを計算できません";
      elements.sampleText.style.removeProperty("font-size");
      return;
    }
    elements.previewResult.textContent = `幅 ${width}px 時 → ${precision(size)}px (${precision(size / values.root)}rem)`;
    elements.sampleText.style.fontSize = `${size}px`;
  }

  function update(syncUrl = true) {
    const values = getValues();
    const inputsValid = Object.values(values).every((value) => value !== null);
    const widthsValid = inputsValid && values.minVw !== values.maxVw;
    const valid = widthsValid && values.minVw > 0 && values.maxVw > 0;
    updateRemLabels(values);
    elements.calculationError.textContent = !inputsValid
      ? "すべての入力欄に有効な数値を入力してください。ルートサイズは0より大きい値が必要です。"
      : values.minVw === values.maxVw
        ? "最小画面幅と最大画面幅は異なる値にしてください。"
        : !valid
          ? "画面幅は0より大きい値にしてください。"
          : "";

    if (valid) {
      const slopeVw = ((values.max - values.min) / (values.maxVw - values.minVw)) * 100;
      const yRem = (values.min - values.minVw * slopeVw / 100) / values.root;
      const clampMin = Math.min(values.min / values.root, values.max / values.root);
      const clampMax = Math.max(values.min / values.root, values.max / values.root);
      const sign = slopeVw < 0 ? "-" : "+";
      const preferred = `${precision(yRem)}rem ${sign} ${precision(Math.abs(slopeVw))}vw`;
      const clamp = `clamp(${precision(clampMin)}rem, ${preferred}, ${precision(clampMax)}rem)`;
      elements.output.textContent = elements.includeProperty.checked ? `font-size: ${clamp};` : clamp;
    } else {
      elements.output.textContent = "";
    }
    elements.copyCss.disabled = !valid;
    updatePreview(values, valid);
    if (syncUrl) updateUrl(values);
  }

  function loadUrlValues() {
    const query = window.location.search.slice(1);
    if (!query) return;
    const rawParts = query.split(",");
    if (rawParts.length !== 4 || rawParts.some((part) => part.trim() === "")) return;
    const parts = rawParts.map(Number);
    if (parts.some((value) => !Number.isFinite(value))) return;
    [elements.minSize.value, elements.maxSize.value, elements.minVw.value, elements.maxVw.value] = parts.map(String);
  }

  function flashButton(button, originalText, successText) {
    const originalColorClasses = ["bg-indigo-600", "hover:bg-indigo-500"]
      .filter((className) => button.classList.contains(className));
    button.textContent = successText;
    originalColorClasses.forEach((className) => button.classList.remove(className));
    button.classList.add("bg-emerald-600");
    window.setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove("bg-emerald-600");
      originalColorClasses.forEach((className) => button.classList.add(className));
    }, 1500);
  }

  async function copyText(text, button, originalText, successText, errorElement) {
    try {
      await navigator.clipboard.writeText(text);
      flashButton(button, originalText, successText);
    } catch (error) {
      errorElement.textContent = "クリップボードにコピーできませんでした。ブラウザーの権限を確認してください。";
      console.error("Clipboard copy failed:", error);
    }
  }

  [elements.minSize, elements.maxSize, elements.minVw, elements.maxVw, elements.includeProperty]
    .forEach((input) => input.addEventListener("input", update));

  document.querySelectorAll("[data-viewport]").forEach((button) => {
    button.addEventListener("click", () => {
      const [minVw, maxVw] = button.dataset.viewport.split(",");
      elements.minVw.value = minVw;
      elements.maxVw.value = maxVw;
      update();
    });
  });

  elements.copyCss.addEventListener("click", () => {
    copyText(elements.output.textContent, elements.copyCss, "コピー", "コピー完了!", elements.calculationError);
  });

  elements.previewWidth.addEventListener("input", () => updatePreview(getValues(), elements.output.textContent !== ""));

  elements.convertPx.addEventListener("input", () => {
    const px = numericValue(elements.convertPx);
    if (px === null) {
      elements.convertRem.value = "";
      elements.converterError.textContent = "pxに有効な数値を入力してください。";
      return;
    }
    elements.convertRem.value = precision(px / rootSize);
    elements.converterError.textContent = "";
  });

  elements.convertRem.addEventListener("input", () => {
    const rem = numericValue(elements.convertRem);
    if (rem === null) {
      elements.convertPx.value = "";
      elements.converterError.textContent = "remに有効な数値を入力してください。";
      return;
    }
    elements.convertPx.value = precision(rem * rootSize);
    elements.converterError.textContent = "";
  });

  elements.copyRem.addEventListener("click", () => {
    const rem = numericValue(elements.convertRem);
    if (rem === null) {
      elements.converterError.textContent = "コピーするrem値を入力してください。";
      return;
    }
    copyText(`${precision(rem)}rem`, elements.copyRem, "remをコピー", "コピー完了!", elements.converterError);
  });

  elements.themeToggle.addEventListener("click", () => {
    const theme = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";
    localStorage.setItem("web-tools-theme", theme);
    applyTheme(theme);
  });

  applyTheme(localStorage.getItem("web-tools-theme"));
  loadUrlValues();
  update(false);
})();
