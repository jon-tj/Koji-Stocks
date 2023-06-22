import json,math
import numpy as np
import os
from backtesting_engine import indicator

def path_to(stock):
    return 'data/stocks/'+stock['market']+'/'+stock['symbol']+".json"

def stock_from_symbol(symbol,market='osebx'):
    symbol=symbol.upper()
    with open('data/tickers.json', 'r') as f:
        stocks= json.load(f)
        for s in stocks:
            if s['market']!=market: continue
            if s['symbol']==symbol:
                return s
    return None

def get_latest_entry(channels):
    entry={}
    for channel in channels:
        entry[channel]=channels[channel][-1]
    return entry

def stock_data(stock):
    if not stock: return {}
    if stock=='all':
        with open('data/tickers.json', 'r') as f:
            stocks= json.load(f)
            all_data={}
            for s in stocks:
                #if s['market']=='nyse':continue # we dont have a lot of data, just skip
                datapath=s['symbol']+'-'+s['market']
                if not os.path.isfile(path_to(s)): continue
                with open(path_to(s), 'r') as f:
                    try:
                        all_data[datapath]=json.load(f)
                    except: continue
            return all_data
    with open(path_to(stock), 'r') as f:
        return json.load(f)
    
def get_stock_quotes(stock):
    data=stock_data(stock)
    quotes=[]
    if 'Quotes' in data:
        for p in data['Quotes']['Close']:
            quotes.append(float(p))
    return quotes

def index_data(index):
    with open('data/indices/'+index+".json", 'r') as f:
        return json.load(f)
    
def calculateVolatility(stock):
    quotes = get_stock_quotes(stock)
    returns = []
    for i in range(1, len(quotes)):
        current_price = quotes[i]
        previous_price = quotes[i - 1]
        daily_return = (current_price - previous_price) / previous_price
        returns.append(daily_return)
    mean_return = sum(returns) / max(1,len(returns))
    squared_diffs = [(r - mean_return) ** 2 for r in returns]
    variance = sum(squared_diffs) / max(1,len(squared_diffs))
    volatility = math.sqrt(variance)
    return volatility

def calculateRSI(stock):
    quotes = get_stock_quotes(stock)
    # because the RSI indicator includes smoothing, we can send extra datapoints
    # to get a more convergent RSI value. converges at len(data) ~ 30.
    return indicator.RSI(quotes[-30:])[-1]

def calculateBeta(stock, index='osebx', n=100):
    stock_quotes = get_stock_quotes(stock)[-n:]
    if len(stock_quotes)!=n:
        return 0
    index_quotes = index_data(index)['Price'][-n:]
    stock_returns = [(stock_quotes[i] - stock_quotes[i - 1]) / stock_quotes[i - 1] for i in range(1, len(stock_quotes))]
    index_returns = [(index_quotes[i] - index_quotes[i - 1]) / index_quotes[i - 1] for i in range(1, len(index_quotes))]
    covariance = np.cov(stock_returns, index_returns)[0][1]
    variance = np.var(index_returns)
    beta = covariance / variance
    return beta

def analyze_portfolio(portfolio, quotes_index='osebx', n=100):
    if len(portfolio)<2: return {}
    avgVolatility = 0
    avgBeta = 0
    avgRSI=0
    weights= get_portfolio_relative_sizes(portfolio)
    sumweights=0
    sectors={}
    for symbol_and_market in portfolio:
        symbol_and_market=symbol_and_market.split(':')
        symbol=symbol_and_market[0]
        market='osebx'
        if len(symbol_and_market)>1: market=symbol_and_market[1]
        if symbol == 'cash': continue
        stock=stock_from_symbol(symbol,market)
        if not stock:continue
        sector=stock['sector']
        if sector in sectors: sectors[sector]+=weights[symbol]
        else: sectors[sector]=weights[symbol]
        avgVolatility += weights[symbol]*calculateVolatility(stock)
        avgBeta += weights[symbol]*calculateBeta(stock, quotes_index, n)
        avgRSI += weights[symbol]*calculateRSI(stock)
        sumweights+=weights[symbol]
    avgVolatility /= sumweights
    avgBeta /= sumweights
    avgRSI /= sumweights

    #it makes sense to send the sectors as a sorted list,
    #from 1-0 since we will render them with a set length
    highest_sector=0
    for sector in sectors:
        if sectors[sector]>highest_sector: highest_sector=sectors[sector]
        
    for sector in sectors:
        sectors[sector]/=highest_sector
    return {"volatility": avgVolatility, "beta": avgBeta, "rsi":avgRSI, "diversified":len(sectors.values()), "sectors":dict(sorted(sectors.items(), key=lambda item: item[1]))}

