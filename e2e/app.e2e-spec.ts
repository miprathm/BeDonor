import { BeDonorPage } from './app.po';

describe('be-donor App', function() {
  let page: BeDonorPage;

  beforeEach(() => {
    page = new BeDonorPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
