async function loadPosts(tag='all'){
    documentQueryTag=tag;
    await fetch('/api/post/'+tag)
    .then(response=>response.json())
    .then(data=>makePostElements(data));
}
function makePostElements(data){
    postsContainer.innerHTML="";
    for(let i=0; i<data.length; i++){
        let post=document.createElement('section');
        post.id='post_'+data[i]['pid'];
        post.classList.add('post');
        post.innerHTML=
        "<a class='author' href="+getLang()+"/user/"+data[i]['uid']+">"+data[i]['author']+"</a>"+
        "<p>"+data[i]['body']+"</p>"+
        "<p style='text-align: right;'>"+data[i]['time']+"</p>"+
        "<p class='tags'>"+data[i]['tags']+"</p>"
        if(data[i]['uid']==session['id'])
            post.innerHTML+="<button onclick='delete_post("+data[i]['pid']+")'>Delete</button>";
        postsContainer.appendChild(post);
    }
}
let documentQueryTag='all';
async function delete_post(pid){
    document.getElementById('post_'+pid).remove(); // immediate feedback to user
    fetch("../api/post/"+documentQueryTag+"/"+pid,{
        method: 'DELETE',
        headers: {
         'Content-type': 'application/json; charset=UTF-8' // Indicates the content 
        },
    })
    .then(response=>response.json())
    .then(data=>makePostElements(data));
}


// These (and more) words are not allowed in posts. Profanity filter is put on both client and server side. You WILL be banned
// if you try to pass these filters. We do not tolerate profanity, hate-speech or otherwise derogatory content on our websites, in any form.
let post_words_blacklist=[
    "<",">","script","fuc","damn","negro","nigger","ass","sex","suck","penis","blowjob","blow job","boob","butt","whore","cum","jerk","pedo","phile","shit"
];
async function makePost(){
    

    let body=document.getElementById('post_body').value;
    let blacklisted=false;
    for(let i=0; i<post_words_blacklist.length; i++){
        if(body.toLowerCase().includes(post_words_blacklist[i])){
            blacklisted=true;
            break;
        }
    }
    if(blacklisted){
        displayErr("Illegal body in post.");
        return;
    }
    let tags=[];
    if(documentQueryTag!='all')
        tags.push(documentQueryTag);
    let words=body.split(' ');
    for(let i=0; i<words.length; i++){
        if(words[i].startsWith('#'))
            tags.push(words[i].substring(1));
    }
    
    fetch("/api/post",{
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({body:body,tags:tags,tag:documentQueryTag})
    })
    .then(response=>response.json())
    .then(data=>makePostElements(data));
}
let postsContainer=document.getElementById('posts_container');