// filename: omykamp-countdown.js

(() => {
  const TARGET_SLUG = "test-for-api";
  const DEFAULT_DEADLINE_ISO = "2026-01-01T23:59:59+08:00";

  const getCurrentSlug = () => {
    try {
      const url = new URL(location.href);
      const match = url.pathname.match(/\/courses\/([^/?#]+)/);
      const fromPath = match ? match[1] : null;
      const slugInput = document.querySelector("#course_slug");
      const fromInput = slugInput ? slugInput.value : null;
      return fromPath || fromInput || null;
    } catch {
      return null;
    }
  };

  // 收集所有可能的掛載容器（支援多個）
  const findAllMounts = () => {
    const nodes = [
      ...document.querySelectorAll("#countdown"),
      ...document.querySelectorAll(".course-countdown"),
    ];
    // 去重
    return Array.from(new Set(nodes));
  };

  const isVisible = (el) => {
    if (!el) return false;
    const cs = getComputedStyle(el);
    if (
      cs.display === "none" ||
      cs.visibility === "hidden" ||
      parseFloat(cs.opacity) === 0
    )
      return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  const getDeadlineMs = (container) => {
    const iso =
      (container && container.getAttribute("data-deadline")) ||
      DEFAULT_DEADLINE_ISO;
    const t = Date.parse(iso);
    return Number.isFinite(t) ? t : Date.parse(DEFAULT_DEADLINE_ISO);
  };

  // 渲染倒數到指定容器（若容器隱藏，先建立，顯示時才會更新）
  const renderCountdownInto = (container) => {
    if (!container) return;

    let box = container.querySelector("#course-countdown");
    if (!box) {
      box = document.createElement("div");
      box.id = "course-countdown";
      box.style.cssText =
        "display:inline-block;padding:6px 10px;background:#222;color:#fff;border-radius:6px;font:14px/1.4 system-ui";
      container.appendChild(box);
    }

    const deadline = getDeadlineMs(container);

    const tick = () => {
      // 容器不可見時就暫停更新文字，避免覆蓋其他版面
      if (!isVisible(container)) return;

      const now = Date.now();
      const diff = Math.max(0, deadline - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      box.textContent = `倒數：${days}天 ${hours}時 ${mins}分 ${secs}秒`;

      if (diff === 0) {
        box.textContent = "活動已結束";
        clearInterval(timer);
      }
    };

    tick();
    const timer = setInterval(tick, 1000);

    // 容器被重渲染時，確保盒子存在
    const mo = new MutationObserver(() => {
      if (!container.contains(box)) {
        const exists = container.querySelector("#course-countdown");
        if (!exists) {
          const newBox = document.createElement("div");
          newBox.id = "course-countdown";
          newBox.style.cssText = box.style.cssText;
          container.appendChild(newBox);
          box = newBox;
        } else {
          box = exists;
        }
      }
    });
    mo.observe(container, { childList: true, subtree: true });
  };

  const mountAllNow = () => {
    const mounts = findAllMounts();
    mounts.forEach(renderCountdownInto);
  };

  const start = () => {
    if (getCurrentSlug() !== TARGET_SLUG) return;

    // 初始重試，覆蓋懶載入
    let tries = 0;
    const maxTries = 20;
    const intervalMs = 300;
    const retry = setInterval(() => {
      mountAllNow();
      if (++tries >= maxTries) clearInterval(retry);
    }, intervalMs);

    // 監聽整體 DOM 新增/切換（例如點選「課程簡介」Tab）
    const root = document.body || document.documentElement;
    const domWatch = new MutationObserver(() => {
      mountAllNow();
    });
    domWatch.observe(root, { childList: true, subtree: true });

    // 立即嘗試一次
    mountAllNow();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
