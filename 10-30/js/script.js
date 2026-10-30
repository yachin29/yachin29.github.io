const courses = [
  {
    name: "はじめてのABC",
    tag: "えいごデビュー",
    age: "小学1〜2年生",
    description: "歌やカードで英語の音に親しみながら、あいさつや身近な単語を覚えます。",
    schedule: "週1回・45分",
    price: "月額 6,600円",
    imageAlt: "ABCや英語の音に親しむレッスン",
  },
  {
    name: "わくわく会話クラス",
    tag: "人気コース",
    age: "小学3〜4年生",
    description: "ゲームやペアワークで、好きなものや日々のことを英語で話してみよう。",
    schedule: "週1回・50分",
    price: "月額 7,700円",
    imageAlt: "友だちと英語で会話を楽しむレッスン",
  },
  {
    name: "英語でチャレンジ",
    tag: "ステップアップ",
    age: "小学5〜6年生",
    description: "自分の考えを英語で伝える練習。発表や読み書きにも楽しく挑戦します。",
    schedule: "週1回・60分",
    price: "月額 8,800円",
    imageAlt: "英語で自分の考えを伝えるレッスン",
  },
  {
    name: "えいごで絵本タイム",
    tag: "読み聞かせ",
    age: "小学1〜4年生",
    description: "英語の絵本を読んで、物語や登場人物について楽しくおしゃべりします。",
    schedule: "週1回・45分",
    price: "月額 7,700円",
    imageAlt: "英語の絵本を楽しむレッスン",
  },
  {
    name: "フォニックス探検隊",
    tag: "発音と読み書き",
    age: "小学2〜5年生",
    description: "アルファベットの音を探検しながら、初めて見る単語も読める力を育てます。",
    schedule: "週1回・50分",
    price: "月額 7,700円",
    imageAlt: "英語の音とつづりを学ぶレッスン",
  },
  {
    name: "えいごで世界旅行",
    tag: "テーマ学習",
    age: "小学3〜6年生",
    description: "世界の国や文化をテーマに、英語で質問したり自分の発見を伝えたりします。",
    schedule: "週1回・60分",
    price: "月額 8,800円",
    imageAlt: "世界の文化を英語で学ぶレッスン",
  },
];

const testimonials = [
  {
    quote: "毎週「今日は英語の日？」と楽しみにしています。家でも習った歌を口ずさむようになりました！",
    name: "小学2年生のお母さま",
    detail: "はじめてのABC・通学6か月",
    avatarAlt: "小学2年生の生徒さんの保護者",
  },
  {
    quote: "人前で話すのが苦手でしたが、先生が待ってくれるので、今では自分から英語で発表しています。",
    name: "小学4年生のお父さま",
    detail: "わくわく会話クラス・通学1年",
    avatarAlt: "小学4年生の生徒さんの保護者",
  },
  {
    quote: "ゲームで覚えた英語を使って、旅行先でお店の人に話しかけられました。自信がついたみたいです。",
    name: "小学6年生のお母さま",
    detail: "英語でチャレンジ・通学2年",
    avatarAlt: "小学6年生の生徒さんの保護者",
  },
];

const faqs = [
  {
    question: "英語がはじめてでも大丈夫ですか？",
    answer: "もちろん大丈夫です。初めて英語にふれるお子さまも楽しめるよう、歌やゲームを取り入れながら一人ひとりのペースに合わせて進めます。",
  },
  {
    question: "クラスの人数は何人ですか？",
    answer: "1クラス最大6名の少人数制です。先生がお子さま一人ひとりの様子を見ながら、話す機会をしっかりつくります。",
  },
  {
    question: "体験レッスンに必要な持ち物はありますか？",
    answer: "特別な持ち物はありません。筆記用具だけお持ちください。体験レッスンは無料で、保護者の方も一緒に見学いただけます。",
  },
  {
    question: "振替レッスンはできますか？",
    answer: "事前にご連絡いただければ、月1回まで振替レッスンをご利用いただけます。振替方法や空き状況は体験時にご案内します。",
  },
];

