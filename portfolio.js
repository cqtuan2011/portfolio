// ======= Portfolio interactions =======
(function() {
  const GAMES = window.GAMES;
  const grid = document.getElementById('games-grid');
  const chips = document.querySelectorAll('.chip');
  const modalBack = document.getElementById('modal-back');
  const modalClose = document.getElementById('modal-close');

  let active = 'all';

  // ---- Count per filter ----
  function countFor(filter) {
    if (filter === 'all') return GAMES.length;
    if (filter === 'ios') return GAMES.filter(g => g.platforms.includes('iOS')).length;
    if (filter === 'aos') return GAMES.filter(g => g.platforms.includes('AOS')).length;
    if (filter === 'fbi') return GAMES.filter(g => g.platforms.includes('FBI')).length;
    return GAMES.filter(g => g.genres.includes(filter)).length;
  }
  chips.forEach(c => {
    const f = c.dataset.filter;
    c.querySelector('.count').textContent = '(' + countFor(f) + ')';
  });

  // ---- Grid render ----
  function matches(g, f) {
    if (f === 'all') return true;
    if (f === 'ios') return g.platforms.includes('iOS');
    if (f === 'aos') return g.platforms.includes('AOS');
    if (f === 'fbi') return g.platforms.includes('FBI');
    return g.genres.includes(f);
  }

  function platPill(p) {
    const code = p === 'iOS' ? 'iOS' : p === 'AOS' ? 'AND' : 'FB';
    return `<span class="plat" title="${p}">${code}</span>`;
  }

  function render() {
    grid.innerHTML = '';
    const list = GAMES.filter(g => matches(g, active));
    list.forEach((g, i) => {
      const card = document.createElement('div');
      card.className = 'game-card fade-row';
      card.style.animationDelay = (i * 0.02) + 's';
      const thumbContent = g.cover
        ? `<img src="${g.cover}" alt="${g.name} icon" loading="lazy"/>`
        : window.renderCover(g);
      card.innerHTML = `
        <div class="role">${g.role.split(' · ').map(t => `<span>${t}</span>`).join('')}</div>
        <div class="platforms">${g.platforms.map(platPill).join('')}</div>
        <div class="thumb">${thumbContent}</div>
        <div class="meta">
          <div class="name">${g.name}</div>
          <div class="sub">
            <span>${g.tagline}</span>
          </div>
        </div>
      `;
      card.addEventListener('click', (e) => { e.stopPropagation(); openModal(g); });
      grid.appendChild(card);
    });
    if (!list.length) {
      grid.innerHTML = `<div style="padding:80px;grid-column:1/-1;text-align:center;color:var(--fg-mute);font-family:var(--mono);">No titles match this filter.</div>`;
    }
  }

  chips.forEach(c => {
    c.addEventListener('click', () => {
      chips.forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      active = c.dataset.filter;
      render();
    });
  });

  // ======= MODAL GALLERY =======
  let currentGame = null;
  let currentIdx = 0;

  function renderMediaItem(game, m) {
    if (m.type === 'procedural') {
      return `<div class="m-screen">${window.renderScreenshot(game, m.variant)}</div>`;
    }
    if (m.type === 'image') {
      return `<div class="m-screen"><img src="${m.src}" alt="${game.name} screenshot"/></div>`;
    }
    if (m.type === 'video') {
      if (m.youtube) {
        return `<div class="m-video"><iframe src="https://www.youtube.com/embed/${m.youtube}?rel=0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>`;
      }
      if (m.src) {
        return `<div class="m-video"><video src="${m.src}" controls playsinline></video></div>`;
      }
    }
    return '';
  }

  function renderThumb(game, m, idx) {
    let inner;
    let extraClass = '';
    if (m.type === 'procedural') {
      inner = window.renderScreenshot(game, m.variant);
    } else if (m.type === 'image') {
      inner = `<img src="${m.src}" alt=""/>`;
    } else if (m.type === 'video') {
      extraClass = 'video';
      if (m.youtube) {
        inner = `<img src="https://i.ytimg.com/vi/${m.youtube}/mqdefault.jpg" alt=""/>`;
      } else {
        inner = window.renderScreenshot(game, 'title');
      }
    }
    return `<div class="m-thumb ${extraClass}" data-idx="${idx}">${inner}</div>`;
  }

  function showMedia(idx, direction) {
    if (!currentGame) return;
    const media = currentGame.media;
    const prevIdx = currentIdx;
    currentIdx = (idx + media.length) % media.length;
    const cur = document.getElementById('m-current');

    // Direction: +1 = next (new enters from right), -1 = prev (from left), 0 = no animation
    if (direction === undefined) direction = currentIdx > prevIdx ? 1 : currentIdx < prevIdx ? -1 : 0;

    // If first-time or same index, no slide animation
    if (!cur.children.length || direction === 0) {
      cur.innerHTML = `<div class="m-slide active">${renderMediaItem(currentGame, media[currentIdx])}</div>`;
    } else {
      const oldSlide = cur.querySelector('.m-slide.active');
      const newSlide = document.createElement('div');
      newSlide.className = 'm-slide ' + (direction > 0 ? 'enter-right' : 'enter-left');
      newSlide.innerHTML = renderMediaItem(currentGame, media[currentIdx]);
      cur.appendChild(newSlide);

      // Next frame: animate
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          newSlide.classList.remove('enter-right', 'enter-left');
          newSlide.classList.add('active');
          if (oldSlide) {
            oldSlide.classList.remove('active');
            oldSlide.classList.add(direction > 0 ? 'exit-left' : 'exit-right');
            setTimeout(() => oldSlide.remove(), 500);
          }
        });
      });
    }

    // Counter update + pulse
    const counter = document.getElementById('m-counter');
    counter.textContent = `${currentIdx + 1} / ${media.length}`;
    counter.classList.remove('pulse');
    void counter.offsetWidth; // reflow to restart animation
    counter.classList.add('pulse');

    // Thumbs active state
    document.querySelectorAll('.m-thumb').forEach(t => {
      t.classList.toggle('active', Number(t.dataset.idx) === currentIdx);
    });
  }

  function openModal(g) {
    currentGame = g;
    currentIdx = 0;

    // Info side
    const info = document.getElementById('m-info');
    info.innerHTML = `
      <div class="m-role-tag">${g.role}</div>
      <h3 class="m-title">${g.name}</h3>
      <p class="m-tagline">${g.tagline}</p>
      <div class="m-chips">
        ${g.platforms.map(p => `<span>${p}</span>`).join('')}
      </div>
      <div class="m-section-label">What I built</div>
      <ul class="m-bullets">
        ${g.bullets.map(b => `<li><span>${b}</span></li>`).join('')}
      </ul>
      <div class="m-section-label">Tech stack</div>
      <div class="m-stack">${g.stack.map(s => `<span>${s}</span>`).join('')}</div>
    `;

    // Thumbs
    const thumbs = document.getElementById('m-thumbs');
    thumbs.innerHTML = g.media.map((m, i) => renderThumb(g, m, i)).join('');
    thumbs.querySelectorAll('.m-thumb').forEach(t => {
      t.addEventListener('click', () => {
        const idx = Number(t.dataset.idx);
        showMedia(idx, idx > currentIdx ? 1 : idx < currentIdx ? -1 : 0);
      });
    });

    // Nav arrows (hide if only one item)
    const showNav = g.media.length > 1;
    document.getElementById('m-prev').style.display = showNav ? '' : 'none';
    document.getElementById('m-next').style.display = showNav ? '' : 'none';
    document.getElementById('m-counter').style.display = showNav ? '' : 'none';
    thumbs.style.display = showNav ? '' : 'none';

    showMedia(0, 0);
    // Two-step open: add .visible first (so display:block), then .open next frame
    // so the CSS transitions (backdrop fade + modal scale+fade + info stagger) run.
    modalBack.classList.add('visible');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => modalBack.classList.add('open'));
    });
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalBack.classList.remove('open');
    document.body.style.overflow = '';
    // Wait for fade-out before fully hiding
    setTimeout(() => {
      modalBack.classList.remove('visible');
      currentGame = null;
      const cur = document.getElementById('m-current');
      if (cur) cur.innerHTML = '';
    }, 360);
  }

  modalClose.addEventListener('click', (e) => { e.stopPropagation(); closeModal(); });
  // Guard: only close if mousedown AND click both land on the backdrop itself.
  // Without this, the click that OPENED the modal (on a card) can bubble up and
  // hit the backdrop handler once the backdrop becomes visible in the same tick.
  let mdTarget = null;
  modalBack.addEventListener('mousedown', (e) => { mdTarget = e.target; });
  modalBack.addEventListener('click', (e) => {
    if (e.target === modalBack && mdTarget === modalBack) closeModal();
    mdTarget = null;
  });
  document.getElementById('m-prev').addEventListener('click', () => showMedia(currentIdx - 1, -1));
  document.getElementById('m-next').addEventListener('click', () => showMedia(currentIdx + 1, 1));

  document.addEventListener('keydown', (e) => {
    if (!currentGame) return;
    if (e.key === 'Escape') closeModal();
    else if (e.key === 'ArrowLeft') showMedia(currentIdx - 1, -1);
    else if (e.key === 'ArrowRight') showMedia(currentIdx + 1, 1);
  });

  render();
})();
