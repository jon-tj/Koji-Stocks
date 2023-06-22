
async function loadUserMenu(){
    let q=getCookie('session_id');
    if(q){
        await fetch("/api/about/user/self")
        .then(response=>response.json())
        .then(r=>{
            if(r || session['access_level']==3){
                let username="Admin";
                if(r) username=r["username"];
                navbarUser.innerHTML=username+'<img src="/static/icons/burger.png" alt="User menu" class="unselectable" > ';
            }else requireLogin();
        });
    }else requireLogin();
}

function requireLogin(){
    navbarUser.innerHTML='<div onclick="window.location=getLang()+\'/login\'">'+lang['Log in']+'</div>';;
}
function toggleSettingsBox(){
    if(!langBox |! settingsBox)return;
    if(langBox.classList.contains('visible')) {
        langBox.classList.remove('visible');
    }
    if(settingsBox.classList.contains('visible')){
        settingsBox.classList.remove('visible');
        setTimeout(function() {
            settingsBox.style.display = "none";
        }, 100);
    }else{
        settingsBox.classList.add('visible');
        settingsBox.style.display = "block";
    }
}
function toggleLangBox(){
    // Since the settingsBox will be null when not logged in, so we avoid a halting in the function.
    if(settingsBox && settingsBox.classList.contains('visible'))
        settingsBox.classList.remove('visible');
        
    if(langBox.classList.contains('visible')){
        langBox.classList.remove('visible');
        setTimeout(function() {
            langBox.style.display = "none";
        }, 100);
    }else{
        langBox.classList.add('visible');
        langBox.style.display = "block";
    }
}
function changeLang(lang){
    let l=getLang();
    if(l!='/')
        window.location=window.location.href.replaceAll(l,lang);
    else{
        window.location=lang+window.location.href.substring(window.location.href.substring(10).indexOf('/')+10);
    }
}
function displayErr(errMsg){
    errBox.childNodes[1].innerHTML=errMsg;
    if(errBox.classList.contains('visible')){
        // make error box vibrate
    }else{
        errBox.classList.add('visible');
    }
}

let errBox=document.getElementById('errBox');
let profile_picture=document.getElementById('profile_picture');
let settingsBox=document.getElementById('navbar_settingsBox');
let langBox=document.getElementById('navbar_langBox');
let navbarUser=document.getElementById('btn_user_navbar');
loadUserMenu();