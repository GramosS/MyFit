document.addEventListener("DOMContentLoaded", () => {
  const getStartedBtn = document.getElementById("get-started-btn");

  if (getStartedBtn) {
    getStartedBtn.addEventListener("click", () => {
      // Till nästa steg kan vi scrolla, öppna en sektion
      // eller bara visa en placeholder så länge.
      alert("Snart kommer träningslogg, kost & livsstil – nu börjar din MyFit-resa!");
    });
  }
});

