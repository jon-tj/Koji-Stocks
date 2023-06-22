// loads in the data about a stock
async function setup_stock_overview() {
    let urls    = window.location.href.split('/');
    let market  = urls[urls.length-2];
    let ticker  = urls[urls.length-1];

    // where to put data
    let information     = document.getElementById("informational_data");
    let about           = document.getElementById('about');
    let quick_look      = document.getElementById("quick_look");
    let eps_surprise    = document.getElementById('eps_surprise');
    let fincancial_cal  = document.getElementById('financial_calendar');
    let price_currency  = "usd or something";

    await fetch('/api/about/'+market+'/'+ticker)
    .then(response=>response.json())
    .then(data=>{
        price_currency=data['currency'];
        if (!data) { return; }

        // buy and sell buttons
        if (!data['name'] || data['nordnet_id']=="_unknown_") { 
            // we dont have enough information about the stock
            document.getElementById('btn_buy').remove();
            document.getElementById('btn_sell').remove();
        } else { 
            // provide correct url for buttons
            let name1=data['name'].replaceAll(' ASA','').replaceAll(' AS','').replaceAll(' ','-');
            document.getElementById('name_of_stock').innerHTML=data['name'];
            let nid=data['nordnet_id'];
            document.getElementById('btn_buy').onclick=()=>window.location="https://www.nordnet.no/market/stocks/"+nid+"-"+name1+"/order/buy";
            document.getElementById('btn_sell').onclick=()=>window.location="https://www.nordnet.no/market/stocks/"+nid+"-"+name1+"/order/sell";
        }

        if(data['analysis']){
            document.getElementById('beta').innerHTML       ="Beta: "+Math.round(100* data['analysis']['beta'])*0.01;
            document.getElementById('volatility').innerHTML ="Volatility: "+Math.round(100* data['analysis']['volatility'])*0.01;
        }

        if (session.expires) {

            // the person is logged in and therefore they are allowed to see this..
            if(data['FinancialCalendar']){
                // {"Time":["180425","180425","180515","180516",..],"Type":["EarningsCall","EarningsCall","Shareholdermeeting","EarningsCall","Presentation",..]}
                let pack    = data['FinancialCalendar'];
                let length  = pack['Time'].length;
                let html    = `<h3>Financial Calendar</h3>
                <table id="financial_calendar">
                    <tr>
                        <th>Time</th>
                        <th>Type</th>
                    </tr>`;
                for (let i = length-1; i >= Math.max(0,length-10); i--) {
                    html += `
                    <tr class="listbox">
                        <td>${standardTimeToStr(pack['Time'][i])}</td>
                        <td>${pack['Type'][i]}</td>
                    </tr>
                    `;
                }
                html += `</table>`;
                information.innerHTML += html;  
            }
    
            if(data['About']){
                // {"Employees":[21936],"Incorporatedyear":[1995],"Description":["EquinorASA,f..."],"City":["STAVANGER"],"Phone":[51990000],"Homepage":["https://www.equinor.com/"]}
                let pack = data['About'];
                if (pack['Homepage']) { pack['Homepage'] = `<a href=${pack['Homepage']}>${pack['Homepage']}</a>`; }
                if (pack['City'])     { pack['City']     = `Based in ${pack['City']}`; }
                Object.entries(pack).forEach(function(e) {
                    about.innerHTML += `
                    <tr class="listbox">
                        <td>${e[0]}</td>
                        <td>${e[1]}</td>
                    </tr>
                    `;
                });
            }
            
            // quick look
            if (data['Finances']) {
                // {"Time":["230418"],"Currency":["USD"],"PE":[3.21],"Marketcap":["92.279B"],"Dividendyield":[8.88],"Beta":["0.96"],"ROETTM":[61.82],"NetprofitsTTM":[19.29],"GrossMarginTTM":[63.89],"TTMEBITD":["83.723B"],"Debttoequity":[59.58],"Nextearningsdate":"Apr5th,2023"}
                let pack = data['Finances'];
                
                if (pack['Next earnings date']) { 
                    pack['Next earnings date'] = standardTimeToStr(pack['Next earnings date']); 
                }
                let html = `
                <h3>${lang['Quick look']}</h3>
                <table id="quick_look">
                    <tr>
                        <th>Info</th>
                        <th>Stats</th>
                    </tr>`;
                Object.entries(pack).forEach(function (e) {
                    if (e[0]!='Time' && e[0]!='Beta') {
                        html +=`
                        <tr class="listbox">
                            <td>${e[0]}</td>
                            <td>${e[1]}</td>
                        </tr>`;
                    }
                });
                html += `</table>`;
                information.innerHTML += html;
            }
    
            if(data['QuarterlySurpriseEPS']) {
                // {"Time":["200205","200205","200205","200205","200505", ..],"Difference%":["0.64073","1.75173","1.04","2.51","1.14956","1.13883", ..]}
                let pack    = data['QuarterlySurpriseEPS'];
                let length  = pack['Time'].length;
                let html    = `
                <h3>EPS Surprise</h3>
                <table id="eps_surprise">
                    <tr>
                        <th>Time</th>
                        <th>Diff% Actual/Expected EPS</th>
                    </tr>`;
                for (let i=0; i<length; i++) {
                    html += `
                    <tr class="listbox">
                        <td>${standardTimeToStr(pack['Time'][i])}</td>
                        <td>${data['QuarterlySurpriseEPS']['Difference%'][i]}</td>
                    </tr>`;
                }
                html += `</table>`;
                information.innerHTML += html;
                
            }
        }
    });
    await fetch('/api/latest/prices?path='+ticker+'-'+market)
    .then(response=>response.json())
    .then(data=>{
        if (!data['change']) {
            document.getElementById('change_price').innerHTML = "Price data not available.";
            return;
        }
        let posneg='positive';
        let prefix='+';
        let suffix=price_currency;
        if (suffix=='NOK') { suffix="kr"; } //just a lil easier on the eyes :)

        if (data['change']<0) {
            posneg='negative';
            prefix='';
        }

        let change_price=document.getElementById('change_price')
        change_price.classList.add(posneg);
        change_price.innerHTML = prefix+ data['change']+'%';
        document.getElementById('curr_price').innerHTML = data['latest'] + "&nbsp" + suffix;

    });
    
}