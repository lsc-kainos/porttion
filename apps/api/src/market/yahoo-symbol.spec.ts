import {
  toYahooSymbol,
  fromYahooQuoteType,
  inferAssetClass,
} from './yahoo-symbol';

describe('toYahooSymbol', () => {
  const cases: Array<[string, string]> = [
    ['PETR4', 'PETR4.SA'],
    ['VALE3', 'VALE3.SA'],
    ['BOVA11', 'BOVA11.SA'],
    ['AAPL', 'AAPL'],
    ['MSFT', 'MSFT'],
    ['BTC', 'BTC-USD'],
    ['ETH', 'ETH-USD'],
    ['USD', 'USDBRL=X'],
  ];
  it.each(cases)('%s → %s', (input, expected) => {
    expect(toYahooSymbol(input)).toBe(expected);
  });
});

describe('inferAssetClass', () => {
  it('B3 4 dígitos → acoes_br', () => {
    expect(
      inferAssetClass('PETR4', { quoteType: 'EQUITY', exchange: 'SAO' }),
    ).toBe('acoes_br');
  });
  it('B3 11 final → etf', () => {
    expect(
      inferAssetClass('BOVA11', { quoteType: 'ETF', exchange: 'SAO' }),
    ).toBe('etf');
  });
  it('CRYPTOCURRENCY → cripto', () => {
    expect(inferAssetClass('BTC', { quoteType: 'CRYPTOCURRENCY' })).toBe(
      'cripto',
    );
  });
  it('CURRENCY → moeda', () => {
    expect(inferAssetClass('USD', { quoteType: 'CURRENCY' })).toBe('moeda');
  });
  it('ETF US → etf', () => {
    expect(inferAssetClass('SPY', { quoteType: 'ETF' })).toBe('etf');
  });
});

describe('fromYahooQuoteType', () => {
  it('mapeia tipos conhecidos', () => {
    expect(fromYahooQuoteType('EQUITY')).toBe('acoes_br');
    expect(fromYahooQuoteType('ETF')).toBe('etf');
    expect(fromYahooQuoteType('CRYPTOCURRENCY')).toBe('cripto');
    expect(fromYahooQuoteType('CURRENCY')).toBe('moeda');
  });
});
