const ABOUT_DIALOG_ID = "labajAboutDialog";

const aboutDialogHtml = `
  <dialog class="about-dialog" id="${ABOUT_DIALOG_ID}" aria-labelledby="labajAboutTitle">
    <article class="about-dialog__panel">
      <div class="about-dialog__top">
        <h2 id="labajAboutTitle">À propos</h2>
        <form method="dialog">
          <button class="about-dialog__close" type="submit" aria-label="Fermer">
            ×
          </button>
        </form>
      </div>
      <div class="about-dialog__text">
        <p>
          Ce portail et les jeux qu'il rassemble sont imaginés, adaptés et
          assemblés par Dr. John, avec l'envie de proposer de petits
          jeux web accessibles, amusants, et ancrés dans l'univers de Lille.
        </p>
        <p>
          On y reprend parfois des idées de jeux bien connues, qu'on détourne à
          notre manière pour leur donner une couleur locale : des mots, des
          lieux, des trajets, des ambiances, des bizarreries, et un peu de
          bilouterie.
        </p>
        <p>
          Merci de jouer, d'explorer, et de faire vivre cette petite baraque à
          jeux.
        </p>
        <a
          class="support-button"
          href="https://ko-fi.com/drjohn88218"
          target="_blank"
          rel="noopener noreferrer"
        >
          Soutenez la baraque à jeux
        </a>
      </div>
    </article>
  </dialog>
`;

let lastTrigger = null;

initAboutDialog();

function initAboutDialog() {
  const triggers = [...document.querySelectorAll("[data-about-trigger]")];
  if (triggers.length === 0) return;

  const dialog = ensureAboutDialog();

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      lastTrigger = trigger;
      openDialog(dialog);
    });
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog(dialog);
  });

  // Restitue le focus au bouton déclencheur quelle que soit la voie de fermeture
  // (croix, Échap, clic sur le fond). Couvre aussi le repli sans <dialog> natif.
  dialog.addEventListener("close", restoreTriggerFocus);
}

function restoreTriggerFocus() {
  if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
  lastTrigger = null;
}

function ensureAboutDialog() {
  const existingDialog = document.getElementById(ABOUT_DIALOG_ID);
  if (existingDialog) return existingDialog;

  document.body.insertAdjacentHTML("beforeend", aboutDialogHtml);
  return document.getElementById(ABOUT_DIALOG_ID);
}

function openDialog(dialog) {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function closeDialog(dialog) {
  if (typeof dialog.close === "function" && dialog.open) {
    dialog.close(); // déclenche l'événement "close" -> restoreTriggerFocus
  } else {
    dialog.removeAttribute("open");
    restoreTriggerFocus();
  }
}
