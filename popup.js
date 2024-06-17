const deSearchHistory = debounce(searchHistory, 50);
document.getElementById('search').addEventListener('input', deSearchHistory);

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

function searchHistory() {
  const searchQuery = document.getElementById('search').value.trim();

  browser.runtime.sendMessage({ action: 'search', searchQuery });
}

browser.runtime.onMessage.addListener((message) => {
  // console.log('receive', Date.now());
  if (message.action === 'updateResults') {
    // console.log('render', Date.now() - message.now);
    displayResults(message.results);
  }
});

function displayResults(items) {
  // console.time('render');
  const results = document.getElementById('results');
  results.innerHTML = '';
  results.innerHTML = items
    .map((item) => {
      const result = document.createElement('a');

      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        weekday: 'long',
      };

      const d = new Intl.DateTimeFormat('en-GB', options).format(
        new Date(item.lastVisitTime)
      );

      const u = new URL(item.url);

      return `
      <a href=${item.url} target="_blank" class="result">
      <div class="title">${item.title}</div>
      <div class="url"><strong>${u.host}</strong>${u.pathname}</div>

      <div class="date">${d} &bull; ${timeAgo(
        new Date(item.lastVisitTime)
      )}</div></a>
    `;
    })
    .join('');
  // console.timeEnd('render');
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return interval + ' years ago';
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return interval + ' months ago';
  interval = Math.floor(seconds / 86400);
  if (interval > 1) return interval + ' days ago';
  interval = Math.floor(seconds / 3600);
  if (interval > 1) return interval + ' hours ago';
  interval = Math.floor(seconds / 60);
  if (interval > 1) return interval + ' mins ago';
  return Math.floor(seconds) + ' seconds ago';
}

browser.runtime.sendMessage({ action: 'open' });

document.documentElement.addEventListener('keydown', (e) => {
  // if the up or down cursor keys are pressed, then move
  // focus from the search input to the first result,
  // and then to the next result.
  // if the current focused element is the last result or first
  // result, focus will move to the search input.

  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    const search = document.getElementById('search');
    const results = document.getElementById('results');
    const firstResult = results.firstElementChild;
    const lastResult = results.lastElementChild;
    const focused = document.activeElement;

    if (focused === search && e.key === 'ArrowUp') {
      return;
    }

    if (focused === search) {
      firstResult.focus();
      e.preventDefault();
      return;
    }

    if (focused === lastResult && e.key === 'ArrowDown') {
      search.focus();
      e.preventDefault();
      return;
    }

    if (focused === firstResult && e.key === 'ArrowUp') {
      search.focus();
      e.preventDefault();
      return;
    }

    if (e.key === 'ArrowDown') {
      focused.nextElementSibling.focus();
      e.preventDefault();
    }

    if (e.key === 'ArrowUp') {
      focused.previousElementSibling.focus();
      e.preventDefault();
    }
  }
});

document.documentElement.addEventListener('click', (e) => {
  window.close();
});
