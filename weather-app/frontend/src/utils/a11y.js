/**
 * Permite activar con Enter o Espacio un elemento que no es un <button>
 * (por ejemplo, una tarjeta con role="button"), igual que con un clic.
 */
export const onActivateKey = (handler) => (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handler();
  }
};
