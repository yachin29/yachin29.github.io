const menuItems = [
	{
		name: "うな重",
		label: "THE SIGNATURE",
		description: "炭火で香ばしく焼き上げたうなぎを、秘伝のたれとともに。",
		price: "3,600円（税込）"
	},
	{
		name: "うな肝",
		label: "A SPECIALTY",
		description: "ふっくらと炊き上げた肝を、濃厚なたれで味わう一品。",
		price: "900円（税込）"
	},
	{
		name: "うな玉",
		label: "A GENTLE FAVORITE",
		description: "だし香るふんわり玉子で、うなぎのおいしさを包みました。",
		price: "1,200円（税込）"
	}
];

const customerVoices = [
	{
		text: "香ばしい香りに誘われて初めて来店。外はパリッと、中はふっくらで、最後まで幸せな気分でした。",
		name: "静岡市・30代",
		image: "https://placehold.jp/150x150.png?text=User"
	},
	{
		text: "落ち着いた雰囲気で、家族との食事にぴったり。うな重はもちろん、うな玉もお気に入りです。",
		name: "焼津市・40代",
		image: "https://placehold.jp/150x150.png?text=User"
	},
	{
		text: "丁寧なおもてなしが心地よく、また来たいと思えるお店。静岡に来たら必ず立ち寄っています。",
		name: "県外・50代",
		image: "https://placehold.jp/150x150.png?text=User"
	}
];

const frequentlyAskedQuestions = [
	{
		question: "予約はできますか？",
		answer: "お電話にて承っております。お席に限りがございますので、特に週末や祝日は事前のご予約をおすすめします。"
	},
	{
		question: "駐車場はありますか？",
		answer: "店舗前に専用駐車場をご用意しております。満車の場合はお電話でスタッフまでお問い合わせください。"
	},
	{
		question: "テイクアウトはできますか？",
		answer: "うな重など一部メニューのお持ち帰りを承っております。ご注文はお電話にてお願いいたします。"
	},
	{
		question: "定休日や営業時間を教えてください。",
		answer: "営業時間は11:00〜14:00、17:00〜20:00、定休日は水曜日です。臨時休業の場合もございますので、ご来店前にお電話でご確認ください。"
	}
];

const menuList = document.querySelector("#menu-list");
const voiceList = document.querySelector("#voice-list");
const faqList = document.querySelector("#faq-list");

if (menuList) {
	menuList.innerHTML = menuItems.map((item, index) => `
		<article class="menu-card">
			<div class="menu-image-wrap">
				<img class="menu-image" src="https://placehold.jp/600x400.png?text=Item" alt="${item.name}のイメージ" loading="lazy">
				<span class="menu-number">0${index + 1}</span>
			</div>
			<div class="menu-card-body">
				<span class="card-number">${item.label}</span>
				<h3>${item.name}</h3>
				<p>${item.description}</p>
				<span class="menu-price">${item.price}</span>
			</div>
		</article>
	`).join("");
}

if (voiceList) {
	voiceList.innerHTML = customerVoices.map((voice) => `
		<article class="voice-card">
			<p class="voice-rating" aria-label="5つ星">★★★★★</p>
			<blockquote>「${voice.text}」</blockquote>
			<div class="voice-person">
				<img class="voice-avatar" src="${voice.image}" alt="" loading="lazy">
				<span>${voice.name}</span>
			</div>
		</article>
	`).join("");
}

if (faqList) {
	faqList.innerHTML = frequentlyAskedQuestions.map((faq, index) => `
		<article class="faq-item">
			<h3 class="faq-heading">
				<button class="faq-question" type="button" aria-expanded="false" aria-controls="faq-answer-${index}" id="faq-question-${index}">
					<span class="faq-question-label"><b>Q.</b>${faq.question}</span>
					<span class="faq-plus" aria-hidden="true"></span>
				</button>
			</h3>
			<div class="faq-answer" id="faq-answer-${index}" role="region" aria-labelledby="faq-question-${index}">
				<div class="faq-answer-inner"><p>${faq.answer}</p></div>
			</div>
		</article>
	`).join("");

	faqList.addEventListener("click", (event) => {
		const button = event.target.closest(".faq-question");
		if (!button) return;

		const item = button.closest(".faq-item");
		const isExpanded = button.getAttribute("aria-expanded") === "true";
		button.setAttribute("aria-expanded", String(!isExpanded));
		item.classList.toggle("is-open", !isExpanded);
	});
}

const menuToggle = document.querySelector(".menu-toggle");
const globalNav = document.querySelector("#global-nav");

if (menuToggle && globalNav) {
	const closeMenu = () => {
		menuToggle.setAttribute("aria-expanded", "false");
		menuToggle.setAttribute("aria-label", "メニューを開く");
		globalNav.classList.remove("is-open");
	};

	menuToggle.addEventListener("click", () => {
		const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
		menuToggle.setAttribute("aria-expanded", String(!isExpanded));
		menuToggle.setAttribute("aria-label", isExpanded ? "メニューを開く" : "メニューを閉じる");
		globalNav.classList.toggle("is-open", !isExpanded);
	});

	globalNav.addEventListener("click", (event) => {
		if (event.target.closest("a")) closeMenu();
	});

	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape") closeMenu();
	});
}