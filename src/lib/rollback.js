export const dispatchRollback = (message = "A network error occurred. Your changes could not be saved and the interface has been reset.") => {
  window.dispatchEvent(new CustomEvent('finora:rollback', { detail: message }));
};
