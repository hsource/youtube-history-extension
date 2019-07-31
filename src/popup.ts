import { SidebarItem, Endpoint } from './types/sidebarItems';

async function createYoutubeClient() {
  const homePageResponse = await fetch('https://www.youtube.com/');
  const homePageText = await homePageResponse.text();
  const idToken = homePageText.match(/"ID_TOKEN":"([^"]+)"/)[1];
  const version = homePageText.match(
    /"INNERTUBE_CONTEXT_CLIENT_VERSION":"([^"]+)"/,
  )[1];

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
  idToken: string;
  version: string;

  historyFeedData: HistoryFeedData | null = null;

  constructor({ idToken, version }: { idToken: string; version: string }) {
    this.idToken = idToken;
    this.version = version;
  }

  async fetch(input: RequestInfo, init?: RequestInit) {
    const newInit: RequestInit = init ? init : {};
    newInit.headers = newInit.headers ? newInit.headers : {};
    newInit.headers['x-youtube-client-version'] = this.version;
    newInit.headers['x-youtube-client-name'] = 1;
    newInit.headers['x-youtube-identity-token'] = this.idToken;
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
    if (!action) return;

    const sejParam =
      action.buttonRenderer &&
      action.buttonRenderer.navigationEndpoint &&
      action.buttonRenderer.navigationEndpoint.confirmDialogEndpoint &&
      action.buttonRenderer.navigationEndpoint.confirmDialogEndpoint.content
        .confirmDialogRenderer.confirmEndpoint;
    const csnParam: string = feedData[0].csn;
    const xsrfToken: string = feedData[1].xsrf_token;

    const historyOn = turnOffText !== undefined;

    this.historyFeedData = { historyOn, sejParam, csnParam, xsrfToken };
    return this.historyFeedData;
  }

  async toggle() {
    let historyFeedData: HistoryFeedData;
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
    return newHistoryOn;
  }
}

async function runImmediately() {
  const client = await youtubeClientPromise;
  client.getHistoryFeed();
}

runImmediately();

async function updateHistoryStatus(client: YoutubeClient) {
  const historyStatus = document.getElementById('historyStatus');
  historyStatus.innerText = 'Loading...';
  try {
    const historyInfo = await client.getHistoryFeed();
    historyStatus.innerText = historyInfo.historyOn ? 'ON' : 'OFF';
  } catch (e) {
    historyStatus.innerText = 'Error';
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
      document.getElementById('error').innerText = e.message;
    } finally {
      toggleButton.disabled = false;
    }
  });

  await updateHistoryStatus(client);
});
