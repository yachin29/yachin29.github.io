    (() => {
      "use strict";

      const CATEGORY_NAMES = {
        html: "HTML",
        css: "CSS",
        javascript: "JavaScript",
        jquery: "jQuery",
      };
      const SCORE_KEY = "codeDrill_highScores";
      const CLEARED_KEY = "codeDrill_cleared";
      const THEME_KEY = "codeDrill_theme";
      const CHALLENGE_SECONDS = 600;
      const $ = (selector) => document.querySelector(selector);
      const elements = {
        categoryTabs: [...document.querySelectorAll(".category-tab")],
        practiceMode: $("#practice-mode"),
        attackMode: $("#attack-mode"),
        themeToggle: $("#theme-toggle"),
        themeIcon: $("#theme-icon"),
        themeLabel: $("#theme-label"),
        highScore: $("#high-score"),
        recordBadge: $("#record-badge"),
        timer: $("#timer"),
        wpm: $("#wpm"),
        accuracy: $("#accuracy"),
        progressLabel: $("#progress-label"),
        progress: $("#progress"),
        categoryLabel: $("#category-label"),
        problemCount: $("#problem-count"),
        problemTitle: $("#problem-title"),
        problemSelect: $("#problem-select"),
        clearedMark: $("#cleared-mark"),
        codeDisplay: $("#code-display"),
        input: $("#typing-input"),
        attackControls: $("#attack-controls"),
        attackHint: $("#attack-hint"),
        startButton: $("#start-button"),
        modeNote: $("#mode-note"),
        loadError: $("#load-error"),
        toast: $("#toast"),
        toastMessage: $("#toast-message"),
        resultModal: $("#result-modal"),
      };

      let problems = {};
      let category = "html";
      let mode = "practice";
      let problemIndex = 0;
      let highScores = loadStoredObject(SCORE_KEY, makeCategoryObject(() => 0));
      let clearedProblems = loadStoredObject(CLEARED_KEY, makeCategoryObject(() => []));
      let timerInterval = null;
      let toastTimeout = null;
      let transitionTimeout = null;
      let challengeActive = false;
      let challengeDeadline = 0;
      let challengeStartedAt = 0;
      let practiceStartedAt = 0;
      let score = 0;
      let clearedInChallenge = 0;
      let challengeCorrectChars = 0;
      let problemHasMistake = false;
      let isTransitioning = false;
      let newRecord = false;
      let totalTyped = 0;
      let totalCorrect = 0;

      function makeCategoryObject(factory) {
        return Object.fromEntries(Object.keys(CATEGORY_NAMES).map((key) => [key, factory()]));
      }

      function loadStoredObject(key, fallback) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || "null");
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fallback;
          return { ...fallback, ...parsed };
        } catch (error) {
          console.error(`保存データ ${key} の読み込みに失敗しました。`, error);
          return fallback;
        }
      }

      function saveStoredObject(key, value) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error(`保存データ ${key} の書き込みに失敗しました。`, error);
          showError("ブラウザーの保存領域に書き込めませんでした。プライベートブラウズ設定などをご確認ください。");
        }
      }

      function normalizeText(text) {
        return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      }

      function currentProblems() {
        return problems[category] || [];
      }

      function currentProblem() {
        return currentProblems()[problemIndex];
      }

      function clearedIds(key = category) {
        const ids = clearedProblems[key];
        return Array.isArray(ids) ? ids : [];
      }

      function showError(message) {
        elements.loadError.textContent = message;
        elements.loadError.classList.remove("hidden");
      }

      function loadTheme() {
        try {
          return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
        } catch (error) {
          console.error("テーマ設定の読み込みに失敗しました。", error);
          return "dark";
        }
      }

      function applyTheme(theme, persist = false) {
        const selectedTheme = theme === "light" ? "light" : "dark";
        const isLight = selectedTheme === "light";
        document.documentElement.dataset.theme = selectedTheme;
        elements.themeIcon.textContent = isLight ? "☾" : "☀";
        elements.themeLabel.textContent = isLight ? "ダークモード" : "ライトモード";
        const nextThemeLabel = isLight ? "ダークモード" : "ライトモード";
        elements.themeToggle.setAttribute("aria-label", `${nextThemeLabel}に切り替え`);
        elements.themeToggle.title = `${nextThemeLabel}に切り替え`;
        $('meta[name="theme-color"]').content = isLight ? "#f8fafc" : "#020617";

        if (persist) {
          try {
            localStorage.setItem(THEME_KEY, selectedTheme);
          } catch (error) {
            console.error("テーマ設定の保存に失敗しました。", error);
            showError("テーマ設定を保存できませんでした。ブラウザーの保存領域をご確認ください。");
          }
        }
      }

      function updateHighScores() {
        for (const key of Object.keys(CATEGORY_NAMES)) {
          const best = Number(highScores[key]) || 0;
          $(`#best-${key}`).textContent = best.toLocaleString("ja-JP");
        }
        elements.highScore.textContent = `${(Number(highScores[category]) || 0).toLocaleString("ja-JP")} pt`;
      }

      function updateTabs() {
        for (const button of elements.categoryTabs) {
          const selected = button.dataset.category === category;
          button.disabled = challengeActive;
          button.className = `category-tab rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            selected
              ? "border-sky-400 bg-sky-400/10 text-sky-200"
              : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-slate-200"
          }`;
          button.setAttribute("aria-pressed", String(selected));
        }
        for (const [button, selected] of [
          [elements.practiceMode, mode === "practice"],
          [elements.attackMode, mode === "attack"],
        ]) {
          button.disabled = challengeActive;
          button.className = `mode-tab rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            selected
              ? "border-violet-400 bg-violet-400/10 text-violet-200"
              : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-slate-200"
          }`;
          button.setAttribute("aria-pressed", String(selected));
        }
      }

      function updateProblemSelector() {
        const list = currentProblems();
        elements.problemSelect.replaceChildren();
        list.forEach((problem, index) => {
          const option = document.createElement("option");
          option.value = String(index);
          const isCleared = mode === "practice" && clearedIds().includes(problem.id);
          option.textContent = `${isCleared ? "✓ " : ""}${String(index + 1).padStart(2, "0")} - ${problem.title}`;
          elements.problemSelect.append(option);
        });
        elements.problemSelect.value = String(problemIndex);
        elements.problemSelect.disabled = challengeActive || list.length === 0;
      }

      function renderCode() {
        const problem = currentProblem();
        if (!problem) {
          elements.codeDisplay.textContent = "";
          return;
        }
        const expected = normalizeText(problem.code);
        const actual = normalizeText(elements.input.value);
        const fragment = document.createDocumentFragment();
        for (let index = 0; index < expected.length; index += 1) {
          const span = document.createElement("span");
          span.className = "code-char";
          span.textContent = expected[index];
          if (index < actual.length) {
            if (actual[index] === expected[index]) {
              span.classList.add("text-emerald-400");
            } else {
              span.classList.add("bg-rose-500/40", "text-rose-200");
            }
          } else if (index === actual.length) {
            span.classList.add("border-b-2", "border-amber-400", "bg-amber-400/30", "text-amber-100");
          }
          fragment.append(span);
        }
        elements.codeDisplay.replaceChildren(fragment);
      }

      function updateClearedMark() {
        const problem = currentProblem();
        const isCleared = Boolean(problem && clearedIds().includes(problem.id));
        elements.clearedMark.classList.toggle("hidden", !isCleared);
      }

      function updateStats() {
        const problem = currentProblem();
        const actual = normalizeText(elements.input.value);
        const expected = problem ? normalizeText(problem.code) : "";
        let correctCount = 0;
        for (let index = 0; index < Math.min(actual.length, expected.length); index += 1) {
          if (actual[index] === expected[index]) correctCount += 1;
        }
        const elapsedMs = mode === "attack"
          ? (challengeStartedAt ? Date.now() - challengeStartedAt : 0)
          : (practiceStartedAt ? Date.now() - practiceStartedAt : 0);
        const wpm = elapsedMs > 0
          ? Math.round((mode === "attack" ? challengeCorrectChars + correctCount : totalCorrect + correctCount) / 5 / (elapsedMs / 60000))
          : 0;
        const accuracy = actual.length
          ? Math.round((correctCount / actual.length) * 100)
          : 100;
        elements.wpm.textContent = String(wpm);
        elements.accuracy.textContent = `${accuracy}%`;
        elements.progressLabel.textContent = mode === "attack" ? "Score" : "Cleared";
        elements.progress.textContent = mode === "attack"
          ? `${score.toLocaleString("ja-JP")} pt`
          : `${clearedIds().length} / ${currentProblems().length}`;
      }

      function updateScreen() {
        const problem = currentProblem();
        elements.categoryLabel.textContent = CATEGORY_NAMES[category];
        elements.problemCount.textContent = `問題 ${problemIndex + 1} / ${currentProblems().length}`;
        elements.problemTitle.textContent = problem ? problem.title : "問題がありません";
        elements.input.value = "";
        elements.input.disabled = !problem || (mode === "attack" && !challengeActive);
        elements.input.placeholder = mode === "attack" && !challengeActive
          ? "チャレンジ開始後に入力できます..."
          : "ここをクリックしてタイピングを開始...";
        elements.attackControls.classList.toggle("hidden", mode !== "attack");
        elements.attackControls.classList.toggle("flex", mode === "attack");
        elements.modeNote.textContent = mode === "attack"
          ? "完全一致でクリア。1問ごとに基本点・文字数ボーナス・ノーミスボーナスを獲得します。"
          : "問題を最後まで正確に入力すると、自動で次の問題へ進みます。";
        elements.timer.textContent = mode === "attack" ? "10:00" : "∞";
        elements.recordBadge.classList.toggle("hidden", mode !== "attack" || !newRecord);
        updateProblemSelector();
        updateClearedMark();
        updateHighScores();
        updateTabs();
        renderCode();
        updateStats();
        updateAttackControls();
      }

      function updateAttackControls() {
        if (mode !== "attack") return;
        if (challengeActive) {
          elements.attackHint.textContent = "チャレンジ進行中です。集中して入力しましょう！";
          elements.startButton.textContent = "チャレンジ中...";
          elements.startButton.disabled = true;
        } else {
          elements.attackHint.textContent = "10分間で何問クリアできるか挑戦しましょう。";
          elements.startButton.textContent = "10分チャレンジ開始！";
          elements.startButton.disabled = currentProblems().length === 0;
        }
      }

      function setCategory(nextCategory) {
        if (challengeActive || !CATEGORY_NAMES[nextCategory]) return;
        category = nextCategory;
        problemIndex = 0;
        score = 0;
        clearedInChallenge = 0;
        challengeCorrectChars = 0;
        problemHasMistake = false;
        totalTyped = 0;
        totalCorrect = 0;
        practiceStartedAt = 0;
        newRecord = false;
        elements.recordBadge.classList.add("hidden");
        updateScreen();
      }

      function setMode(nextMode) {
        if (challengeActive || !["practice", "attack"].includes(nextMode)) return;
        mode = nextMode;
        problemHasMistake = false;
        newRecord = false;
        elements.recordBadge.classList.add("hidden");
        updateScreen();
      }

      function changeProblem(nextIndex) {
        const list = currentProblems();
        if (!list.length) return;
        problemIndex = (nextIndex + list.length) % list.length;
        problemHasMistake = false;
        isTransitioning = false;
        updateScreen();
        if (mode === "practice" || challengeActive) elements.input.focus();
      }

      function maybeUpdateRecord() {
        const currentBest = Number(highScores[category]) || 0;
        if (score > currentBest) {
          highScores[category] = score;
          newRecord = true;
          saveStoredObject(SCORE_KEY, highScores);
          updateHighScores();
        }
        elements.recordBadge.classList.toggle("hidden", mode !== "attack" || !newRecord);
      }

      function showToast(message) {
        window.clearTimeout(toastTimeout);
        elements.toastMessage.textContent = message;
        elements.toast.classList.remove("opacity-0");
        elements.toast.classList.add("opacity-100");
        toastTimeout = window.setTimeout(() => {
          elements.toast.classList.remove("opacity-100");
          elements.toast.classList.add("opacity-0");
        }, 850);
      }

      function clearCurrentProblem() {
        if (isTransitioning) return;
        isTransitioning = true;
        const problem = currentProblem();
        let earned = 0;
        if (mode === "practice") {
          const ids = clearedIds();
          if (!ids.includes(problem.id)) {
            clearedProblems[category] = [...ids, problem.id];
            saveStoredObject(CLEARED_KEY, clearedProblems);
          }
          totalCorrect += normalizeText(problem.code).length;
        } else {
          earned = 1000 + normalizeText(problem.code).length * 10 + (problemHasMistake ? 0 : 300);
          score += earned;
          clearedInChallenge += 1;
          challengeCorrectChars += normalizeText(problem.code).length;
          maybeUpdateRecord();
        }
        updateStats();
        updateProblemSelector();
        updateClearedMark();
        showToast(mode === "attack" ? `CLEAR!  +${earned.toLocaleString("ja-JP")} pt` : "CLEAR!");
        window.clearTimeout(transitionTimeout);
        transitionTimeout = window.setTimeout(() => {
          if (challengeActive || mode === "practice") {
            changeProblem(problemIndex + 1);
          }
        }, 900);
      }

      function handleInput() {
        if (elements.input.disabled || isTransitioning) return;
        const problem = currentProblem();
        if (!problem) return;
        if (mode === "practice" && !practiceStartedAt && elements.input.value.length) {
          practiceStartedAt = Date.now();
        }
        const expected = normalizeText(problem.code);
        const actual = normalizeText(elements.input.value);
        if (actual.length > totalTyped) totalTyped += actual.length - totalTyped;
        if (actual.length > expected.length) problemHasMistake = true;
        for (let index = 0; index < Math.min(actual.length, expected.length); index += 1) {
          if (actual[index] !== expected[index]) {
            problemHasMistake = true;
            break;
          }
        }
        renderCode();
        updateStats();
        if (actual === expected) clearCurrentProblem();
      }

      function startChallenge() {
        if (mode !== "attack" || challengeActive || !currentProblems().length) return;
        window.clearTimeout(transitionTimeout);
        challengeActive = true;
        challengeStartedAt = Date.now();
        challengeDeadline = challengeStartedAt + CHALLENGE_SECONDS * 1000;
        score = 0;
        clearedInChallenge = 0;
        challengeCorrectChars = 0;
        problemHasMistake = false;
        newRecord = false;
        isTransitioning = false;
        elements.recordBadge.classList.add("hidden");
        updateScreen();
        elements.input.focus();
        timerInterval = window.setInterval(updateTimer, 200);
        updateTimer();
      }

      function updateTimer() {
        if (!challengeActive) return;
        const remaining = Math.max(0, Math.ceil((challengeDeadline - Date.now()) / 1000));
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        elements.timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        if (remaining === 0) finishChallenge();
      }

      function finishChallenge() {
        if (!challengeActive) return;
        challengeActive = false;
        window.clearInterval(timerInterval);
        window.clearTimeout(transitionTimeout);
        isTransitioning = false;
        elements.input.disabled = true;
        updateTabs();
        updateProblemSelector();
        elements.timer.textContent = "00:00";
        const elapsedMinutes = Math.max((Date.now() - challengeStartedAt) / 60000, 1 / 60);
        const averageWpm = Math.round(challengeCorrectChars / 5 / elapsedMinutes);
        const rank = score >= 30000 ? "S" : score >= 20000 ? "A" : score >= 10000 ? "B" : "C";
        $("#result-category").textContent = CATEGORY_NAMES[category];
        $("#result-score").textContent = score.toLocaleString("ja-JP");
        $("#result-best").textContent = `${(Number(highScores[category]) || 0).toLocaleString("ja-JP")} pt`;
        $("#result-cleared").textContent = `${clearedInChallenge} 問`;
        $("#result-wpm").textContent = String(averageWpm);
        $("#result-rank").textContent = `${rank} RANK`;
        elements.resultModal.classList.remove("hidden");
        elements.resultModal.classList.add("flex");
        $("#retry-button").focus();
      }

      function closeResult() {
        elements.resultModal.classList.add("hidden");
        elements.resultModal.classList.remove("flex");
      }

      elements.categoryTabs.forEach((button) => {
        button.addEventListener("click", () => setCategory(button.dataset.category));
      });
      elements.practiceMode.addEventListener("click", () => setMode("practice"));
      elements.attackMode.addEventListener("click", () => setMode("attack"));
      elements.themeToggle.addEventListener("click", () => {
        const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
        applyTheme(nextTheme, true);
      });
      elements.problemSelect.addEventListener("change", () => {
        if (!challengeActive) changeProblem(Number(elements.problemSelect.value));
      });
      elements.input.addEventListener("input", handleInput);
      elements.input.addEventListener("keydown", (event) => {
        if (event.key !== "Tab" || elements.input.disabled) return;
        event.preventDefault();
        const input = elements.input;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.setRangeText("  ", start, end, "end");
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
      elements.input.addEventListener("paste", (event) => event.preventDefault());
      elements.input.addEventListener("drop", (event) => event.preventDefault());
      elements.startButton.addEventListener("click", startChallenge);
      $("#retry-button").addEventListener("click", () => {
        closeResult();
        startChallenge();
      });
      $("#return-practice-button").addEventListener("click", () => {
        closeResult();
        setMode("practice");
      });
      elements.resultModal.addEventListener("click", (event) => {
        if (event.target === elements.resultModal) return;
      });

      async function initialize() {
        applyTheme(loadTheme());
        const params = new URLSearchParams(window.location.search);
        if (CATEGORY_NAMES[params.get("category")]) category = params.get("category");
        if (params.get("mode") === "attack") mode = "attack";
        else if (params.get("mode") === "practice") mode = "practice";
        updateHighScores();
        try {
          const response = await fetch(`./problems.json?t=${Date.now()}`, { cache: "no-store" });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          for (const key of Object.keys(CATEGORY_NAMES)) {
            if (!Array.isArray(data[key]) || data[key].length !== 40 || data[key].some((item) =>
              !item || !Number.isInteger(item.id) || typeof item.title !== "string" || typeof item.code !== "string"
            )) {
              throw new Error(`問題データ「${key}」の形式が正しくありません。各カテゴリーに40問必要です。`);
            }
          }
          problems = data;
          elements.problemSelect.disabled = false;
          updateScreen();
        } catch (error) {
          console.error("問題データの読み込みに失敗しました。", error);
          showError(`問題データを読み込めませんでした。Webサーバー経由でアクセスし、problems.json が配置されていることをご確認ください。(${error.message})`);
          elements.problemTitle.textContent = "問題データを読み込めません";
          elements.input.disabled = true;
          elements.startButton.disabled = true;
        }
      }

      initialize();
    })();
