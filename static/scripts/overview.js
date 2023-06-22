

async function loadUser(user_id="self"){
    if(!in_session && user_id=="self")return;

    await fetch("/api/about/user/"+user_id)
    .then(response=>response.json())
    .then(r=>{
        if(r){
            document.getElementById('username').innerHTML="<h4>#"+r['username']+"</h4>";
            if(user_id!="self"){
                document.getElementById('portfolioTitle').innerHTML=r['username']+lang["s portfolio"];
            }
            else
            {
                if(document.getElementById('username') && safariView){
                    document.getElementById('username').href=getLang()+"/user/"+r['id'];
                    let cor=parseInt(r['safari_bets_correct']);
                    let incor=parseInt(r['safari_bets_incorrect']);
                    safariView.innerHTML='Level '+r['safari_level']+'<br> Accuracy: '+Math.round(cor/(cor+incor+1)*10000)*0.01+'%';
                }
            }
            portfolio=r['portfolio'];
            render_cake_diagram(portfolio);
        }else if(user_id!="self"){
            document.getElementById('_before').remove();
            document.getElementById('_body').innerHTML=
            "<h1>User was not found.</h1>"+
            "<img src='/static/art/cereal-eating.gif'>"+
            "<br><br>"+
            "<a href='/'>Back to Kansas</a>";
        }
    });
    
}
async function ban_user(uid){
    await fetch('/api/ban/'+user_id_requested)
    .then(response=>response.json())
    .then(r=>{
        if(r['successful']=='true')
            document.getElementById("btn_ban").innerHTML="User was banned";
        else displayErr(r['errMsg']);
        
    });
}
async function delete_user(uid){
    await fetch('/api/delete_user/'+user_id_requested)
    .then(response=>response.json())
    .then(r=>{
        if(r['successful']=='true')
            document.getElementById("btn_delete").innerHTML="User was deleted";
        else displayErr(r['errMsg']);
        
    });
}
let sectors={};
let portfolio=null;
let safariView=document.getElementById('safari');
let portfolioView=document.getElementById('portfolio');

// -- Log in user --
function logInUser(){
    if(getCookie('session').length<6){
        
        aboutUser.innerHTML+='Logged in as '+r['username'];
    }
    setCookie('session','not logged in');
    let form=document.getElementById('login_form');
    let username=form.getElementsById('username');
    let password=form.getElementsById('password');
    
    
    fetch("/api/authenticate",{
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({username:username,password:password})
    })
    .then(response=>response.json())
    .then(r=>{
        aboutUser.innerHTML+='Logged in as '+r['username'];
    });
}
function logOutUser(){
    fetch("/api/logout");
    window.location=getLang()+'/login';
}

// -- Updating positions --
async function registerPosition(symbol,amount){
    await fetch("/api/portfolio",{
        method:"POST",
        headers: {
            "Content-Type": "application/json",
        },
        body:JSON.stringify({symbol:symbol,amount:amount})
    }).then(response=>response.json())
    .then(data=>{
        console.log(data);
        portfolio=data['portfolio'];
        render_cake_diagram(portfolio);
        if(data['msg']!="Success")
            displayErr(data['msg']);
        else
            analyze();
        //aboutUser.innerHTML+=data['msg'];
    });
}
function manuallyRegisterPosition(){
    let symbol=document.getElementById('symbol').value;
    let amount=document.getElementById('amount').value;
    registerPosition(symbol,amount);
}

// -- Render portfolio and user information --
let portfolio_hoverIndex=-1;
let portfolioAngles=[];
let ctx=null;
let canvas=null;
function setup(){
    canvas = document.getElementById("portfolioCanvas");
    if(canvas){
        ctx = canvas.getContext("2d");
        canvas.addEventListener("mousemove",(e)=>hover_cake_diagram(e));
        canvas.addEventListener("mouseleave",(e)=>{portfolio_hoverIndex=-1; render_cake_diagram(portfolio);});
    }
}

function render_cake_diagram(named_sectors_dict) {
    ctx.fillStyle='white';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // Get the total value of all sectors
    var total_value = 0;
    for (var sector in named_sectors_dict) {
      total_value += named_sectors_dict[sector];
    }

    var colors = ["#8BC34A","#FF6B6B", "#FFE66D","#4DB6AC", "#3D5A80", "#F4D35E", "#EE964B", "#F95738"];
  
    var start_angle = 0;
    let c=0;
    let x=canvas.width/4+canvas.height/4;
    let radius=Math.min(canvas.width, canvas.height) / 2 - 10;
    portfolioAngles=[];
    for (var sector in named_sectors_dict) {
        var value = named_sectors_dict[sector];
        var end_angle = start_angle + (value / total_value) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(x, canvas.height / 2);
        ctx.arc(x, canvas.height / 2, radius, start_angle, end_angle);
        ctx.closePath();
        ctx.fillStyle = colors[c%colors.length];
        ctx.fill();
        
        if(c==portfolio_hoverIndex || portfolio_hoverIndex==-1){

        var label_y = 20*c+20;
        ctx.fillRect(3,label_y-7,5,5);
    
        ctx.fillStyle = "black";
        ctx.font = "bold 12pt Arial";
        if(sector=='cash')sector=lang['cash'];
        let n=sector.split(':');
        if(n.length==1 || n[1]=='osebx') n=n[0];
        else n=n[0]+':'+n[1];
        ctx.fillText(n, 10, label_y);
        if(portfolio_hoverIndex==c){

            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fill();
        }
        }
        
        c+=1;
        portfolioAngles.push(start_angle);
        start_angle = end_angle;
    }
}
function hover_cake_diagram(e){
    var rect = canvas.getBoundingClientRect();
    let radius=Math.min(canvas.width, canvas.height) / 2 - 10;
    var x = e.clientX - rect.left- (canvas.width/4+canvas.height/4);
    var y = e.clientY - rect.top- canvas.height / 2;
    if(x*x+y*y>radius*radius){
        portfolio_hoverIndex=-1;
    }else{
        var angle = Math.atan2(y, x);
        if (angle < 0) {
          angle += 2 * Math.PI;
        }
        portfolio_hoverIndex=portfolioAngles.length-1;
        for(let i=0; i<portfolioAngles.length; i++){
            if(portfolioAngles[i]>angle){
                portfolio_hoverIndex=i-1;
                break;
            }
        }
    }
    render_cake_diagram(portfolio);
}