def analyze_stock(symbol,market='osebx', quotes_index='osebx', n=100):
    stock=stock_from_symbol(symbol,market)
    return {"volatility": calculateVolatility(stock), "beta": calculateBeta(stock, quotes_index, n)}

def get_portfolio_relative_sizes(portfolio):
    p={}
    for symbol_and_market in portfolio: #EQNR:osebx
        sam=symbol_and_market.split(':')
        symbol=sam[0]
        if symbol == 'cash': # we assume this to be a 1-to-1 mapping :)
            p['cash']=portfolio['cash']
        else:
            market='osebx'
            if len(sam)>1:market=sam[1]
            stock=stock_from_symbol(symbol,market)
            p[symbol]=portfolio[symbol_and_market]* get_latest_price(stock)
    return p


def get_latest_price(stock):
    quotes=get_stock_quotes(stock)
    if len(quotes)<1:return 0
    return quotes[-1]

def get_column(datapath,column):
    symbol= datapath[0]
    market="osebx"
    if len(datapath)>1: market=datapath[1]
    if symbol=='all':
        data=stock_data('all')
        ass={}
        if not data: return json.dumps('Failed to load stock data.')
        for s in data:
            if column in data[s]:
                ass[s]=get_latest_entry(data[s][column]) #only return one entry cus lazy
        return json.dumps(ass)
    else:
        smb=stock_from_symbol(symbol,market)
        data=stock_data(smb)
        if not data: return json.dumps('Failed to load stock data.')
        if column in data:
            return json.dumps(data[column])
        return json.dumps([])

def get_der_column(datapath,column,subcol='Close'):
    symbol= datapath[0]
    market="osebx"
    if len(datapath)>1: market=datapath[1]
    if symbol=='all':
        data=stock_data('all')
        ass={}
        if not data: return json.dumps('Failed to load stock data.')
        for s in data:
            if column in data[s]:
                if len(data[s][column][subcol])<2: continue
                ass[s]=round((data[s][column][subcol][-1]-data[s][column][subcol][-2])/data[s][column][subcol][-2]*100,2)
        return json.dumps(ass)
    else:
        smb=stock_from_symbol(symbol,market)
        data=stock_data(smb)
        if not data: return json.dumps('Failed to load stock data.')
        if column in data:
            return json.dumps(round((data[column][subcol][-1]-data[column][subcol][-2])/data[column][subcol][-2]*100,2))
        return json.dumps(0)
def get_der_and_latest_column(datapath,column,subcol='Close'):
    symbol= datapath[0]
    market="osebx"
    if len(datapath)>1: market=datapath[1]
    if symbol=='all':
        data=stock_data('all')
        ass=[]
        if not data: return json.dumps('Failed to load stock data.')
        for s in data:
            if column in data[s]:
                if len(data[s][column][subcol])<2: continue
                
                ass.append({'symbol':s,'change':round((data[s][column][subcol][-1]-data[s][column][subcol][-2])/data[s][column][subcol][-2]*100,2),'latest':data[s][column][subcol][-1]})
        return json.dumps(ass)
    else:
        smb=stock_from_symbol(symbol,market)
        data=stock_data(smb)
        if not data: return json.dumps('Failed to load stock data.')
        if column in data:
            return json.dumps({'change':round((data[column][subcol][-1]-data[column][subcol][-2])/data[column][subcol][-2]*100,2),'latest':data[column][subcol][-1]})
        return json.dumps(0)