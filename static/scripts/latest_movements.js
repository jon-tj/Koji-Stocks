async function make_movement_boxes(id_of_parent){
    await fetch('/api/latest/prices')
    .then(response=>response.json())
    .then(data=>{
        data.sort((a,b)=>{
            if(Math.abs(a['change'])>Math.abs(b['change']))
                return 1;
            return -1;
        });
        data.reverse();
        let parent=document.getElementById(id_of_parent);
        let stopAt=data.length;
        if(stopAt>12)stopAt=12;
        for(let i=0; i<stopAt; i++){
            let posneg='positive';
            if(data[i]['change']<0)posneg='negative';

            let d=document.createElement("div");
            d.classList.add('movement_box');
            d.classList.add(posneg);
            let prefix='+';
            if(data[i]['change']<0)prefix='';
            let ticker=data[i]['symbol'].split('-')[0];
            let market=data[i]['symbol'].split('-')[1]; //shut up
            d.innerHTML='<p>'+ticker+'</p><p class="'+posneg+'">'+prefix+data[i]['change']+'%</p><p class="time_2_float_georgie">'+data[i]['latest']+'</p>';
            d.onclick=(e)=>{window.location=getLang()+'/'+market+'/'+ticker;};
            parent.appendChild(d);
        }
    });
}