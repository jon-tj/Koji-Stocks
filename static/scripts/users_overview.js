/*
    Might be a good idea to add that you can scroll down and load in more tickers,
    ie just load the next page in the query.
*/

async function queryUsers(self){
    let q=self.value.toLowerCase();
    users=[];
    for(let i=0; i<allUsers.length; i++){
        if((allUsers[i]["public_data"]["username"]+allUsers[i]["userid"]).toLowerCase().includes(q))
            users.push(allUsers[i]);
    }
    makeUsersBoxes();
}
let allUsers=[];
let users=[];
async function loadUsers(q=''){
    await fetch("/api/query?target=users&q="+q+"&limit=all")
    .then(response=>response.json())
    .then(r=>{
        allUsers=r;
        users=r;
        makeUsersBoxes();
    });
}
function makeUsersBoxes(){
    let resultsBox=document.getElementById("usersBox");
    resultsBox.innerHTML="";
    let stopAt=5;
    if(stopAt>users.length)stopAt=users.length;
    for(let i=0; i<stopAt; i++){
        let d=document.createElement("div");
        d.onclick=()=>{
            window.location=getLang()+"/user/"+users[i]["userid"];
        };
        d.classList.add('tickerBox');
        d.innerHTML= `
        <img class='market' src='/static/icons/unknown_user_day.png'> 
        <h4>${users[i]['public_data']['username']}</h4>
        <div class="tickers_wrapper">
            <p>${users[i]['userid']}</p>
        </div>`;

        resultsBox.appendChild(d);
    }
}