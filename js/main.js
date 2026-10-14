/* Левобережный — скрипты лендинга (jQuery 3.7) */
(function ($) {
  'use strict';
  var $win = $(window), $body = $('body'), $html = $('html');
  $html.addClass('js');

  /* ---------- шапка: фон при прокрутке, нижняя панель на мобилке ---------- */
  var $header = $('.header'), $mbar = $('.mbar');
  function onScroll() {
    var y = $win.scrollTop();
    $header.toggleClass('is-solid', y > 40);
    $mbar.toggleClass('is-shown', y > 500);
  }
  $win.on('scroll', onScroll); onScroll();

  /* ---------- бургер-меню ---------- */
  var $burger = $('.burger'), $mmenu = $('.mmenu');
  function setMenu(open) {
    $body.toggleClass('menu-open', open);
    $burger.attr({ 'aria-expanded': open, 'aria-label': open ? 'Закрыть меню' : 'Открыть меню' });
    $mmenu.attr('aria-hidden', !open);
  }
  $burger.on('click', function () { setMenu(!$body.hasClass('menu-open')); });
  $mmenu.on('click', 'a[href^="#"]', function () { setMenu(false); });
  $(document).on('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  $win.on('resize', function () { if (window.innerWidth > 1024) setMenu(false); });

  /* ---------- плавный скролл к якорям (с учётом шапки) ---------- */
  $(document).on('click', 'a[href^="#"]', function (e) {
    var id = $(this).attr('href');
    if (id.length < 2) return;
    var $t = $(id);
    if (!$t.length) return;
    e.preventDefault();
    var pick = $(this).data('pick');
    if (pick) $('#booking-form input[name="pick"][value="' + pick + '"]').prop('checked', true);
    var top = $t.offset().top - ($header.outerHeight() || 0) + 1;
    $('html, body').stop().animate({ scrollTop: id === '#top' ? 0 : top }, 700);
  });

  /* ---------- активный пункт меню ---------- */
  var $navLinks = $('.nav a');
  var sections = $navLinks.map(function () { return $($(this).attr('href'))[0]; }).get();
  $win.on('scroll', function () {
    var y = $win.scrollTop() + window.innerHeight * 0.35, current = null;
    $.each(sections, function (_, s) { if (s && $(s).offset().top <= y) current = s.id; });
    $navLinks.each(function () { $(this).toggleClass('is-active', $(this).attr('href') === '#' + current); });
  });

  /* ---------- гирлянда: лампы загораются по очереди ---------- */
  setTimeout(function () { $('.garland').addClass('is-lit'); }, 500);
  $('.garland i').each(function (i) { $(this).css('transition-delay', (i * 0.12) + 's'); this.style.setProperty('--d', i); });
  $('<style>.garland i::after{transition-delay:inherit}</style>').appendTo('head');

  /* ---------- появление блоков при прокрутке ---------- */
  var $rev = $('.besedka__text, .mosaic, .video__text, .phone, .head-row, .tile, .house__photos, .house__text, .card, .slider, .booking__text, .form');
  if ('IntersectionObserver' in window) {
    $rev.addClass('reveal');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { $(en.target).addClass('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $rev.each(function () { io.observe(this); });
  }

  /* ---------- видео ---------- */
  var $phone = $('.phone'), video = $('.phone__video')[0], $sound = $('.phone__sound');
  if (video) {
    var userPaused = false;
    var tryPlay = function () {
      var p = video.play();
      if (p && p.then) p.then(function () { $phone.addClass('is-playing'); $sound.prop('hidden', false); }).catch(function () { $phone.removeClass('is-playing'); });
      else $phone.addClass('is-playing');
    };
    $('.phone__play').on('click', function () { userPaused = false; video.muted = false; $sound.addClass('is-on').attr('aria-label', 'Выключить звук'); tryPlay(); });
    $(video).on('click', function () {
      if (video.paused) { userPaused = false; tryPlay(); } else { userPaused = true; video.pause(); $phone.removeClass('is-playing'); }
    });
    $sound.on('click', function () {
      video.muted = !video.muted;
      $sound.toggleClass('is-on', !video.muted).attr('aria-label', video.muted ? 'Включить звук' : 'Выключить звук');
    });
    // автозапуск без звука, когда видео в зоне видимости (iOS/Android разрешают muted+playsinline)
    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          if (e.isIntersecting) { if (!userPaused) { video.muted = !$sound.hasClass('is-on'); tryPlay(); } }
          else if (!video.paused) { video.pause(); $phone.removeClass('is-playing'); }
        });
      }, { threshold: 0.4 }).observe(video);
    }
  }

  /* ---------- слайдер отзывов (свайп, точки, стрелки, автоплей) ---------- */
  $('.slider').each(function () {
    var $s = $(this), $track = $s.find('.slider__track'), $slides = $track.children(),
        $dots = $('.dots'), $prev = $('.snav--prev'), $next = $('.snav--next'),
        index = 0, perView = 3, pages = 1, timer = null, delay = +$s.data('autoplay') || 0;

    function calc() {
      var w = window.innerWidth;
      perView = w <= 640 ? 1 : (w <= 1024 ? 2 : 3);
      pages = Math.max(1, $slides.length - perView + 1);
      if (index > pages - 1) index = pages - 1;
      $dots.empty();
      for (var i = 0; i < pages; i++) {
        $('<button type="button" role="tab">').attr('aria-label', 'Отзыв ' + (i + 1)).data('i', i).appendTo($dots);
      }
      go(index, true);
    }
    function step() { return $slides.eq(0).outerWidth(true); }
    function go(i, instant) {
      index = (i + pages) % pages;
      if (instant) $track.css('transition', 'none');
      $track.css('transform', 'translate3d(' + (-index * step()) + 'px,0,0)');
      if (instant) { $track[0].offsetHeight; $track.css('transition', ''); }
      $dots.children().removeClass('is-active').attr('aria-selected', 'false').eq(index).addClass('is-active').attr('aria-selected', 'true');
    }
    function play() { stop(); if (delay) timer = setInterval(function () { go(index + 1); }, delay); }
    function stop() { if (timer) clearInterval(timer); timer = null; }

    $next.on('click', function () { go(index + 1); play(); });
    $prev.on('click', function () { go(index - 1); play(); });
    $dots.on('click', 'button', function () { go($(this).data('i')); play(); });
    $s.on('mouseenter', stop).on('mouseleave', play);

    // свайп мышью и пальцем (Pointer Events + touch-фолбэк для старых iOS)
    var startX = 0, startY = 0, dx = 0, dragging = false, locked = null, base = 0;
    function pt(e) { var o = e.originalEvent; var t = o.touches ? o.touches[0] : o; return { x: t.clientX, y: t.clientY }; }
    function down(e) { var p = pt(e); startX = p.x; startY = p.y; dx = 0; dragging = true; locked = null; base = -index * step(); stop(); }
    function move(e) {
      if (!dragging) return;
      var p = pt(e); dx = p.x - startX; var dy = p.y - startY;
      if (locked === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) locked = Math.abs(dx) > Math.abs(dy);
      if (!locked) return;
      if (e.cancelable) e.preventDefault();
      $s.addClass('is-drag');
      $track.css('transform', 'translate3d(' + (base + dx) + 'px,0,0)');
    }
    function up() {
      if (!dragging) return; dragging = false; $s.removeClass('is-drag');
      if (locked && Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1)); else go(index);
      play();
    }
    if (window.PointerEvent) {
      $s.on('pointerdown', function (e) { if (e.originalEvent.pointerType === 'mouse' && e.originalEvent.button !== 0) return; down(e); });
      $(document).on('pointermove', move).on('pointerup pointercancel', up);
    } else {
      $s.on('touchstart mousedown', down);
      $(document).on('touchmove mousemove', move).on('touchend touchcancel mouseup', up);
    }
    $s.on('dragstart', function (e) { e.preventDefault(); });

    var rt; $win.on('resize orientationchange', function () { clearTimeout(rt); rt = setTimeout(calc, 120); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else play(); });
    calc(); play();
  });

  /* ---------- маска телефона ---------- */
  $('#f-phone').on('input', function () {
    var d = this.value.replace(/\D/g, '');
    if (!d) { this.value = ''; return; }
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    var r = '+7';
    if (d.length > 1) r += ' (' + d.slice(1, 4);
    if (d.length >= 4) r += ')';
    if (d.length > 4) r += ' ' + d.slice(4, 7);
    if (d.length > 7) r += '-' + d.slice(7, 9);
    if (d.length > 9) r += '-' + d.slice(9, 11);
    this.value = r;
  });

  /* ---------- дата: не раньше сегодняшнего дня ---------- */
  (function () {
    var t = new Date(), m = ('0' + (t.getMonth() + 1)).slice(-2), d = ('0' + t.getDate()).slice(-2);
    $('#f-date').attr('min', t.getFullYear() + '-' + m + '-' + d);
  })();

  /* ---------- форма заявки ----------
     Без сервера заявка собирается в текст: копируем его и предлагаем отправить в MAX / ВК.
     Чтобы получать заявки автоматически, подключите обработчик (Telegram-бот, почта, CRM) в send(). */
  var $form = $('#booking-form');
  function send(data, text) { /* место для fetch('/send.php', { method: 'POST', body: ... }) */ }
  function copy(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).catch(function () {});
    } catch (e) {}
  }
  $form.on('submit', function (e) {
    e.preventDefault();
    var $name = $('#f-name'), $phoneIn = $('#f-phone'), $date = $('#f-date'), ok = true, msg = '';
    $form.find('input').removeClass('is-error');
    if ($.trim($name.val()).length < 2) { $name.addClass('is-error'); ok = false; msg = 'Напишите, как к вам обращаться.'; }
    if ($phoneIn.val().replace(/\D/g, '').length < 11) { $phoneIn.addClass('is-error'); ok = false; msg = msg || 'Проверьте номер телефона: нужно 11 цифр.'; }
    if (!$date.val()) { $date.addClass('is-error'); ok = false; msg = msg || 'Выберите дату отдыха.'; }
    var $err = $form.find('.form__err');
    if (!ok) { $err.text(msg).prop('hidden', false); return; }
    $err.prop('hidden', true);

    var dt = $date.val().split('-'), guests = $('#f-guests').val();
    var text = 'Здравствуйте! Хочу забронировать: ' + $form.find('input[name="pick"]:checked').val() + '\n' +
      'Дата: ' + dt[2] + '.' + dt[1] + '.' + dt[0] + '\n' +
      (guests ? 'Гостей: ' + guests + '\n' : '') +
      'Имя: ' + $.trim($name.val()) + '\n' +
      'Телефон: ' + $phoneIn.val();
    send($form.serializeArray(), text);
    copy(text);
    $form.find('.done-text').text(text);
    $form.find('.form__state').prop('hidden', true);
    $form.find('.form__done').prop('hidden', false);
  });
  $form.find('.form__again').on('click', function () {
    $form.find('.form__done').prop('hidden', true);
    $form.find('.form__state').prop('hidden', false);
  });

  $('.year').text(new Date().getFullYear());
})(jQuery);
