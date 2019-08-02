import { SidebarItem, Endpoint } from './types/sidebarItems';

async function createYoutubeClient() {
  const homePageResponse = await fetch('https://www.youtube.com/');
  const homePageText = await homePageResponse.text();
  const idTokenMatches = homePageText.match(/"ID_TOKEN":"([^"]+)"/);
  const idToken: string | null =
    idTokenMatches && idTokenMatches[1] ? idTokenMatches[1] : null;
  const versionMatches = homePageText.match(
    /"INNERTUBE_CONTEXT_CLIENT_VERSION":"([^"]+)"/,
  );
  const version = versionMatches && versionMatches[1] ? versionMatches[1] : '1';

  return new YoutubeClient({ idToken, version });
}

const youtubeClientPromise = createYoutubeClient();

interface HistoryFeedData {
  historyOn: boolean;
  sejParam: Endpoint;
  csnParam: string;
  xsrfToken: string;
}

class YoutubeClient {
  idToken: string | null;
  version: string;

  historyFeedData: HistoryFeedData | null = null;

  constructor({
    idToken,
    version,
  }: {
    idToken: string | null;
    version: string;
  }) {
    this.idToken = idToken;
    this.version = version;
  }

  async fetch(input: RequestInfo, init?: RequestInit) {
    const newInit: RequestInit = init ? init : {};
    newInit.headers = newInit.headers ? newInit.headers : {};
    newInit.headers['x-youtube-client-version'] = this.version;
    newInit.headers['x-youtube-client-name'] = 1;
    if (this.idToken !== null) {
      newInit.headers['x-youtube-identity-token'] = this.idToken;
    }
    return fetch(input, newInit);
  }

  async getHistoryFeed() {
    if (this.historyFeedData) return this.historyFeedData;

    const feedResponse = await this.fetch(
      'https://www.youtube.com/feed/history?pbj=1',
    );

    const feedData = JSON.parse(await feedResponse.text());
    const sidebarData: SidebarItem[] =
      feedData[1].response.contents.twoColumnBrowseResultsRenderer
        .secondaryContents.browseFeedActionsRenderer.contents;

    const turnOnText = sidebarData.find(
      item =>
        item.buttonRenderer &&
        item.buttonRenderer.text.runs[0].text.includes('Turn on'),
    );
    const turnOffText = sidebarData.find(
      item =>
        item.buttonRenderer &&
        item.buttonRenderer.text.runs[0].text.includes('Pause'),
    );

    const action = turnOnText || turnOffText;
    if (!action) {
      throw new Error(
        "We couldn't find the text to turn on or off the history. This may be because the extension only works for English users right now. Try changing your Youtube language to English",
      );
    }

    const sejParam =
      action.buttonRenderer &&
      action.buttonRenderer.navigationEndpoint &&
      action.buttonRenderer.navigationEndpoint.confirmDialogEndpoint &&
      action.buttonRenderer.navigationEndpoint.confirmDialogEndpoint.content
        .confirmDialogRenderer.confirmEndpoint;

    if (!sejParam) {
      throw new Error(
        "We couldn't get your information! Try opening this dialog again",
      );
    }

    const csnParam: string = feedData[0].csn;
    const xsrfToken: string = feedData[1].xsrf_token;

    const historyOn = turnOffText !== undefined;

    this.historyFeedData = { historyOn, sejParam, csnParam, xsrfToken };
    return this.historyFeedData;
  }

  isToggling = false;

  async toggle() {
    let historyFeedData: HistoryFeedData;
    this.isToggling = true;
    if (!this.historyFeedData) {
      historyFeedData = await this.getHistoryFeed();
    } else {
      historyFeedData = this.historyFeedData;
    }

    const body = new URLSearchParams();
    body.set('sej', JSON.stringify(historyFeedData.sejParam));
    body.set('csn', historyFeedData.csnParam);
    body.set('session_token', historyFeedData.xsrfToken);
    const response = await this.fetch(
      'https://www.youtube.com/service_ajax?name=feedbackEndpoint',
      {
        method: 'post',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: body,
      },
    );

    const data = JSON.parse(await response.text());
    if (data.code !== 'SUCCESS') {
      throw new Error('Toggling failed');
    }

    this.historyFeedData = null;
    const newHistoryOn = !historyFeedData.historyOn;
    this.isToggling = false;
    return newHistoryOn;
  }
}

async function runImmediately() {
  const client = await youtubeClientPromise;
  client.getHistoryFeed();
}

runImmediately();

async function updateHistoryStatus(client: YoutubeClient) {
  const historyStatus = document.getElementById('historyStatus')!;
  historyStatus.innerText = 'Loading';
  try {
    const historyInfo = await client.getHistoryFeed();
    if (!client.isToggling) {
      document.getElementById('loading')!.classList.add('d-none');
      historyStatus.innerText = historyInfo.historyOn ? 'ON' : 'OFF';
    }
  } catch (e) {
    historyStatus.innerText = 'Error';
    document.getElementById('loading')!.classList.add('d-none');
    return;
  }
}

async function sleep(timeoutMillis: number) {
  return new Promise(resolve => {
    setTimeout(resolve, timeoutMillis);
  });
}

function historyOnMatches(client: YoutubeClient, expectedHistoryOn: boolean) {
  return (
    client.historyFeedData !== null &&
    client.historyFeedData.historyOn === expectedHistoryOn
  );
}

document.addEventListener('DOMContentLoaded', async () => {
  const client = await youtubeClientPromise;
  const toggleButton = document.getElementById(
    'toggleButton',
  ) as HTMLButtonElement;

  toggleButton.addEventListener('click', async () => {
    toggleButton.disabled = true;
    document.getElementById('historyStatus')!.innerText = 'Toggling';
    document.getElementById('loading')!.classList.remove('d-none');
    try {
      const expectedHistoryOn = await client.toggle();

      while (!historyOnMatches(client, expectedHistoryOn)) {
        await client.getHistoryFeed();

        if (!historyOnMatches(client, expectedHistoryOn)) {
          client.historyFeedData = null;
          await sleep(1000);
        }
      }

      await updateHistoryStatus(client);
    } catch (e) {
      document.getElementById('error')!.innerText = e.message;
    } finally {
      toggleButton.disabled = false;
      document.getElementById('loading')!.classList.add('d-none');
    }
  });

  document.getElementById('openHistory')!.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.create({ url: 'https://www.youtube.com/feed/history' });
      window.close();
    });
  });

  await updateHistoryStatus(client);
});
