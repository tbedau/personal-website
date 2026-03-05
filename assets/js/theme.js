const STORAGE_KEY = 'theme-preference';

const getColorPreference = () => {
  if (localStorage.getItem(STORAGE_KEY))
    return localStorage.getItem(STORAGE_KEY);
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

const setPreference = () => {
  localStorage.setItem(STORAGE_KEY, theme.value);
  reflectPreference();
}

const reflectPreference = () => {
  document.documentElement.setAttribute('data-theme', theme.value);
  document.querySelector('#theme-toggle')?.setAttribute('aria-label',
    theme.value === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
  );
}

const theme = {
  value: getColorPreference(),
}

reflectPreference();

window.addEventListener('load', () => {
  reflectPreference();

  document.querySelector('#theme-toggle')?.addEventListener('click', () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    setPreference();
  });
});

window.matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', ({matches:isDark}) => {
    theme.value = isDark ? 'dark' : 'light';
    setPreference();
  });
