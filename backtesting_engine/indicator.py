import math

# Oftenly used calculations
def des(x,n): 
    return round(x*10**n)/10**n


# Indicators
def SMA(data,Period=10):          #SIMPLE MOVING AVERAGE
    # MA = Sum(y_val[period])/period
    if Period==0: Period=1
    y_valuesMA = [0]*(Period-1)
    for i in range(Period, len(data)+1):
        current_ma = sum(data[i-Period:i])/Period
        y_valuesMA.append(current_ma)
    return y_valuesMA
def WMA(data,Period=10):          #WEIGHTED MOVING AVERAGE
    #https://school.stockcharts.com/doku.php?id=technical_indicators:hull_moving_average
    #https://alanhull.com/hull-moving-average
    #https://corporatefinanceinstitute.com/resources/knowledge/trading-investing/weighted-moving-average-wma/
    y_values_WMA = [0]*Period
    p = Period
    for i in range(Period,len(data)):
        #y = y_values_WMA
        #p = i+1
        #if p > Period: p = Period
        vals = data[i-(p-1):i+1]
        #print(vals)
        for i2 in range(len(vals)):
            vals[i2] = vals[i2]*(p-(p-i2)+1)/((p*(p+1))/2)
            #print(vals, p,i2)
        y_values_WMA.append(sum(vals))
    return y_values_WMA      
def HMA(data,Period=10):          #HULL MOVING AVERAGE
    #HMA[i] = MA( (2*MA(input, period/2) – MA(input, period)), SQRT(period)) where MA is a moving average and SQRT is square root. The user may change the input (close), period length and shift number. This indicator’s definition is further expressed in the condensed code given in the calculation below.
    WMA1 = WMA(data,round(Period/2))
    WMA2 = WMA(data,Period)
    TEMP_HMA = []
    for i in range(len(WMA1)): TEMP_HMA.append( (2 * WMA1[i])-WMA2[i] )
    RAW_HMA = WMA(TEMP_HMA,round(math.sqrt(Period)))
    return RAW_HMA

def EMA(data,Period=10):          #EXPONENTIALLY MOVING AVERAGE
    # https://www.investopedia.com/ask/answers/122314/what-exponential-moving-average-ema-formula-and-how-ema-calculated.asp
    # EMA = Price(t) × a  +  EMA(y) × (1−a)
    # a = 1/(Period) || a = 2 / (Period+1)
    a = 2/(Period+1)
    y_valuesEMA = [data[0]]
    for i in range(1,len(data)):
        current_EMA = data[i] * a + y_valuesEMA[len(y_valuesEMA)-1] * (1-a)
        y_valuesEMA.append(current_EMA)
    return y_valuesEMA
def LSMA(data,Period=10):
    if Period<1: Period=1

    W = WMA(data,Period)
    S = SMA(data,Period)
    y_valuesMA = [0]*(Period)
    for i in range(Period, len(data)):
        y_valuesMA.append( W[i]*3 - S[i]*2 )
    return y_valuesMA

def AROON(data,Period=14):
    #Aroon-Up = [(number of periods) - (number of periods since the High)] / (number of periods) * 100%.
    #Aroon-Down = [(number of periods) - (number of periods since the Low)] / (number of periods) * 100%.

    try:
        high    = data["Quotes"]["High"]
        low     = data["Quotes"]["Low"]
    except:
        high = low = data

    Arroon = [50]*Period
    High_list = high #[i for i in high[0:len(data['close'])]]
    Low_list  = low  #[i for i in low[0:len(data['close'])]]
    for i in range(Period,len(high)):
        start = i-Period
        last_h = Period-High_list[start:i].index(max(High_list[start:i]))
        last_l = Period- Low_list[start:i].index(min( Low_list[start:i]))
        Arroon.append(last_l-last_h+50)
    return Arroon
