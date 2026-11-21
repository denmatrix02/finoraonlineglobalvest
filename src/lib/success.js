export function dispatchSuccess(detail) {
  const payload = typeof detail === 'string' ? { title: 'Action Successful', message: detail } : detail;
  window.dispatchEvent(new CustomEvent('finora:success', { detail: payload }));
}
