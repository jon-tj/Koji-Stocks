// <3
function remap(o,min1,max1,min2,max2){
    return (o-min1)/(max1-min1)*(max2-min2)+min2;
}
function line(ctx,a,b){
    ctx.beginPath();
    let p=view.transform(a);
    ctx.moveTo(p.x,p.y);
    p=view.transform(b);
    ctx.lineTo(p.x,p.y);
    ctx.stroke();
}
function getCookie(name) {
    let all=document.cookie.split(';');
    for(let i=0; i<all.length; i++)
        if(all[i].startsWith(name))
            return all[i].split('=')[1];
    return null;
}
function setCookie(name,value) {
    let all=document.cookie.split(';');
    for(let i=0; i<all.length; i++)
        if(all[i].startsWith(name)){
            all[i]=all[i].substring(all[i].indexOf('='))+value;
            document.cookie=all.join(';');
            return;
        }
        
    document.cookie+=name+'='+value+';';
}
let months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
let numberCountSuffix=['st','nd','rd','th','th','th','th','th','th','th'];
function standardTimeToStr(f){
    f=f.toString();
    let year=parseInt(f.substring(0,2))+2000;
    if(year>2070)year-=100;
    let dom=parseInt(f.substring(4,6));
    return months[parseInt(f.substring(2,4))-1]+' '+ dom+numberCountSuffix[dom%10]+", "+year;
}
function getLang(){
    let l=window.location.href.split('/')[3];
    if(['en','no','ch'].includes(l))
    return "/"+l;
    return "/en";
}

// General stuff
class TimePoint{
    constructor(time,y){
        this.time=time;
        this.y=y;
    }
    displaced(dx,dy){ return new TimePoint(this.time+dx,this.y+dy); }
}
class Point{
    constructor(x,y){
        this.x=x;
        this.y=y;
    }
    displaced(dx,dy){ return new Point(this.x+dx,this.y+dy); }
}
class Vector{
    constructor(x,y){
        this.x=x;
        this.y=y;
    }
    normal(){ return new Vector(-this.y,this.x) }
    normalize(){
        let mul=1.0/Math.sqrt(this.x*this.x+this.y*this.y);
        this.x*=mul;
        this.y*=mul;
        return this;
    }
}
class TimeRect{
    constructor(from,to,min,max){
        this.from=from;
        this.to=to;
        this.min=min;
        this.max=max;
    }
    transform(tp,width,height){
        return new Point(remap(tp.time,this.from,this.to,0,width),remap(tp.y,this.min,this.max,height-1,1));
    }
    untransform(p,width,height){
        return new TimePoint(remap(p.x,0,width,this.from,this.to),remap(p.y,height-1,1,this.min,this.max));
    }
}
class Viewport{
    constructor(source,width,height){
        this.source=source;
        this.width=width;
        this.height=height;
    }
    transform(tp){
        return this.source.transform(tp,this.width,this.height);
    }
    untransform(tp){
        return this.source.untransform(tp,this.width,this.height);
    }
    fitVertically(graph){
        if(graph.data.length<1)return;
        let start=graph.timeToId(this.source.from)+1;
        let end=graph.timeToId(this.source.to);

        this.source.min= Math.min(graph.smoothValueAtTime(this.source.from),graph.smoothValueAtTime(this.source.to));
        this.source.max= Math.max(graph.smoothValueAtTime(this.source.from),graph.smoothValueAtTime(this.source.to));
        for(let i=start; i<=end; i++){
            if(graph.data[i].y<this.source.min) this.source.min=graph.data[i].y;
            if(graph.data[i].y>this.source.max) this.source.max=graph.data[i].y;
        }
    }
    fitHorizontally(graph){
        if(graph.data.length<1)return;
        this.source.from=graph.data[0].time;
        this.source.to=graph.data[graph.data.length-1].time;
    }
    fit(graph){
        this.fitHorizontally(graph);
        this.fitVertically(graph);
    }
}

// renderable objects
class Graph{
    constructor(data,colors){
        this.data=data;
        this.colors=colors;
    }
    valueAtTime(time){
        return this.data[this.timeToId(time)].y;
    }
    smoothValueAtTime(time){
        let i=this.timeToId(time);
        if(i>=this.data.length-1)return this.data[this.data.length-1].y;
        if(i<0)return this.data[0].y;
        let j=remap(time,this.data[i].time,this.data[i+1].time,0.0,1);
        return this.data[i].y*(1-j)+this.data[i+1].y*(j);
    }
    timeToId(time){
        if(time<=this.data[0].time)return -1;
        let i=0; //a simple optimization would be to approximate i at the start, to skip a bunch of checks but im lazy.
        for(;i<this.data.length; i++){
            if(this.data[i].time>time){
                return i-1;
            }
        }
        return this.data.length-1;
    }
    render(ctx){
        if(this.data.length<2)return;
        ctx.lineWidth=1;
        let skip=Math.max(1,Math.floor((view.source.to-view.source.from)/500));
        
        let i=Math.floor(Math.max(skip,this.timeToId(view.source.from))/skip)*skip;
        let j=Math.min(graph.data.length,this.timeToId(view.source.to)+skip+1);
        for(; i<j; i+=skip){
            ctx.strokeStyle = graph.colors[Math.min(graph.colors.length-1,i-1)];
            line(ctx,graph.data[i],graph.data[i-skip])
        }
    }
}
class Gizmo{
    constructor(tp,img){
        this.tp=tp;
        this.img=img;
    }
}
class Arrow{
    constructor(a,b){
        this.a=a;
        this.b=b;
        this.color='red';
    }
    render(ctx){
        ctx.strokeStyle = this.color;
        ctx.lineWidth=2;

        let headSize=10;
        let a=view.transform(this.a);
        let b=view.transform(this.b);
        let along=new Vector(b.x-a.x,b.y-a.y).normalize();
        let normal=along.normal().normalize();
        ctx.beginPath();
        ctx.moveTo(a.x,a.y);
        ctx.lineTo(b.x,b.y);
        ctx.lineTo(b.x+normal.x*headSize-along.x*headSize,b.y+normal.y*headSize-along.y*headSize);
        ctx.moveTo(b.x,b.y);
        ctx.lineTo(b.x-normal.x*headSize-along.x*headSize,b.y-normal.y*headSize-along.y*headSize);
        ctx.stroke();
    }
}