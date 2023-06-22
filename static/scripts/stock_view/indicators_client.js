// Written by Kiran V. (Vaakir) 2023
// Two classes, calc, and indicator

// CALC class for simple calculations
class CALC {
    static DES(x,n) {
        // Returns a number with the n decimals
        return Math.round(x*10**n)/10**n;
    }
    static SUM(l) {
        // Returns the sum of a list
        return l.reduce((partialSum, a) => partialSum + a, 0);
    }
    static DECIMAL_TO_PERCENT(n) {
        // Returns decimal to percent, with thought about the decimal change of a stock change.
        // If n is 0.9, it means the change is -10% down, if the change is 1.2 it means the change is 20% up. 
        // change (n) comes from y[sell] / y[close], and can be multiplied.
        return (n-1)*100;
    }
    /*static AVRG(l,period=l.length) {
        return 
    }*/
    static arrayRemove(arr, value) { 
        // Remove value elements form the array
        return arr.filter(function(ele){ 
            return ele != value; 
        });
    }
}

// This class returns the indicators that is asked for.
// In the future these calculations should be done on the 
// serverside in order to protect (self) developed indicator code. 
// However, further development should be done in Node.js and not .py Flask
// So indicators written here are more usefull in the future.
class INDICATOR {
    static DIV = class {
        static TR(high, low, close) {
            const TR = [];
            for (let i=0;i<close.length;i++) {
                let a = high[i] - low[i];
                let b = Math.abs(high[i] - close[i-1]);
                let c = Math.abs(low[i] - close[i-1]);
                TR.push( Math.max(a,b,c) );
            }
            return TR;
        }
        static ATR(high, low, close, period) {
            let ATR = [];
            const TR = INDICATOR.DIV.TR(high, low, close);

            ATR = INDICATOR.MA.EMA2( TR, period );
            /*ATR[period-1] = null;
            for (let i=period;i<close.length;i++) {
                let temp = TR.slice(i-period, i);
                // let ATR_now = CALC.SUM(temp) / period;
                ATR[i] = (ATR[i-1] * (period-1) + TR[i])/period; // ATR_now + TR[i-1];
            }*/
            return ATR;
        }
        // tr = max([h-l,abs(h-c),abs(l-c)])
        // true_range_lis.append(tr)

        // ATR = sum(true_range_lis[len(true_range_lis)-Period:len(true_range_lis)]) / Period
        // ATR = (ATR + true_range_lis[len(true_range_lis)-1]*Period)/Period
        // ATR_list.append(ATR)

    }
    static MA = class {
        static SMA(p) {
            /**
             * @func_name SIMPLE_MOVING_AVERAGE
             * @param { p (package) = dict {data: data, period: i} }
             * @param { p.data      = list ['low', 'high', 'open', 'close', 'volume', 'asset'] }
             * @param { p.period    = int period }
             */

            let y = Object.values(p.data['close']);
            let len_y = y.length;
            
            let ma = [];
            for (let indx=p.period; indx<=len_y; indx++) {
                let temporary_list = y.slice(indx-p.period, indx);
                let AVRG = CALC.SUM( temporary_list ) / p.period;
                ma[indx-1] = CALC.DES( AVRG, 2);

            }
            return ma;
        }  
        static SMA2( close, period ) {
            let len_y = close.length;
            let ma = [];
            for (let indx=period; indx<=len_y; indx++) {
                let temporary_list = close.slice(indx-period, indx);
                let AVRG = CALC.SUM( temporary_list ) / period;
                ma[indx-1] = CALC.DES( AVRG, 2);
            }
            return ma;
        }  
        static EMA(p) {
            /**
             * @func_name EXPONENTIALLY MOVING AVERAGE
             * @source https://www.investopedia.com/ask/answers/122314/what-exponential-moving-average-ema-formula-and-how-ema-calculated.asp
             * @formula EMA = Price(t) × a  +  EMA(y) × (1−a)
             * @param { p (package) = dict {data: data, period: i} }
             * @param { p.data      = list ['low', 'high', 'open', 'close', 'volume', 'asset'] }
             * @param { p.period    = int period }
             */

            // a = 1/(Period) || a = 2 / (Period+1)
            let a = 1 / p.period;
            //let a = 2 / ( p.period + 1 );
            let y = Object.values(p.data['Quotes']['Close']);
            let len_y = y.length;
            let ma = [];
            ma[p.period - 1] = y[p.period-1];
            for (let indx=p.period; indx<len_y; indx++) {
                ma[indx] = y[indx] * a + ma[ ma.length -1 ] * ( 1 - a );
            }
            return ma;
        }
        static EMA2( close, period ) {
            /**
             * @func_name EXPONENTIALLY MOVING AVERAGE
             * @source https://www.investopedia.com/ask/answers/122314/what-exponential-moving-average-ema-formula-and-how-ema-calculated.asp
             * @formula EMA = Price(t) × a  +  EMA(y) × (1−a)
             */

            // a = 1/(Period) || a = 2 / (Period+1)
            let a = 1/ period;
            // let a = 2 / ( period + 1 );
            let len_y = close.length;
            let ma = [];

            // const isLargeNumber = (element) => element >= 0;

            // let start = close.findIndex(isLargeNumber);
            // console.log(start);
            ma[period - 1] = close[period-1];
            for (let indx=period; indx<len_y; indx++) {
                ma[indx] = close[indx] * a + ma[ ma.length -1 ] * ( 1 - a );
            }
            return ma;
        }
        static WMA(p) {
            /**
             * @func_name SIMPLE_MOVING_AVERAGE
             * @param { p (package) = dict {data: data, period: i} }
             * @param { p.data      = list ['low', 'high', 'open', 'close', 'volume', 'asset'] }
             * @param { p.period    = int period }
             */

            let y = Object.values(p.data['close']);
            let len_y = y.length;
            
            let ma = [];
            let per = p.period;
            for (let i=per;i<len_y;i++) {
                
                let vals = y.slice(i-(per-1),i+1);
                for (let i2=0;i2<vals.length;i2++) {
                    vals[i2] = vals[i2]*(per-(per-i2)+1)/((per*(per+1))/2)
                }
                ma[i] = CALC.SUM(vals);
            }
            return ma;

            /*
            y_values_WMA = []
            for i in range(len(data)):
                y = y_values_WMA
                p = i+1
                if p > Period: p = Period
                vals = data[i-(p-1):i+1]
                for i2 in range(len(vals)):
                    vals[i2] = vals[i2] * (p-(p-i2)+1)/((p*(p+1))/2)
                y_values_WMA.append(sum(vals))
            return y_values_WMA      
            */
        }
        static TEMA(p) {
            /**
            * @func_name EXPONENTIALLY MOVING AVERAGE
            * @source https://www.investopedia.com/terms/t/triple-exponential-moving-average.asp
            * @formula TEMA =(3∗EMA1​)−(3∗EMA2)+EMA3​
            * @param { p (package) = dict {data: data, period: i} }
            * @param { p.data      = list ['low', 'high', 'open', 'close', 'volume', 'asset'] }
            * @param { p.period    = int period }
            */
           let EMA1 = INDICATOR.MA.EMA(p);
           
           /*
           def TEMA(data,Period):
               #https://www.investopedia.com/terms/t/triple-exponential-moving-average.asp
               #TEMA =(3∗EMA1​)−(3∗EMA2)+EMA3​
               #WHERE:
               # EMA1 = EMA(y,Period)
               # EMA2 = EMA2(EMA1,Period)
               # EMA3 = EMa3(EMA2,Period)
               EMA1 = Trading.Indicators.EMA(data,Period)
               EMA2 = Trading.Indicators.EMA(EMA1,Period)
               EMA3 = Trading.Indicators.EMA(EMA2,Period)
               y_valuesEMA = []
               for i in range(0,len(data)):
                   value = (3*EMA1[i])-(3*EMA2[i])+EMA3[i]
                   y_valuesEMA.append(value)
               return y_valuesEMA*/
        }
        static LSMA(p) {
            let WMA = INDICATOR.MA.WMA(p);
            let SMA = INDICATOR.MA.SMA(p);

            let ma = []
            let per = p.period;
            let len_y = Object.values(p.data['close']).length;
            for (let i=per;i<len_y;i++) {
                ma[i] = WMA[i]*3 - SMA[i]*2;
                // console.log(ma[i]);
            }
            return ma;
        }
        static HHLL(p) {
            /**
             * @func_name EXPONENTIALLY MOVING AVERAGE
             * @source https://www.investopedia.com/ask/answers/122314/what-exponential-moving-average-ema-formula-and-how-ema-calculated.asp
             * @formula EMA = Price(t) × a  +  EMA(y) × (1−a)
             * @param { p (package) = dict {data: data, period: i} }
             * @param { p.data      = list ['low', 'high', 'open', 'close', 'volume', 'asset'] }
             * @param { p.period1    = int period1 }
             * @param { p.period2    = int period2 }
             */

            let HH_Period = p.period1;
            let LL_Period = p.period2;
            let highest_period = Math.max(HH_Period,LL_Period);
            

            let up_trend = false;
            let HH_value = 0;
            let LL_value = Infinity;
            let ticks_since_hh = 0;
            let ticks_since_ll = 0;

            let y = Object.values(p.data['close']);
            let y_high = Object.values(p.data['high']);
            let y_low = Object.values(p.data['low']);

            let main = [y_high[0]];

            let len_y = y.length;
            for (let i=1;i<len_y;i++) {
                // console.log(y[i],HH_value,LL_value,up_trend);
                // if ( i > highest_period ) { highest_period = i; }
                // else { highest_period = Math.max(HH_Period,LL_Period); }

                // console.log(i,HH_value,y_high[i]);
                if ( y_high[i] > HH_value ) { 
                    HH_value = y_high[i]; 
                    //console.log(i,HH_value,y_high[i])
                }
                else {
                    ticks_since_hh += 1;
                    if ( ticks_since_hh >= HH_Period ) {
                        // console.log(i,ticks_since_hh,HH_Period);
                        let temporary_list = y.slice( i - HH_Period, i + 1);
                        HH_value = Math.max( ...temporary_list );
                        ticks_since_hh = i-y_high.indexOf(HH_value);

                    }
                }
                if ( y_low[i] < LL_value) { LL_value = y_low[i]; }
                else {
                    ticks_since_ll += 1;
                    if ( ticks_since_ll >= LL_Period ) {
                        let temporary_list = y.slice( i - LL_Period, i + 1);
                        LL_value = Math.min( ...temporary_list);
                        ticks_since_ll = i-y_low.indexOf(LL_value);
                    }
                }
                if      ( up_trend == false && HH_value == y_high[i] ) { up_trend = !up_trend; }
                else if ( up_trend == true  && LL_value == y_low[i] ) { up_trend = !up_trend; }
                
                if      ( up_trend == false ) { main.push(HH_value); }
                else if (up_trend ==  true) {
                    main.push(LL_value);
                }                    
            }
            return main
        }
        static SUPERTREND( p ) {
            /**
             * @func_name SUPERTREND
             * @source https://www.tradingfuel.com/supertrend-indicator-formula-and-calculation/#Supertrend_Indicator_Formula_and_Calculation
             * @source https://tradingtuitions.com/supertrend-indicator-excel-sheet-with-realtime-buy-sell-signals/
             * @desc The function first calculates the basic upper and lower bands using the `calculateAverageTrueRange` function to determine the true range for each period. 
             *       It then calculates the final upper and lower bands and Supertrend values using the basic bands and previous values. Finally, it returns an array of Supertrend values.
             * @param { p (package) = dict {data: data, period: i} }
             * @param { p.data      = list ['low', 'high', 'open', 'close', 'volume', 'asset'] }
             * @param { p.period1    = int period1 }
             * @param { p.period2    = int multiplier }
             */
            let highs = Object.values(p.data['high']);
            let lows = Object.values(p.data['low']);
            let closes = Object.values(p.data['close']);
            let period = p.period1;
            let multiplier = p.period2/10;

            // highs, lows, closes, period, multiplier

            // Initialize variables
            let supertrend = [];
            let basicUpperBand = [];
            let basicLowerBand = [];
            let finalUpperBand = [];
            let finalLowerBand = [];
            let prevFinalUpperBand = 0;
            let prevFinalLowerBand = 0;
            let prevSupertrend = 0;
            
            // tr = max([h-l,abs(h-c),abs(l-c)])
            // true_range_lis.append(tr)

            // ATR = sum(true_range_lis[len(true_range_lis)-Period:len(true_range_lis)]) / Period
            // ATR = (ATR + true_range_lis[len(true_range_lis)-1]*Period)/Period
            // ATR_list.append(ATR)

            let ATR = INDICATOR.DIV.ATR(highs,lows,closes,period);
            // Calculate basic upper and lower bands
            for (let i = 0; i < closes.length; i++) {
                let midPoint = (highs[i] + lows[i]) / 2;
                let basicUpper = midPoint + (multiplier * ATR[i]);// INDICATOR.MA.calculateAverageTrueRange(highs, lows, closes, period));
                let basicLower = midPoint - (multiplier * ATR[i]);// INDICATOR.MA.calculateAverageTrueRange(highs, lows, closes, period));
                
                basicUpperBand.push(basicUpper);
                basicLowerBand.push(basicLower);
            }
            
            // Calculate final upper and lower bands and Supertrend values
            for (var i = period; i < closes.length; i++) {
                let basicUpper = basicUpperBand[i];
                let basicLower = basicLowerBand[i];
                
                // Calculate final upper band
                if (basicUpper < prevFinalUpperBand || closes[i - 1] > prevFinalUpperBand) { finalUpperBand[i] = basicUpper; } 
                else { finalUpperBand[i] = prevFinalUpperBand; }
                
                // Calculate final lower band
                if (basicLower > prevFinalLowerBand || closes[i - 1] < prevFinalLowerBand) { finalLowerBand[i] = basicLower;} 
                else { finalLowerBand[i] = prevFinalLowerBand; }
                
                // Calculate Supertrend value
                if (     prevSupertrend == prevFinalUpperBand && closes[i] <= finalUpperBand[i]) { supertrend[i] = finalUpperBand[i]; } 
                else if (prevSupertrend == prevFinalUpperBand && closes[i] >  finalUpperBand[i]) { supertrend[i] = finalLowerBand[i]; } 
                else if (prevSupertrend == prevFinalLowerBand && closes[i] >= finalLowerBand[i]) { supertrend[i] = finalLowerBand[i]; }
                else if (prevSupertrend == prevFinalLowerBand && closes[i] <  finalLowerBand[i]) { supertrend[i] = finalUpperBand[i]; }
                // supertrend[i] = finalUpperBand[i];

                // Update previous values
                prevFinalUpperBand = finalUpperBand[i];
                prevFinalLowerBand = finalLowerBand[i];
                prevSupertrend = supertrend[supertrend.length - 1];
            }
            return supertrend;
        }
        static calculateAverageTrueRange(highs, lows, closes, period) {
            let tr = [];
            for (let i = 1; i < highs.length; i++) {
                let h_l = highs[i] - lows[i];
                let h_pc = Math.abs(highs[i] - closes[i - 1]);
                let l_pc = Math.abs(lows[i] - closes[i - 1]);
                let trueRange = Math.max(h_l, h_pc, l_pc);
                tr.push(trueRange);
            }
            
            let atr = [];
            let sum = 0;
            for (let i = 0; i < period; i++) {
                sum += tr[i];
            }
            atr.push(sum / period);

            for (let i = period; i < tr.length; i++) {
                sum = sum - tr[i - period] + tr[i];
                atr.push(sum / period);
            }

            return atr[atr.length - 1];
        }
        static ADX(p) { 
            // USE THIS OR USE THE RSI[ 40-60 ] to decide to buy on the dual_MAcros
            /**
             * ADX values help traders identify the strongest and most profitable trends to trade.
             * The values are also important for distinguishing between trending and non-trending conditions.
             * Many traders will use ADX readings above 25 to suggest that the trend is strong enough for trend-trading strategies.
             * Conversely, when ADX is below 25, many will avoid trend-trading strategies.
             * ADX Value	Trend Strength
             * 0-25	Absent or Weak Trend
             * 25-50	Strong Trend
             * 50-75	Very Strong Trend
             * 75-100	Extremely Strong Trend
             */

            let high    = Object.values(p.data['high']);
            let low     = Object.values(p.data['low']);
            let close   = Object.values(p.data['close']);
            let period = p.period;
            
            let atr = INDICATOR.DIV.ATR(high, low, close, period);
            let dx_list = [];
            dx_list[ period -1 ] = 0;
            let upMove_list = [0];
            let downMove_list = [0];

            for (let i = 1; i < close.length; i++) {
                // CALCULATING DIRECTION MOVEMENT (DM)
                let hDiff = high[i] - high[i - 1];
                let lDiff = low[i - 1] - low[i];
                
                let pDM = 0;
                let nDM = 0;

                if      (hDiff > lDiff && hDiff > 0) { pDM = hDiff; }
                else if (lDiff > hDiff && lDiff > 0) { nDM = lDiff; }
                if (pDM > nDM || nDM < 0) { nDM = 0; }
                
                upMove_list.push( pDM );
                downMove_list.push( nDM );
            }
            upMove_list = INDICATOR.MA.EMA2( upMove_list, period );
            downMove_list = INDICATOR.MA.EMA2( downMove_list, period );

            for (let i = period; i < close.length; i++) {
                let pDI = ( upMove_list[i] * 100 ) / atr[i];
                let nDI = ( downMove_list[i] * 100 ) / atr[i];

                let DMI = Math.abs( (pDI - nDI) / (pDI + nDI) ) * 100;
                dx_list[i] = DMI;
            }

            return INDICATOR.MA.EMA2( dx_list, period );
        }   
    }
    static MOMENTUM = class {
        static RSI(p) {
            /**
             * @func_name SIMPLE_MOVING_AVERAGE
             * @source http://stockcharts.com/school/doku.php?id=chart_school:technical_indicators:relative_strength_index_rsi
             * @formula RSI = 100 - ( 100 / (1 + RS )) where RS = Average Gain / Average Loss
             *  
             * @param { p (package) = dict {data: data, period: i} }
             * @param { p.data      = list ['low', 'high', 'open', 'close', 'volume', 'asset'] }
             * @param { p.period    = int period }
             */
            let Period = p.period;
            let y_val = Object.values(p.data['close']);
            
            // First val
            let rsi = []; // Trade.list(100,Period+1);
            let gainSum = 0
            let lossSum = 0
            for (let i=1;i<Period;i++) {
                let thisChange = y_val[i] - y_val[i-1]
                if ( thisChange > 0 ) { gainSum += thisChange;     }
                else                  { lossSum += (-1)*thisChange; }
            }
            let averageGain = gainSum / Period
            let averageLoss = lossSum / Period
            if ( averageLoss==0 ) { averageLoss = 1; }
            let rs = averageGain/averageLoss

            // SMOOTHING TECHNIQUE            
            for (let i=Period+1;i<y_val.length;i++) {
                let thisChange = y_val[i] - y_val[i-1]
                if ( thisChange > 0 ) { 
                    averageGain = (averageGain * (Period - 1) + thisChange) / Period
                    averageLoss = (averageLoss * (Period - 1)) / Period
                } else {
                    averageGain = (averageGain * (Period - 1)) / Period
                    averageLoss = (averageLoss * (Period - 1) + (-1) * thisChange) / Period
                }
                rs = averageGain / averageLoss
                let currentRSI = 100 - (100 / (1 + rs))
                rsi[i] = currentRSI;
                // print(i,y_val[i],currentRSI)
            }
            return rsi
        }
    }
}
