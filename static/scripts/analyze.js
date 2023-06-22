async function analyze(){
    let riskLevel='low'; //dummy value, should be weighted average of volatility and differences in beta.
    await fetch('../api/analyze/portfolio')
    .then(response=>response.json())
    .then(data=>{
        volatility=data['volatility'];
        if(volatility>0.2)
        riskLevel="high";
        if(volatility>0.01)
        riskLevel="medium";

        document.getElementById('beta_user')
            .innerHTML=Math.round(data['beta']*100)*0.01;

        document.getElementById('diversified_user')
            .innerHTML=Math.round(data['diversified']*100)*0.01;
        
        document.getElementById('rsi_user')
            .innerHTML=Math.round(data['rsi']*100)*0.01;
        sectors=data['sectors'];
    });
    let risklevel_user=document.getElementById('risklevel_user');
    risklevel_user.classList.add(riskLevel);
    risklevel_user.innerHTML=riskLevel;
}
function get_recommended_orders(){
    fetch('/api/diff_orders',{
        method:'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({p1:portfolio,p2:portfolio1})
    })
    .then(response=>response.JSON())
    .then(data=>{
        let orders_box=document.getElementById('orders_box');
        for(let i=0; i<data.length; i++){
            let o=document.createElement('div');
            o.classList.add('ready');
            let color=data[i]['amount']>0?'red':'green';
            o.innerHTML=
                '<div class="colorbox '+color+'"></div>'+
                '<h3>'+data[i]['symbol']+'</h3>'+
                '<p>'+data[i]['amount']+'</p>'+
                '<p>'+data[i]['price']+'</p>'+
                '<p>Ready</p>';
            orders_box.appendChild(o);
        }
    });
}