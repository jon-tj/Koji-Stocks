/*
    Might be a good idea to add that you can scroll down and load in more tickers,
    ie just load the next page in the query.
*/

async function queryTickers(self){
    await loadTickers(self.value.toLowerCase());
}
async function loadTickers(q=''){
    await fetch("/api/query?target=tickers&q="+q+"&results_per_page=10&page=0")
    .then(response=>response.json())
    .then(r=>{
        let resultsBox=document.getElementById("tickersBox");
        if(!resultsBox) return;
        resultsBox.innerHTML='';
        let lang=getLang();
        for(let i=0; i<r['results'].length; i++){
            let rr=r['results'][i];
            let d=document.createElement("div");
            d.onclick=()=>{
                window.location=lang+"/"+rr['market']+"/"+rr['symbol'];
            };
            d.classList.add('tickerBox');
            d.innerHTML= `
            <img class='market' src='/static/icons/markets/${rr['market']}.png'> 
            <h4>${rr['symbol']}</h4>
            <div class="tickers_wrapper">
                <p>${rr['name']}</p>
                <p class='sector'>${rr['sector']}</p>
            </div>`;

            resultsBox.appendChild(d);
        }
    });
}