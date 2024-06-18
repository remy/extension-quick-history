let historyItems;
let fuse;

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
    const filteredItems = Array.from(
      new Map(
        fused
          .filter((item) => item.score < 0.2)
          .map((item) => [new URL(item.item.url).origin, item.item])
      ).values()
    );

    // console.timeEnd('filter');

    // get the values from filteredItems

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
