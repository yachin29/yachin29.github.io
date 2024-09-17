
$(function(){

//vegasの呼び出し
$('#main-visual').vegas({
    slides: [
        {src: "img/main-1.webp"},
        {src: "img/main-2.webp"},
        {src: "img/main-3.webp"},
    ],
    timer: false,
    transition: 'blur',
    animation: 'kenburns',
    delay:5000,
    animationDuration:1000,
});


//ハンバーガーボタン
//まず#g-navを非表示にする
$('#g-nav').hide();
//#ham-btnをon.clickしたら、thisにtoggleClassし、さらに#g-navをfadeToggleする
$('#ham-btn').on('click',function(){
$(this).toggleClass('is-active');
$('#g-nav').fadeToggle(200);
});

//#g-nav aをon.clickしたら、#g-navをfadeOutし×を三本線に戻す
$('#g-nav a').on('click',function(){
$('#g-nav').fadeOut(200);
$('#ham-btn').removeClass('is-active');
});


//ajaxで外部データを呼び出す
$('#news-list').load('news.txt');



//カルーセル
$('.bxslider').bxSlider({
ticker: true,
speed: 40000,
minSlides: 2,
maxSlides: 6,
slideWidth: 320,
});

//西暦を取得しfullYearに代入する
const fullYear = new Date().getFullYear();

if(fullYear >= 2025){
$('#this-year').text('2024 - '+fullYear);
}else{
$('#this-year').text(fullYear);
}


//多言語用のリダイレクト

document.querySelector('btn-ja').href = 'https://yachin29.github.io/restaurant-site-multi/';


//イタリア語のリダイレクト
$('#btn-it').on('click',function(){
$(this).href = 'https://yachin29-github-io.translate.goog/restaurant-site-multi/?_x_tr_sl=ja&_x_tr_tl=it&_x_tr_hl=ja';
});

//フランス語のリダイレクト
$('#btn-fr').on('click',function(){
$(this).href = 'https://yachin29-github-io.translate.goog/restaurant-site-multi/?_x_tr_sl=ja&_x_tr_tl=fr&_x_tr_hl=ja';
});



});