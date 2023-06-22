// Written by Kiran V. (Vaakir) 2023
// A seperate library to draw on the .html canvas that is easier 
// than writing the draw functions over many lines several times.

class draw {
    static rect(ctx,x,y,width,height,color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height)
    }
    static lineStart(ctx,color,lineWidth=1) {
        ctx.beginPath();
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
    }
    static line(ctx,x,y,endX,endY,color,lineWidth=1,dotted=false,theme="Normal") {
        if (dotted) { ctx.setLineDash([3, 5]); }
        if (theme=="Ghost") {
            ctx.shadowBlur = 3;
            ctx.shadowColor = "cyan";
        } else {
            ctx.shadowBlur = 0;
            ctx.shadowColor = "";
        }
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x,y);
        ctx.lineTo(endX,endY);         
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
    }
    static text(ctx,text,x,y,width,color) {
        ctx.fillStyle = color;
        ctx.fillText(text,x,y,width);
    }
    static triangle(ctx,x,y,size,color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x-size/2, y);
        ctx.lineTo(x, y-size);
        ctx.lineTo(x+size/2, y);
        ctx.closePath();
        ctx.fill();
    }
}


