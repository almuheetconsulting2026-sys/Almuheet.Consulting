(() => {
  const frame = document.getElementById("appFrame");
  const reloadBtn = document.getElementById("reloadAppBtn");

  if (!frame || !reloadBtn) return;

  reloadBtn.addEventListener("click", () => {
    // لمنع أخطاء الأمان عند التشغيل كملف محلي (file://)
    if (location.protocol === 'file:') {
      // إعادة تعيين المصدر لضمان إعادة التحميل في الوضع المحلي
      frame.src = "about:blank";
      setTimeout(() => { frame.src = "./almuheet-enhanced.html"; }, 10);
    } else {
      // إضافة بارامتر عشوائي لمنع الكاش عند التشغيل عبر سيرفر
      frame.src = "./almuheet-enhanced.html?v=" + Date.now();
    }
  });
})();