def RSI(data,Period=14):          #RELATIVE STRENGTH INDEX
    # http://stockcharts.com/school/doku.php?id=chart_school:technical_indicators:relative_strength_index_rsi
    # RS = Average Gain / Average Loss
    # 
    #               100
    # RSI = 100 - --------
    #              1 + RS
    
    if len(data)<Period+1: return [50]*max(1,len(data))

    #First val
    rsi = [50]*(Period+1)
    gainSum = 0
    lossSum = 0
    for i in range(1,Period):
        thisChange = data[i] - data[i-1]
        if thisChange > 0: gainSum += thisChange
        else:              lossSum += (-1)*thisChange
    averageGain = gainSum / Period
    averageLoss = lossSum / Period
    if averageLoss==0: averageLoss=1
    rs = averageGain/averageLoss

    #SMOOTHING TECHNIQUE            
    for i in range(Period+1,len(data)):
        thisChange = data[i] - data[i-1]
        if thisChange > 0: 
            averageGain = (averageGain * (Period - 1) + thisChange) / Period
            averageLoss = (averageLoss * (Period - 1)) / Period
        else:
            averageGain = (averageGain * (Period - 1)) / Period
            averageLoss = (averageLoss * (Period - 1) + (-1) * thisChange) / Period
        rs = averageGain / averageLoss
        currentRSI = 100 - (100 / (1 + rs))
        rsi.append(currentRSI)
    return rsi

def HV(data,Period=14):           #HISTORICAL VOLATILITY
    
    #https://corporatefinanceinstitute.com/resources/knowledge/trading-investing/historical-volatility-hv/
    y_valuesHV = [0]*(Period)
    for i in range(Period,len(data)):
        avrg = sum(data[i-Period:i])/Period

        diff = 0
        for i2 in range(i-Period,i):
            diff += (data[i2]-avrg)**2
        variance = diff/Period
        standard_deviation = math.sqrt(variance) #The standard deviation indicates that the stock price of this stock/crypto usually deviates from its average stock price by <- x.
        y_valuesHV.append(standard_deviation)
    return y_valuesHV
def SUPERTREND(data,Period=10,Multiplier=3): #contine
    #https://www.tradingfuel.com/supertrend-indicator-formula-and-calculation/#Supertrend_Indicator_Formula_and_Calculation
    #https://tradingtuitions.com/supertrend-indicator-excel-sheet-with-realtime-buy-sell-signals/

    true_range_lis  = [0]*Period
    ATR_list        = [0]*Period
    UPBAND          = [0]*Period
    LOBAND          = [0]*Period
    FINAL_UPPERBAND = [0]*Period
    FINAL_LOWERBAND = [0]*Period
    SUPERTREND      = [0]*Period
    try:
        close   = data["Quotes"]["Close"]
        high    = data["Quotes"]["High"]
        low     = data["Quotes"]["Low"]
    except:
        high = low = close = data
    for i in range(Period,len(close)):
        c  = close[i-1] #pclose
        h  = high[i]
        l  = low[i]
        tr = max([h-l,abs(h-c),abs(l-c)])
        true_range_lis.append(tr)

        ATR = sum(true_range_lis[len(true_range_lis)-Period:len(true_range_lis)]) / Period
        ATR = (ATR + true_range_lis[len(true_range_lis)-1]*Period)/Period
        ATR_list.append(ATR)

        UPBAND.append( (h + l) / 2 + Multiplier * ATR )
        LOBAND.append( (h + l) / 2 - Multiplier * ATR )

        if    UPBAND[len(UPBAND)-1] < FINAL_UPPERBAND[len(FINAL_UPPERBAND)-1] or close[i-1] > FINAL_UPPERBAND[len(FINAL_UPPERBAND)-1]: FINAL_UPPERBAND.append( UPBAND[len(UPBAND)-1] )
        else: FINAL_UPPERBAND.append( FINAL_UPPERBAND[len(FINAL_UPPERBAND)-1] )
        
        if    LOBAND[len(LOBAND)-1] > FINAL_LOWERBAND[len(FINAL_LOWERBAND)-1] or close[i-1] < FINAL_LOWERBAND[len(FINAL_LOWERBAND)-1]: FINAL_LOWERBAND.append( LOBAND[len(LOBAND)-1] )
        else: FINAL_LOWERBAND.append( FINAL_LOWERBAND[len(FINAL_LOWERBAND)-1] )

        if   SUPERTREND[i-1] == FINAL_UPPERBAND[i-1] and close[i] < FINAL_UPPERBAND[i]: SUPERTREND.append(FINAL_UPPERBAND[i])
        elif SUPERTREND[i-1] == FINAL_UPPERBAND[i-1] and close[i] > FINAL_UPPERBAND[i]: SUPERTREND.append(FINAL_LOWERBAND[i])
        elif SUPERTREND[i-1] == FINAL_LOWERBAND[i-1] and close[i] > FINAL_LOWERBAND[i]: SUPERTREND.append(FINAL_LOWERBAND[i])
        elif SUPERTREND[i-1] == FINAL_LOWERBAND[i-1] and close[i] < FINAL_LOWERBAND[i]: SUPERTREND.append(FINAL_UPPERBAND[i])
        else: SUPERTREND.append(SUPERTREND[i-1]) #BUG FIX
        #if SUPERTREND[i] == FINAL_UPPERBAND[i]: FINAL_LOWERBAND[i]=0
        #if SUPERTREND[i] == FINAL_LOWERBAND[i]: FINAL_UPPERBAND[i]=0
    return SUPERTREND #[FINAL_LOWERBAND,FINAL_UPPERBAND]      
