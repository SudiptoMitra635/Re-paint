const line = document.querySelector("#btn1")
const rectangle = document.querySelector("#btn2")
var resize = false
const canvas = document.querySelector("#canvas")
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;
const ctx = canvas.getContext("2d")
var shape = 1
const shapesArray = []
var deletedShapes = []
const selectionTool = document.querySelector(`#btn6`)
let selectedShapeForMoving = undefined
let track = true
let innerShapesSet = new Set()
// handle resize
window.addEventListener("resize",()=>{
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    drawShapes();
})

// shape selection function and grab shape function
line.addEventListener("click",()=>{
    shape = 1
    line.style.backgroundColor = "rgba(158, 167, 177, 0.404)"
    selectionTool.style.backgroundColor = "#111011"
    rectangle.style.backgroundColor = "#111011"
})
rectangle.addEventListener("click",()=>{
    shape = 2
    line.style.backgroundColor = "#111011"
    selectionTool.style.backgroundColor = "#111011"
    rectangle.style.backgroundColor = "rgba(158, 167, 177, 0.404)"
})
selectionTool.addEventListener("click",()=>{
    shape = undefined
    line.style.backgroundColor = "#111011"
    rectangle.style.backgroundColor = "#111011"
    selectionTool.style.backgroundColor = "rgba(158, 167, 177, 0.404)"
})


// skeleton of a shape
class Particle{
    constructor(shape,e){
        this.shape = shape
        this.initialX = e.x
        this.initialY = e.y
        this.finalX = undefined
        this.finalY = undefined
        this.lengthY = undefined
        this.lengthX = undefined
        this.inner = new Set()
    }
    drawLine(){
        ctx.beginPath()
        ctx.moveTo(this.initialX,this.initialY)
        ctx.lineTo(this.finalX,this.finalY)
        ctx.strokeStyle = "white"
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    drawRectangle(){
        ctx.beginPath()
        ctx.roundRect(this.initialX,this.initialY,this.lengthX,this.lengthY,[20])
        ctx.strokeStyle = "white"
        ctx.lineWidth = 2
        ctx.stroke();
    }
    drawText(){
        ctx.beginPath()
        ctx.font = "20px Edu AU VIC WA NT Hand"
        ctx.fillText("Hello World",this.initialX,this.initialY)
        ctx.fillStyle = "white"
        ctx.stroke()
    }
}

// to determine if the cursor is on a shape
function onShape(e) {
    // to find the distance between two points
    function distance(x1,y1,x2,y2){
        return Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2))
    }
    for(let i = 0;i<shapesArray.length;++i){
        let {initialX, initialY,finalX,finalY} = shapesArray[i]
        if (shapesArray[i].shape == 1) {
            if (Math.abs(distance(initialX,initialY,finalX,finalY)- distance(initialX,initialY,e.x,e.y) - distance(e.x,e.y,finalX,finalY))<1 ) {
                selectedShapeForMoving =  shapesArray[i]
                break;
            }else{
                selectedShapeForMoving = undefined
            }
        }else{
            const minx = Math.min(initialX,finalX)
            const maxx = Math.max(initialX,finalX)
            const miny = Math.min(initialY,finalY)
            const maxy = Math.max(initialY,finalY)
            if (e.x <= maxx && e.x >= minx && e.y<=maxy && e.y>= miny) {
                selectedShapeForMoving = shapesArray[i]
                break
            }else{
                selectedShapeForMoving = undefined
            }
        }
    }
}
// to determine if any rectangle is inside another rectangle
function insideRect(e){
    for(let i = 0; i<shapesArray.length;++i){
        let {initialX, initialY,finalX,finalY} = shapesArray[i]
        const minx = Math.min(initialX,finalX)
        const maxx = Math.max(initialX,finalX)
        const miny = Math.min(initialY,finalY)
        const maxy = Math.max(initialY,finalY)
        if (e.x <= maxx && e.x >= minx && e.y<=maxy && e.y>= miny) {
            // shapesArray[i].inner.push(shapesArray[e.idx])  
            shapesArray[i].inner.add(shapesArray[e.idx])
        }
    }
}
// create update and stop tracking element
canvas.addEventListener("mousedown",(e)=>{
    if (e.button==0) {
        resize = true
        if (shape == undefined) {
            track = false
        }
        if (shape != undefined) {
            shapesArray.push(new Particle(shape,e))
            if (deletedShapes.length>0) {
            deletedShapes.splice(0,deletedShapes.length)
            }
        }
        
    }
 
})
canvas.addEventListener("mousemove",(e)=>{
    if (shape == undefined && track == true) {
        onShape(e)
        if(selectedShapeForMoving){
            document.body.style.cursor = "grab"
        }else{
            document.body.style.cursor = "default"
        }
    }
    if (shape == undefined && track == false) {
        if (selectedShapeForMoving) {
            selectedShapeForMoving.initialX +=e.movementX
            selectedShapeForMoving.initialY += e.movementY
            selectedShapeForMoving.finalX += e.movementX
            selectedShapeForMoving.finalY += e.movementY
            
        }
    }
    if (resize == true && shape != undefined) {
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
    // to avoid single points 
    function toAvoidSinglePoint(){
        if (shapesArray.length>0) {
        if (shapesArray[shapesArray.length -1].lengthX == undefined && shapesArray[shapesArray.length-1].lengthY == undefined) {
            shapesArray.pop()
            }
        }
    }
    
    function todisableTracking(){
        selectedShapeForMoving = undefined
        track = true
        document.body.style.cursor = "default"
    }
    toAvoidSinglePoint()
    todisableTracking()
    drawShapes()
})
canvas.addEventListener("dblclick",(e)=>{
    if (shape != undefined) {
        const temp = document.createElement("input")
        temp.setAttribute("type","text")
        temp.style.position = "absolute"

        shapesArray.push(new Particle(3,e))
        if (deletedShapes.length>0) {
            deletedShapes.splice(0,deletedShapes.length)
        }
    }
    drawShapes()
})
// undo and redo functionality
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

// to clear the whole slate
const clearSlate = document.querySelector("#btn5")
clearSlate.addEventListener("click",()=>{
    shapesArray.splice(0,shapesArray.length)
    drawShapes()
})

// add children shapes to inner property
function addToInner(){
    for(let i = 0;i <shapesArray.length;++i){
        const centre = {
            x:shapesArray[i].initialX + (shapesArray[i].lengthX/2),
            y:shapesArray[i].initialY + (shapesArray[i].lengthY/2),
            idx:i
        }
        insideRect(centre)
    }
}
// paint the canvas
function drawShapes(){
    ctx.clearRect(0,0,canvas.width,canvas.height)
    
    for(let i = 0;i<shapesArray.length;++i){
        if (shapesArray[i].shape ==1) {
            shapesArray[i].drawLine()
        }else if(shapesArray[i].shape == 2){
            
            shapesArray[i].drawRectangle()
        }else{
            shapesArray[i].drawText();
        }
    }
    addToInner()
    console.log(shapesArray)
    
}
drawShapes();