const courseList = document.querySelector("#course-list");
const voiceList = document.querySelector("#voice-list");
const faqList = document.querySelector("#faq-list");

function getCourseCardMarkup(course) {
  return `
    <img src="https://placehold.jp/600x400.png?text=Item" alt="${course.imageAlt}" loading="lazy">
    <div class="course-card-content">
      <div class="course-meta">
        <span class="course-tag">${course.tag}</span>
        <span class="course-age">${course.age}</span>
      </div>
      <h3>${course.name}</h3>
      <p>${course.description}</p>
      <div class="course-detail"><span>${course.schedule}</span><strong>${course.price}</strong></div>
    </div>
  `;
}

courseList.innerHTML = courses.slice(0, 3).map((course, index) => `
  <article class="course-card" data-course-index="${index}" role="group" aria-roledescription="スライド">
    ${getCourseCardMarkup(course)}
  </article>
`).join("");

const courseCarouselStatus = document.querySelector("#course-carousel-status");
const carouselControls = document.querySelector(".carousel-controls");
let isCourseCarouselAnimating = false;
let courseCarouselStart = 0;

function updateCourseCarousel() {
  const cards = Array.from(courseList.querySelectorAll(".course-card"));
  const activeIndex = Math.floor(cards.length / 2);

  cards.forEach((card, index) => {
    const courseIndex = Number(card.dataset.courseIndex);
    const course = courses[courseIndex];
    card.classList.toggle("is-active", index === activeIndex);
    card.setAttribute("aria-label", `${courseIndex + 1} / ${courses.length}：${course.name}`);
  });

  if (cards.length > 0) {
    const activeCourse = courses[Number(cards[activeIndex].dataset.courseIndex)];
    courseCarouselStatus.textContent = `表示中 3 / ${courses.length}コース｜中央：${activeCourse.name}`;
  }
}

function moveCourseCarousel(direction) {
  const cards = Array.from(courseList.querySelectorAll(".course-card"));
  if (isCourseCarouselAnimating || cards.length !== 3 || courses.length <= cards.length) return;

  const canAnimate = window.gsap
    && window.Flip
    && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const flipState = canAnimate ? window.Flip.getState(cards) : null;
  const outgoingCard = direction > 0 ? cards[0] : cards[cards.length - 1];

  if (direction > 0) {
    courseList.append(outgoingCard);
  } else {
    courseList.prepend(outgoingCard);
  }

  isCourseCarouselAnimating = canAnimate;
  courseList.classList.toggle("is-flipping", canAnimate);
  courseList.setAttribute("aria-busy", "true");
  updateCourseCarousel();

  const finishTransition = () => {
    courseCarouselStart = (courseCarouselStart + direction + courses.length) % courses.length;
    const incomingIndex = direction > 0
      ? (courseCarouselStart + cards.length - 1) % courses.length
      : courseCarouselStart;
    outgoingCard.dataset.courseIndex = String(incomingIndex);
    outgoingCard.innerHTML = getCourseCardMarkup(courses[incomingIndex]);
    updateCourseCarousel();
    isCourseCarouselAnimating = false;
    courseList.classList.remove("is-flipping");
    courseList.removeAttribute("aria-busy");
  };

  if (!canAnimate) {
    finishTransition();
    return;
  }

  window.Flip.from(flipState, {
    duration: 0.65,
    ease: "power2.inOut",
    onComplete: finishTransition,
  });
}

updateCourseCarousel();
carouselControls.addEventListener("click", (event) => {
  const button = event.target.closest("[data-course-direction]");
  if (!button) return;
  moveCourseCarousel(Number(button.dataset.courseDirection));
});

