const line = document.querySelector("#btn1")
const rectangle = document.querySelector("#btn2")

const canvas = document.querySelector("#canvas")
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;
const ctx = canvas.getContext("2d")
var shape = 1
window.addEventListener("resize",()=>{
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    drawShapes();
})
line.addEventListener("click",()=>{
    shape = 1
    line.style.backgroundColor = "rgba(158, 167, 177, 0.404)"
    rectangle.style.backgroundColor = "#111011"
})
rectangle.addEventListener("click",()=>{
    shape = 2
    line.style.backgroundColor = "#111011"
    rectangle.style.backgroundColor = "rgba(158, 167, 177, 0.404)"
})

var resize = false
const shapesArray = []

var deletedShapes = []
class Particle{
    constructor(shape,e){
        this.shape = shape
        this.initialX = e.x
        this.initialY = e.y
        this.finalX = undefined
        this.finalY = undefined
        this.lengthY = undefined
        this.lengthX = undefined
    }
    drawLine(){
        ctx.beginPath()
        ctx.moveTo(this.initialX,this.initialY)
        ctx.lineTo(this.finalX,this.finalY)
        ctx.strokeStyle = "white"
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    drawRectangle(){
        ctx.beginPath()
        ctx.roundRect(this.initialX,this.initialY,this.lengthX,this.lengthY,[20])
        ctx.strokeStyle = "white"
        ctx.lineWidth = 1
        ctx.stroke();
    }
}

canvas.addEventListener("mousedown",(e)=>{
    resize = true

    shapesArray.push(new Particle(shape,e))
    if (deletedShapes.length>0) {
        deletedShapes.splice(0,deletedShapes.length)
    }
    
})

canvas.addEventListener("mousemove",(e)=>{
    if (resize == true) {
        const temp = shapesArray[shapesArray.length - 1] 
        temp.finalX = e.x;
        temp.finalY = e.y;
        temp.lengthX = e.x - temp.initialX;
        temp.lengthY = e.y - temp.initialY;
    }
    drawShapes()
    // console.log(roughParticle)
})
canvas.addEventListener("mouseup",(e)=>{
    resize = false
    drawShapes()
})
const undo = document.querySelector("#btn3")
undo.addEventListener("click",()=>{
    
    if (shapesArray.length > 0) {
        const temp = shapesArray.pop();
        deletedShapes.push(temp);
        drawShapes();
    }
    drawShapes()
})

const redo = document.querySelector("#btn4")
redo.addEventListener("click",()=>{
    
    if (deletedShapes.length > 0) {
        const temp = deletedShapes.pop();
        shapesArray.push(temp);
        drawShapes();
    }
    drawShapes
}) 
const clearSlate = document.querySelector("#btn5")
clearSlate.addEventListener("click",()=>{
    shapesArray.splice(0,shapesArray.length)
    drawShapes()
})

canvas.addEventListener("dblclick",(e)=>{
    console.log(e)
})


function drawShapes(){
    ctx.clearRect(0,0,canvas.width,canvas.height)
   
    shapesArray.forEach(shape => {
        if (shape.shape === 1) {
            shape.drawLine();
        } else {
            shape.drawRectangle();
        }
    });
}
drawShapes();






