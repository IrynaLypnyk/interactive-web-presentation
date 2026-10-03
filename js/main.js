'use strict';

(() => {
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => [...document.querySelectorAll(selector)];
    const mobile = matchMedia('(max-width: 991px)');
    const menu = $('.menu-header');
    const burger = $('.burger');
    const close = $('.close-menu');
    const videos = $$('video');
    let menuOpen = false;

    function focusMenuClose() {
        setTimeout(() => close.focus({ preventScroll: true }), 50);
    }
    function setMenu(open, restoreFocus = true) {
        menuOpen = open && mobile.matches;
        menu.classList.toggle('open', menuOpen);
        menu.inert = mobile.matches && !menuOpen;
        document.body.classList.toggle('menu-open', menuOpen);
        burger.setAttribute('aria-expanded', String(menuOpen));
        if (menuOpen) focusMenuClose();
        else if (restoreFocus && mobile.matches) burger.focus();
    }
    burger.addEventListener('click', () => setMenu(!menuOpen));
    close.addEventListener('click', () => setMenu(false));
    mobile.addEventListener('change', () => setMenu(false, false));
    document.addEventListener('keydown', (event) => {
        if (!menuOpen) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            setMenu(false);
        }
        if (event.key === 'Tab') {
            const items = [...menu.querySelectorAll('button, a[href]')];
            const first = items[0];
            const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    });
    $$('.link-menu').forEach((link) => link.addEventListener('click', () => {
        setMenu(false, false);
        const target = $(link.getAttribute('href'));
        target.focus({ preventScroll: true });
    }));
    setMenu(false, false);

    $('.laptop-overlay').classList.add('active');
    const forms = $('.booiforms-content');
    const showMore = $('.showmore-link');
    showMore.addEventListener('click', () => {
        forms.classList.add('opened');
        $('.decor-container').classList.add('visible');
        $('.decor-items-container').classList.add('visible');
        showMore.setAttribute('aria-expanded', 'true');
        showMore.textContent = 'К демонстрации';
        forms.focus({ preventScroll: true });
        forms.scrollIntoView({ behavior: 'smooth', block: 'start' });
        scheduleUpdate();
    });

    // Load media only when its demo approaches the viewport.
    function loadVideo(video) {
        const source = video.querySelector('source[data-src]');
        if (!source) return;
        source.src = source.dataset.src;
        source.removeAttribute('data-src');
        video.load();
    }
    const visibleVideos = new Set();
    const manuallyPaused = new WeakSet();
    const autoPausing = new WeakSet();
    function pauseVideo(video) {
        if (!video.paused) {
            autoPausing.add(video);
            video.pause();
        }
    }
    function syncVideo(video) {
        if (document.hidden || !visibleVideos.has(video)) {
            pauseVideo(video);
        } else if (!manuallyPaused.has(video)) {
            loadVideo(video);
            video.play().catch(() => { /* Native controls remain available. */ });
        }
    }
    videos.forEach((video) => {
        video.addEventListener('pause', () => {
            if (autoPausing.has(video)) autoPausing.delete(video);
            else manuallyPaused.add(video);
        });
        video.addEventListener('play', () => manuallyPaused.delete(video));
    });
    if ('IntersectionObserver' in window) {
        const preload = new IntersectionObserver((entries) => {
            entries.forEach(({ target, isIntersecting }) => {
                if (isIntersecting) {
                    loadVideo(target);
                    preload.unobserve(target);
                }
            });
        }, { rootMargin: '200px' });
        const playback = new IntersectionObserver((entries) => {
            entries.forEach(({ target, isIntersecting }) => {
                if (isIntersecting) visibleVideos.add(target);
                else visibleVideos.delete(target);
                syncVideo(target);
            });
        }, { threshold: 0.15 });
        videos.forEach((video) => { preload.observe(video); playback.observe(video); });
    } else {
        videos.forEach(loadVideo);
    }
    document.addEventListener('visibilitychange', () => videos.forEach(syncVideo));

    // One passive scroll listener and one animation frame for all scroll effects.
    let scheduled = false;
    let lastScroll = scrollY;
    function update() {
        scheduled = false;
        const height = innerHeight;
        const scroll = scrollY;
        $('.header').classList.toggle('on-scroll', scroll > 100);
        if ($('.booibrand-banner').getBoundingClientRect().bottom <= height) {
            $('.monkey_onlogo-svg').classList.add('animated');
        }
        $('.block-phone').classList.toggle('animated', $('.section-booivisuals .wrap-media').getBoundingClientRect().bottom <= height);
        $$('.svg-container, .features-item').forEach((element) => {
            if (element.getBoundingClientRect().bottom < height - 50) element.classList.add('animated');
        });
        const decor = $('.decor-items-container');
        const first = $('.section-booiforms').getBoundingClientRect();
        const second = $('.section-booivisuals').getBoundingClientRect();
        const decorRect = decor.getBoundingClientRect();
        if (scroll < lastScroll) {
            if (decorRect.top > height || first.bottom > height) decor.classList.remove('right');
            else if (second.bottom > height) {
                decor.classList.remove('left');
                decor.classList.add('right');
            }
        } else if (scroll > lastScroll) {
            if (decorRect.bottom < 50) decor.classList.add('right');
            if (second.top < -100) {
                decor.classList.remove('right');
                decor.classList.add('left');
            }
        }
        lastScroll = scroll;
        if ($('.we-make').getBoundingClientRect().top < height - 100) $('.we-make').classList.add('animate');
    }
    function scheduleUpdate() {
        if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
    }
    addEventListener('scroll', scheduleUpdate, { passive: true });
    addEventListener('resize', scheduleUpdate);
    addEventListener('load', scheduleUpdate);
    update();

    // Preserve the card tilt without the legacy jQuery plugins.
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    $$('.js-tilt').forEach((card) => {
        card.addEventListener('pointermove', (event) => {
            if (!finePointer.matches) return;
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(800px) rotateX(${-y * 15}deg) rotateY(${x * 15}deg) scale(1.1)`;
        });
        card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
})();
