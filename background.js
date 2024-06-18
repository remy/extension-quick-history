let historyItems;
let fuse;

function searchAndSortResults(searchQuery, items) {
  const queries = searchQuery
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);

  const filteredItems = items
    .map((item) => {
      const title = item.title?.toLowerCase() || '';
      const url = item.url.toLowerCase();
      const matchCount = queries.reduce((count, query) => {
        return count + (title.includes(query) || url.includes(query) ? 1 : 0);
      }, 0);
      return { item, matchCount };
    })
    .filter(({ matchCount }) => matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .map(({ item }) => item);

  return filteredItems;
}

browser.runtime.onMessage.addListener(async (message) => {
  try {
    if (message.action === 'open') {
      // console.log('reload database');
      // console.time('reload database');
      // prime the database
      historyItems = await browser.history.search({
        text: '',
        startTime: 0,
        maxResults: 100_000,
      });

      fuse = new Fuse(historyItems, {
        keys: [{ name: 'title', weight: 2 }, 'url'],
        // keys: ['title', 'url'],
        includeScore: true,
        useExtendedSearch: true,
        threshold: 0.6,
      });

      // console.timeEnd('reload database');

      return;
    }

    if (message.searchQuery.length < 3) {
      return browser.runtime.sendMessage({
        action: 'updateResults',
        results: [],
      });
    }

    // console.time('search');
    const fused = fuse.search(message.searchQuery);
    // console.timeEnd('search');

    // console.log('to filter', fused.length);
    // console.time('filter');
    const filteredItems = fused
      .filter((_) => _.score < 0.2)
      .reduce((uniqueItems, item) => {
        const origin = new URL(item.item.url).origin;
        if (!uniqueItems.some((i) => new URL(i.url).origin === origin)) {
          item.item.score = item.score;
          uniqueItems.push(item.item);
        }
        return uniqueItems;
      }, []);
    // console.timeEnd('filter');

    // console.time('send');
    // console.log('send', Date.now());
    browser.runtime.sendMessage({
      action: 'updateResults',
      results: filteredItems.slice(0, 100),
      now: Date.now(),
    });
    // console.timeEnd('send');
  } catch (e) {
    // console.error(e);
  }
});