voiceList.innerHTML = testimonials.map((testimonial) => `
  <article class="voice-card">
    <div class="voice-stars" aria-label="5つ星評価">★★★★★</div>
    <blockquote>${testimonial.quote}</blockquote>
    <div class="voice-person">
      <img src="https://placehold.jp/150x150.png?text=User" alt="${testimonial.avatarAlt}" loading="lazy">
      <div><strong>${testimonial.name}</strong><span>${testimonial.detail}</span></div>
    </div>
  </article>
`).join("");

faqList.innerHTML = faqs.map((faq, index) => `
  <article class="faq-item">
    <button class="faq-question" type="button" aria-expanded="false" aria-controls="faq-answer-${index}" id="faq-question-${index}">
      <span class="faq-q-mark" aria-hidden="true">Q.</span>
      <span>${faq.question}</span>
      <span class="faq-toggle-icon" aria-hidden="true"></span>
    </button>
    <div class="faq-answer" id="faq-answer-${index}" role="region" aria-labelledby="faq-question-${index}">
      <div class="faq-answer-inner">
        <span class="faq-a-mark" aria-hidden="true">A.</span>
        <p>${faq.answer}</p>
      </div>
    </div>
  </article>
`).join("");

faqList.addEventListener("click", (event) => {
  const question = event.target.closest(".faq-question");
  if (!question) return;

  const answer = document.getElementById(question.getAttribute("aria-controls"));
  const isExpanded = question.getAttribute("aria-expanded") === "true";
  question.setAttribute("aria-expanded", String(!isExpanded));
  answer.classList.toggle("is-open", !isExpanded);
});

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute("aria-label", isExpanded ? "メニューを開く" : "メニューを閉じる");
  siteNav.classList.toggle("is-open", !isExpanded);
});

siteNav.addEventListener("click", (event) => {
  if (!event.target.closest("a")) return;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "メニューを開く");
  siteNav.classList.remove("is-open");
});

document.querySelector("#current-year").textContent = new Date().getFullYear();

function initializeAnimations() {
  if (!window.gsap || !window.ScrollTrigger) {
    console.warn("GSAPの読み込みに失敗したため、アニメーションをスキップしました。");
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  gsap.registerPlugin(ScrollTrigger);
  if (window.Flip) gsap.registerPlugin(Flip);

  const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
  heroTimeline
    .from(".hero-copy .eyebrow", { autoAlpha: 0, y: 18, duration: 0.5 })
    .from(".hero-copy h1", { autoAlpha: 0, y: 28, duration: 0.7 }, "-=0.25")
    .from(".hero-description", { autoAlpha: 0, y: 18, duration: 0.5 }, "-=0.35")
    .from(".hero-actions, .hero-proof", { autoAlpha: 0, y: 16, duration: 0.5, stagger: 0.12 }, "-=0.25")
    .from(".hero-visual", { autoAlpha: 0, scale: 0.94, duration: 0.8 }, "-=0.55");

  gsap.to(".visual-spark", {
    y: -10,
    rotation: 12,
    duration: 1.8,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
    stagger: 0.35,
  });

  gsap.utils.toArray(".section-heading, .faq-intro").forEach((heading) => {
    gsap.fromTo(
      heading,
      { autoAlpha: 0, y: 24 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.65,
        ease: "power2.out",
        scrollTrigger: {
          trigger: heading,
          start: "top 86%",
          once: true,
        },
      },
    );
  });

  [
    { container: ".feature-grid", cards: ".feature-card" },
    { container: "#voice-list", cards: ".voice-card" },
    { container: "#faq-list", cards: ".faq-item" },
  ].forEach(({ container, cards }) => {
    gsap.fromTo(
      `${container} ${cards}`,
      { autoAlpha: 0, y: 28 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.55,
        ease: "power2.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: container,
          start: "top 84%",
          once: true,
        },
      },
    );
  });

  gsap.fromTo(
    ".contact-panel",
    { autoAlpha: 0, y: 30, scale: 0.98 },
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.7,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".contact-panel",
        start: "top 85%",
        once: true,
      },
    },
  );
}

initializeAnimations();
