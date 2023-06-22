
let graph=new Graph([],['blue']);
let canvas_safari=null;
let view=null;
let ctx_safari=null;
let autofit=true;
let title='EQNR';
let orders=[
    //new Order('EQNR',2,new TimePoint(1,1)),
];
function drawImage(ctx_safari,img,p){
    if(img!=null)
        ctx_safari.drawImage(img,p.x-img.width/2,p.y-img.height/2);
}
function loadImage(name){
    let img=new Image();
    img.src='../static/icons/'+name+'.png';
    img.onload=(e)=>{icons[name]=img; render();}
}
let icons={};
loadImage('buy');
loadImage('sell');

function setup(targetId,ticker,mode='view'){
    canvas_safari=document.getElementById(targetId);
    canvas_safari.addEventListener('contextmenu', event => event.preventDefault());
    if(mode=='view'){
        canvas_safari.addEventListener("mousemove",(e)=>{pan(e);document.body.style.overflow='hidden';});
        canvas_safari.addEventListener("mouseleave",(e)=>{document.body.style.overflow='scroll';});
        canvas_safari.addEventListener("mousedown",(e)=>action=e.button);
        canvas_safari.addEventListener("mouseup",(e)=>{action=-1;selectedElement=null;});
        canvas_safari.addEventListener("wheel",(e)=>zoom(e));
    }
    view=new Viewport(new TimeRect(0,9,0,100),canvas_safari.width,canvas_safari.height);
    ctx_safari=canvas_safari.getContext('2d');
    loadData(ticker);
    title=ticker;
}
let cursor=new Point(0,0);
let action=-1;
let selectedElement=null;
let extras=[];
function pan(e){
    //alert(e);i
    if(action==0){
        let amountX=-(e.x-cursor.x)/canvas_safari.width*(view.source.to-view.source.from);
        let amountY=(e.y-cursor.y)/canvas_safari.height*(view.source.max-view.source.min);
        view.source.to+=amountX;
        view.source.from+=amountX;
        
        view.source.min+=amountY;
        view.source.max+=amountY;
        if(autofit)view.fitVertically(graph);
    }
    cursor.x=e.x;
    cursor.y=e.y;
    let cpos= canvas_safari.getBoundingClientRect();
    let bpos= document.body.getBoundingClientRect();
    let hoverpos=cursor.displaced(-cpos.left+bpos.left,-cpos.top+bpos.top);

    if(action==2){
        if(selectedElement==null){
            selectedElement=new Arrow(view.untransform(hoverpos),view.untransform(hoverpos));
            extras.push(selectedElement);
        }
        else{
            selectedElement.b=view.untransform(hoverpos);
        }
    }
    render();
}
function zoom(e){
    if(autofit) toggleFitVertically();
    let middle=(view.source.from+view.source.to)/2;
    let d=view.source.to-middle;
    d*=1+e.deltaY*0.002;
    view.source.from=middle-d;
    view.source.to=middle+d;

    middle=(view.source.min+view.source.max)/2;
    d=view.source.max-middle;
    d*=1+e.deltaY*0.002;
    view.source.min=middle-d;
    view.source.max=middle+d;

    render();
}
function toggleFitVertically(){
    autofit=!autofit;
    if(autofit){
        document.getElementById('toggleFitVertically').classList.add('enabled');
        view.fitVertically(graph);
        render();
    }else{
        document.getElementById('toggleFitVertically').classList.remove('enabled');
    }
}
function setTimeframe(days){
    view.source.to=graph.data[graph.data.length-1].time;
    view.source.from=view.source.to-days;
    if(autofit)
        view.fitVertically(graph);

}
async function loadData(ticker,renderGraph=true){
    let p=document.getElementById('res');
    await fetch('../api/quotes?path='+ticker)
    .then(response=>response.json())
    .then(data=>{
        graph.data=[];
        let q=data;
        if(!q['Close'])return;
        for(let i=0; i<q['Close'].length; i++){
            let time=parseInt(q['Time'][i].substring(0,2))*365+parseInt(q['Time'][i].substring(2,4))*30.5+parseInt(q['Time'][i].substring(4,6))
            graph.data.push(new TimePoint(time*5/7,parseFloat(q['Close'][i])));
        }
        view.fit(graph);
        if(renderGraph)
        render();
    });
}

function render(){
    ctx_safari.fillStyle=canvas_safari.style.backgroundColor;
    ctx_safari.fillRect(0,0,canvas_safari.width,canvas_safari.height);
    ctx_safari.fillStyle='#bcd';
    ctx_safari.font = "30px Verdana ";
    ctx_safari.fillText(title, 10, 40);

    graph.render(ctx_safari);
    for(let i=0; i<extras.length; i++)
        extras[i].render(ctx_safari);
        
    for(let i=0; i<orders.length; i++){
        let p=view.transform(orders[i].tp);
        if(orders[i].amount>0)
            drawImage(ctx_safari,icons.buy,p);
        else
            drawImage(ctx_safari,icons.sell,p);
    }
}
