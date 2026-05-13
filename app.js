(() => {
  const frame = document.getElementById("appFrame");
  const reloadBtn = document.getElementById("reloadAppBtn");

  if (!frame || !reloadBtn) return;

  reloadBtn.addEventListener("click", () => {
    frame.src = "./almuheet-enhanced.html?ts=" + Date.now();
  });
})();
