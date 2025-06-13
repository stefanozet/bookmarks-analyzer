const baseUrl = new URL('.', import.meta.url);
const htmlUrl = new URL('modal.html', baseUrl).href;
const cssUrl = new URL('modal.css', baseUrl).href;

export async function showModal(message = "Sei sicuro?") {
  // Carica lo stile una volta
  if (!document.getElementById('modal-style')) {
    const link = document.createElement('link');
    link.id = 'modal-style';
    link.rel = 'stylesheet';
    link.href = cssUrl;
    document.head.appendChild(link);
  }

  // Carica HTML se non esiste
  if (!document.getElementById('modal')) {
    const res = await fetch(htmlUrl);
    const html = await res.text();
    document.body.insertAdjacentHTML('beforeend', html);
  }

  // Mostra la modale
  return new Promise((resolve) => {
    const modal = document.getElementById('modal');
    const messageBox = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');

    messageBox.innerHTML = message;
    modal.style.display = 'flex';

    const cleanup = () => {
      modal.style.display = 'none';
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
    };

    const onConfirm = () => {
      cleanup();
      resolve(true);
    };

    const onCancel = () => {
      cleanup();
      resolve(false);
    };

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
  });
}
