export const PRINT_SIZES = ['A4', 'A5'];

export function printDocument(target = 'page', size) {
  const safeSize = PRINT_SIZES.includes(size) ? size : undefined;
  document.body.dataset.printTarget = target;
  if (safeSize) document.body.dataset.printSize = safeSize;
  else delete document.body.dataset.printSize;
  const cleanup = () => {
    delete document.body.dataset.printTarget;
    delete document.body.dataset.printSize;
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup, { once: true });
  window.print();
}
