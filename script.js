
const line = document.querySelector("#btn1")
const rectangle = document.querySelector("#btn2")
var resize = false
const canvas = document.querySelector("#canvas")
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;
const ctx = canvas.getContext("2d")
var shape = 1
let lastCreatedShape = undefined
const history = []
const rectArray = []
const lineArray = []
const textArray = []
const lineArrow = []
let deletedShapes = []
const selectionTool = document.querySelector(`#btn6`)
let selectedShapeForMoving = undefined
let track = true
let innerShapesSet = new Set()
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
        this.area = undefined
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



// to find the distance between two points
function distance(x1,y1,x2,y2){
    return Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2))
}
// check for line if rectangle is selected to give priority to lines
function checkForLineIfRectIsSelected(e){
    history.forEach(element => {
        let {initialX, initialY,finalX,finalY} = element
        if (element.shape == 1) {
            if (Math.abs(distance(initialX,initialY,finalX,finalY)- distance(initialX,initialY,e.x,e.y) - distance(e.x,e.y,finalX,finalY))<1 ) {
                selectedShapeForMoving =  element
            }
        }
    });
}
// to determine if the cursor is on a shape
function onShape(e) {
    
    // for(let i = 0;i<history.length;++i){
        
    //     if (history[i].shape == 1) {
    //         if (Math.abs(distance(initialX,initialY,finalX,finalY)- distance(initialX,initialY,e.x,e.y) - distance(e.x,e.y,finalX,finalY))<1 ) {
    //             selectedShapeForMoving =  history[i]
    //             break;
    //         }else{
    //             selectedShapeForMoving = undefined
    //         }
    //     }else{
    //         const minx = Math.min(initialX,finalX)
    //         const maxx = Math.max(initialX,finalX)
    //         const miny = Math.min(initialY,finalY)
    //         const maxy = Math.max(initialY,finalY)
    //         if (e.x <= maxx && e.x >= minx && e.y<=maxy && e.y>= miny) {
    //             selectedShapeForMoving = history[i]
    //             break
    //         }else{
    //             selectedShapeForMoving = undefined
    //         }
    //     }
    // }
    lineArray.forEach(element => {
        let {initialX, initialY,finalX,finalY} = element
        if (Math.abs(distance(initialX,initialY,finalX,finalY)- distance(initialX,initialY,e.x,e.y) - distance(e.x,e.y,finalX,finalY))<1 ) {
            selectedShapeForMoving = element
            return
        }else{
            selectedShapeForMoving = undefined
        }
    });
    rectArray.forEach(element => {
        let {initialX, initialY,finalX,finalY} = element
        const minx = Math.min(initialX,finalX)
        const maxx = Math.max(initialX,finalX)
        const miny = Math.min(initialY,finalY)
        const maxy = Math.max(initialY,finalY)
        if (e.x <= maxx && e.x >= minx && e.y<=maxy && e.y>= miny) {
            selectedShapeForMoving = element
            console.log(`inside foreach rect`)
            return
        }else{
            selectedShapeForMoving = undefined
        }
    });
    for(let i = 0;i<rectArray.length;++i){
        let {initialX, initialY,finalX,finalY} = rectArray[i]
        const minx = Math.min(initialX,finalX)
        const maxx = Math.max(initialX,finalX)
        const miny = Math.min(initialY,finalY)
        const maxy = Math.max(initialY,finalY)
        if (e.x <= maxx && e.x >= minx && e.y<=maxy && e.y>= miny) {
            selectedShapeForMoving = rectArray[i]
            console.log(`inside foreach rect`)
            return
        }else{
            selectedShapeForMoving = undefined
        }
    }

}
// to determine if any rectangle is inside another rectangle
function rectInsideRect(e){
    for(let i = 0; i<rectArray.length;++i){
        let {initialX, initialY,finalX,finalY} = rectArray[i]
        const minx = Math.min(initialX,finalX)
        const maxx = Math.max(initialX,finalX)
        const miny = Math.min(initialY,finalY)
        const maxy = Math.max(initialY,finalY)
        if (e.x <= maxx && e.x >= minx && e.y<=maxy && e.y>= miny && rectArray[i].area < rectArray[e.idx].area ) {
            rectArray[e.idx].inner.add(rectArray[i])

        }
    }
}
// to determine if any line is inside another rectangle
function lineInsideRect(e){
    for(let i =0;i<rectArray.length;i++){
        const {initialX,initialY,finalX,finalY} = rectArray[i]
        const minx = Math.min(initialX,finalX)
        const maxx = Math.max(initialX,finalX)
        const miny = Math.min(initialY,finalY)
        const maxy = Math.max(initialY,finalY)
        if ((e.initialX>=minx && e.initialX<=maxx) && (e.initialY>=miny && e.initialY<=maxy) && (e.finalX>=minx && e.finalX<=maxx) && (e.finalY>=miny && e.finalY<=maxy)) {
            rectArray[i].inner.add(e)
        }
    }
}
// update final cordinates and size while giving shape to particle
function giveShape(currentShape,e){
    const {initialX,initialY} = currentShape
    currentShape.finalX = e.x;
    currentShape.finalY = e.y;
    currentShape.lengthX = e.x - initialX;
    currentShape.lengthY = e.y - initialY;
    currentShape.area = currentShape.lengthX * currentShape.lengthY
}
// sort the rectArray
function sortRectArr(){
    rectArray.sort((a,b) => a.area - b.area)
}