def HHLL(data,HH_Period=20,LL_Period=20):
    # Written for run speed
    # LL_Period_ORIGINAL = LL_Period
    # SMA = SMA(data['close'],LL_Period)
    
    # alternative y_high = y_low = close
    try:
        y_high    = data["Quotes"]["High"]
        y_low     = data["Quotes"]["Low"]
    except:
        y_high = y_low = data

    highest_period = max(HH_Period,LL_Period)

    main = [0]#*(highest_period)

    up_trend = False
    HH_value = 0
    LL_value = math.inf
    ticks_since_hh = 0
    ticks_since_ll = 0
    HH_value_since_uptrend_start = 0
    
    for i in range(1,len(y_high)):
        if i > highest_period: highest_period=i
        else: highest_period = max(HH_Period,LL_Period)
        
        #LL_Period = max(10,LL_Period_ORIGINAL-ticks_since_hh)
        if y_high[i] > HH_value: HH_value = y_high[i]
        else:
            ticks_since_hh += 1
            if ticks_since_hh >= HH_Period:
                HH_value = max(y_high[i-HH_Period:i+1])
                ticks_since_hh = i-y_high.index(HH_value)
        if y_low[i] < LL_value: LL_value = y_low[i]
        else:
            ticks_since_ll += 1
            if ticks_since_ll >= LL_Period:
                LL_value = min(y_low[i-LL_Period:i+1])
                ticks_since_ll = i-y_low.index(LL_value)
        
        if   up_trend == False and HH_value == y_high[i]: up_trend = not up_trend
        elif up_trend == True  and LL_value ==  y_low[i]: up_trend = not up_trend
        
        if   up_trend == False: main.append(HH_value)
        elif up_trend ==  True:                     
            main.append(LL_value)
    return main

        
    # Written for simplicity
    """y_high = data["high"]
    y_low = data["low"]
    highest_period = max(Period1,Period2)
    
    main = [0]*(highest_period)
    
    up_trend = False
    for i in range(highest_period,len(data)):
        HH_value = max(y_high[i-Period1:i+1])
        LL_value = min(y_low[i-Period2:i+1])
        
        if   up_trend == False and HH_value == y_high[i]: up_trend = not up_trend
        elif up_trend == True  and LL_value ==  y_low[i]: up_trend = not up_trend
        
        if   up_trend == False: main.append(LL_value)
        elif up_trend ==  True: main.append(HH_value)
    return main"""

# needs to be updated
indicator_association = {
    # main indicators
    "SMA": SMA,
    "WMA": WMA,
    "HMA": HMA,
    "EMA": EMA,
    "LSMA": LSMA,
    "SUPERTREND": SUPERTREND,
    "HHLL": HHLL,

    # sub indicators
    "RSI": RSI,
    "HV": HV,
    "AROON":AROON
}