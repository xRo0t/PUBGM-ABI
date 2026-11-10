const $ = (q, root = document) => root.querySelector(q);
const $$ = (q, root = document) => [...root.querySelectorAll(q)];

const cycles = {
  graphicsQuality: ['Smooth', 'Balanced', 'HD', 'HDR', 'Ultra HD'],
  frameRate: ['30 FPS', '60 FPS', 'Ultra (90 FPS)', 'Extreme (120 FPS)'],
  controlsProfile: ['Classic (Default)', 'Advanced', 'Custom'],
  voiceChat: ['Enabled', 'Disabled']
};

let config = {};

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2200);
}

function showPage(name) {
  $$('.page').forEach(p => p.classList.toggle('active', p.id === `page-${name}`));
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === name));
}

function syncUI() {
  $('#graphicsQualityValue').textContent = config.graphicsQuality;
  $('#frameRateValue').textContent = config.frameRate;
  $('#controlsProfileValue').textContent = config.controlsProfile;
  $('#voiceChatValue').textContent = config.voiceChat;

  $('#graphicsSelect').value = config.graphicsQuality;
  $('#fpsSelect').value = config.frameRate;
  $('#controlsSelect').value = config.controlsProfile;
  $('#voiceSelect').value = config.voiceChat;
  $('#gamePath').value = config.gamePath || '';
}

async function savePatch(patch) {
  config = await window.launcher.saveConfig(patch);
  syncUI();
}

$$('.nav-item').forEach(btn => btn.addEventListener('click', () => showPage(btn.dataset.page)));

$('#minimizeBtn').addEventListener('click', () => window.launcher.minimize());
$('#maximizeBtn').addEventListener('click', () => window.launcher.maximize());
$('#closeBtn').addEventListener('click', () => window.launcher.close());

$$('[data-toast]').forEach(btn => btn.addEventListener('click', () => toast(btn.dataset.toast)));

$$('.editable').forEach(row => {
  row.addEventListener('click', async () => {
    const key = row.dataset.setting;
    const values = cycles[key];
    const current = config[key];
    const next = values[(values.indexOf(current) + 1) % values.length];
    await savePatch({ [key]: next });
    toast(`${row.querySelector('.row-label').textContent}: ${next}`);
  });
});

$('#downloadResourcesBtn').addEventListener('click', () => toast('All resource packs are already installed.'));

async function verify() {
  $('#repairValue').textContent = 'Checking...';
  $('#launchStatus').textContent = 'Verifying game files...';
  const result = await window.launcher.verifyGame();
  if (result.ok) {
    $('#repairValue').textContent = 'No issues detected';
    $('#launchStatus').textContent = 'Everything looks good. Jump into the action.';
    toast(`Verified: ${result.fileName}`);
  } else {
    $('#repairValue').textContent = 'Needs attention';
    $('#launchStatus').textContent = result.error;
    toast(result.error);
  }
}
$('#repairFilesBtn').addEventListener('click', verify);
$('#verifyBtn').addEventListener('click', verify);

$('#openFolderBtn').addEventListener('click', async () => {
  const r = await window.launcher.openGameFolder();
  if (!r.ok) toast(r.error);
});

$('#browseBtn').addEventListener('click', async () => {
  const path = await window.launcher.browseGame();
  if (path) {
    config.gamePath = path;
    syncUI();
    toast('Game executable selected.');
  }
});

$('#saveSettingsBtn').addEventListener('click', async () => {
  await savePatch({
    graphicsQuality: $('#graphicsSelect').value,
    frameRate: $('#fpsSelect').value,
    controlsProfile: $('#controlsSelect').value,
    voiceChat: $('#voiceSelect').value
  });
  toast('Settings saved.');
});

async function startGame() {
  const btn = $('#startGameBtn');
  const old = btn.innerHTML;
  btn.disabled = true;
  $('#launchStatus').textContent = 'Starting game...';
  const result = await window.launcher.startGame();
  if (result.ok) {
    $('#launchStatus').textContent = 'Game launched successfully.';
    toast('Game launched.');
  } else {
    $('#launchStatus').textContent = result.error;
    toast(result.error);
    if ((result.error || '').toLowerCase().includes('choose')) showPage('settings');
  }
  setTimeout(() => { btn.disabled = false; btn.innerHTML = old; }, 700);
}
$('#startGameBtn').addEventListener('click', startGame);
$('#libraryStart').addEventListener('click', startGame);

$('#toolsBtn').addEventListener('click', () => toast('Game Tools menu is ready for your own tools/actions.'));

(async () => {
  config = await window.launcher.getConfig();
  syncUI();
})();


/* Responsive sidebar drawer */
const appRoot = document.querySelector('.app');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function setSidebarOpen(open) {
  if (!appRoot || !sidebarToggle) return;
  appRoot.classList.toggle('sidebar-open', open);
  sidebarToggle.setAttribute('aria-expanded', String(open));
  if (sidebarOverlay) sidebarOverlay.setAttribute('aria-hidden', String(!open));
}

if (sidebarToggle) {
  sidebarToggle.addEventListener('click', () => {
    setSidebarOpen(!appRoot.classList.contains('sidebar-open'));
  });
}

if (sidebarOverlay) {
  sidebarOverlay.addEventListener('click', () => setSidebarOpen(false));
}

window.addEventListener('resize', () => {
  if (window.innerWidth > 820) setSidebarOpen(false);
});

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    if (window.innerWidth <= 820) setSidebarOpen(false);
  });
});