// create update and stop tracking element
canvas.addEventListener("mousedown",(e)=>{
    if (e.button==0) {
        resize = true

        // stop tracking other elements by turning of tracking 
        if (shape == undefined) {
            track = false
        }
        // delete the redo array
        if (deletedShapes.length>0) {
            deletedShapes.splice(0,deletedShapes.length)
        }
        // to create a particle
        if (shape != undefined) {
            switch (shape) {
                case 1:
                    lineArray.push(new Particle(1,e))
                    lastCreatedShape = lineArray[lineArray.length -1]
                    history.push(lastCreatedShape)
                    break;
                case 2:
                    rectArray.push(new Particle(2,e))
                    lastCreatedShape = rectArray[rectArray.length - 1]
                    history.push(lastCreatedShape)
                    break;
            }

            
        }
        
    }
 
})
canvas.addEventListener("mousemove",(e)=>{

    // made to check if the current coordiante has any particle // check this later
    if (shape == undefined && track == true) {
        onShape(e)
        if(selectedShapeForMoving){
            document.body.style.cursor = "grab"
            if (selectedShapeForMoving.shape == 2) {
                checkForLineIfRectIsSelected(e)
            } 
        }else{
            
            document.body.style.cursor = "default"
        }
        console.log(selectedShapeForMoving)
    }

    // move elements with all other elements that are inside that elelment
    if (shape == undefined && track == false) {
        if (selectedShapeForMoving) {
            selectedShapeForMoving.initialX +=e.movementX
            selectedShapeForMoving.initialY += e.movementY
            selectedShapeForMoving.finalX += e.movementX
            selectedShapeForMoving.finalY += e.movementY
            for(const innerShape of selectedShapeForMoving.inner ){
                innerShape.initialX +=e.movementX
                innerShape.initialY += e.movementY
                innerShape.finalX += e.movementX
                innerShape.finalY += e.movementY
            }
            
        }
    }

    // give initial shape to particle
    if (resize == true && shape != undefined) {
        giveShape(history[history.length-1],e)
    }

    
    drawShapes()
})
canvas.addEventListener("mouseup",(e)=>{
    resize = false
    // to avoid single points 
    function toAvoidSinglePoint(){
        if (history[history.length-1].lengthX == 0 && history[history.length-1].lengthY == 0) {
            const {shape} = history[history.length-1]
            switch (shape){
                case 1:
                    lineArray.pop()
                    break;
                case 2:
                    rectArray.pop()
                    break;
            }
            history.pop()
            
        }
    }
    // to stop tracking element 
    function todisableTracking(){
        selectedShapeForMoving = undefined
        track = true
        document.body.style.cursor = "default"
    }

    toAvoidSinglePoint()
    todisableTracking()
    sortRectArr()
    addToInner()
    drawShapes()
})
// comeback to this later
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
    
    if (history.length > 0) {
        const temp = history.pop();
        deletedShapes.push(temp);
        drawShapes();
    }
    drawShapes()
})
const redo = document.querySelector("#btn4")
redo.addEventListener("click",()=>{
    
    if (deletedShapes.length > 0) {
        const temp = deletedShapes.pop();
        history.push(temp);
    }
    drawShapes()
})

// to clear the whole slate
const clearSlate = document.querySelector("#btn5")
clearSlate.addEventListener("click",()=>{
    lineArray.splice(0,lineArray.length)
    rectArray.splice(0,rectArray.length)
    textArray.splice(0,textArray.length)
    history.splice(0,history.length)
    drawShapes()
})

// add children shapes to inner property
function addToInner(){
    lineArray.forEach(element => {
        lineInsideRect(element)
    });
    for(let i = 0;i<rectArray.length;i++){
        const {initialX,initialY,lengthX,lengthY} = rectArray[i]
        const centre = {
            x:initialX + (lengthX/2),
            y:initialY + (lengthY/2),
            idx:i
        }
        rectInsideRect(centre)
    }
}
// paint the canvas
function drawShapes(){
    ctx.clearRect(0,0,canvas.width,canvas.height)
    history.forEach(element => {
        const {shape} = element
        switch(shape){
            case 1:
                element.drawLine()
                break;
            case 2:
                element.drawRectangle()
                break;
            case 3:
                element.drawText()
                break
        }
    });
    console.log(rectArray)
    
}
drawShapes();