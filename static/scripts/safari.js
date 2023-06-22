async function setup(){
    await fetch("../api/query?target=tickers")
    .then(response=>response.json())
    .then(r=>{
        for(let i=0; i<r['results'].length; i++){
            tickers.push(r['results'][i]['market']+'-'+r['results'][i]['symbol']);
        }
    });
    getLevel();
    load_next();
}
let tickers=[];
let ticker='';
let answer=-1;
let rbox=document.getElementById('results');
let bbox=document.getElementById('placebets');
let rtext=document.getElementById('results_text');

async function load_next(){
    rbox.style.display='none';
    bbox.style.display='block';
    ticker=tickers[getRandomInt(tickers.length)];
    title=ticker;
    await loadData(ticker,false);
    if(graph.data.length<1)load_next();
    else{
        //yeah im lazy whachu gonna do about it
        answer=[
            graph.data[graph.data.length-3],
            graph.data[graph.data.length-2],
            graph.data[graph.data.length-1]
        ];
        graph.data.splice(graph.data.length-4);
        setTimeframe(50);
        render();
    }
}
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
async function placeBet(side){
    let correct=side*(answer[2].y-graph.data[graph.data.length-1].y)>0;
    fetch('../api/safari/update?correct='+correct).
    then( response=> {if(response.status==200)response.json().
        then(data=>{
            document.getElementById('level').innerHTML=data['level'];
        })
        else
            window.location=getLang()+"/login";
    });

    if(correct) rtext.innerHTML=lang['correct'];
    else rtext.innerHTML=lang['wrong'];
    rbox.style.display='block';
    bbox.style.display='none';
    
    selectedElement=new Arrow(graph.data[graph.data.length-1],
        graph.data[graph.data.length-1].displaced(100,0));
    extras=[selectedElement];
    for(let i=0; i<3; i++){
        graph.data.push(answer[i]);
        setTimeframe(51+i);
        render();
        await sleep(100);
    }
}
function getLevel(){
    fetch('../api/safari/stats').
    then( response=> {if(response.status==200)response.json().
    then(data=>{
        document.getElementById('level').innerHTML=data['level'];
    })
    else
        window.location=getLang()+"/login";
});
}



async function sleep(msec) {
    return new Promise(resolve => setTimeout(resolve, msec));
}