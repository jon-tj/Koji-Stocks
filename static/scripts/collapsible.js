function collapse(sender,appendClassBtn=true){
    let target=sender.getAttribute("target");
    target=document.getElementById(target);
    if(target.classList.contains("collapsed")){
        target.style.display="block";
        target.classList.remove("collapsed");
        if(appendClassBtn) sender.classList.remove("flipped");
    }
    else{
        target.style.display="none";
        target.classList.add("collapsed");
        if(appendClassBtn) sender.classList.add("flipped");
    }
}