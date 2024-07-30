var action = "drawLine"
const canvas = document.querySelector("#canvas")
const ctx = canvas.getContext("2d")
const line = document.querySelector("#btn1")
const rectangle = document.querySelector("#btn2")
const undo = document.querySelector("#btn3")
const redo = document.querySelector("#btn4")
const clearSlate = document.querySelector("#btn5")
const selectionTool = document.querySelector(`#btn6`)
const tools = [{
    btn:line,
    action:"drawLine"
},{
    btn:rectangle,
    action:"drawRect"
},{
    btn:selectionTool,
    action:"grab"
}]
const buffer = 45
var resize = false
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;
let lastCreatedShape = undefined
const history = []
const rectArray = []
const lineArray = []
let deletedShapes = []
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
        this.connectedLines = new Set()
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
    
}
// *****************************************************************************************************************
// handle resize
window.addEventListener("resize",()=>{
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    drawShapes();
})
// function to remove btn color 
function removeBtnColor(){
    const length = tools.length
    for(let i = 0;i<length;++i){
        if (tools[i].action != action) {
            tools[i].btn.style.backgroundColor = "#111011"
        }
    }
}
// function to color btn 
function changeBtnColor(){
    switch (action) {
        case "drawLine":
            line.style.backgroundColor = "rgba(158, 167, 177, 0.404)"
            removeBtnColor()
            break;
        case "drawRect":
            rectangle.style.backgroundColor = "rgba(158, 167, 177, 0.404)"
            removeBtnColor()
            break;
        case "grab":
            selectionTool.style.backgroundColor = "rgba(158, 167, 177, 0.404)"
            removeBtnColor()
            break;
    }
}
// shape selection function and grab shape function
line.addEventListener("click",()=>{
    shape = 1
    action = "drawLine"
    changeBtnColor()
})
rectangle.addEventListener("click",()=>{
    shape = 2
    action = "drawRect"
    changeBtnColor() 
})
selectionTool.addEventListener("click",()=>{
    shape = undefined
    action = "grab"
    changeBtnColor()
})
// ******************************************************************************************************************
// to find the distance between two points
function distance(x1,y1,x2,y2){
    return Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2))
}
// check for line if rectangle is selected to give priority to lines
function checkForLineIfRectIsSelected(e){
    lineArray.forEach(element => {
        let {initialX, initialY,finalX,finalY} = element
        if (Math.abs(distance(initialX,initialY,finalX,finalY)- distance(initialX,initialY,e.x,e.y) - distance(e.x,e.y,finalX,finalY))<1 ) {
            selectedShapeForMoving =  element
        }
    });
}
// to determine if the cursor is on a rectangle
function onRectangle(e){
    for(let i = 0;i<rectArray.length;++i){
        let {initialX, initialY,finalX,finalY} = rectArray[i]
        const minx = Math.min(initialX,finalX)
        const maxx = Math.max(initialX,finalX)
        const miny = Math.min(initialY,finalY)
        const maxy = Math.max(initialY,finalY)
        if (e.x <= maxx && e.x >= minx && e.y<=maxy && e.y>= miny) {
            selectedShapeForMoving = rectArray[i]
            return
        }else{
            selectedShapeForMoving = undefined
        }
    }
}
// to determine if cursor is on a line
function onLine(e){
    
    for(let i = 0;i<lineArray.length;++i){
        let {initialX, initialY,finalX,finalY} = lineArray[i]
        if (Math.abs(distance(initialX,initialY,finalX,finalY)- distance(initialX,initialY,e.x,e.y) - distance(e.x,e.y,finalX,finalY))<1 ) {
            selectedShapeForMoving = lineArray[i]
            break
        }
    }
}
// to determine if any rectangle is inside another rectangle
function rectInsideRect(e){
    for(let i = 0; i<rectArray.length;++i){
        if (e.area == rectArray[i].area) {
            continue
        }
        let {initialX, initialY,finalX,finalY} = rectArray[i]
        const minx = Math.min(initialX,finalX)
        const maxx = Math.max(initialX,finalX)
        const miny = Math.min(initialY,finalY)
        const maxy = Math.max(initialY,finalY)
        if (e.initialX <= maxx && e.initialX >=minx && e.initialY <= maxy && e.initialY >= miny && e.finalX <= maxx && e.finalX >=minx && e.finalY <= maxy && e.finalY >= miny) {
            rectArray[i].inner.add(e)

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
// sort the rectArray base on area
function sortRectArr(){
    rectArray.sort((a,b) => a.area - b.area)
}
// to avoid single points 
function toAvoidSinglePoint(){
    if (history.length>0) {
        if (history[history.length-1].lengthX == undefined && history[history.length-1].lengthY == undefined) {
            const {shape} = history[history.length-1]
            switch (shape){
                case "drawLine":
                    lineArray.pop()
                    history.pop() 
                    break;
                case "drawRect":
                    rectArray.pop()
                    history.pop() 
                    break;
            }
            
        }
    }
    console.log(history)
    
}
// to stop tracking element 
function todisableTracking(){
    selectedShapeForMoving = undefined
    track = true
    document.body.style.cursor = "default"
}
// undo and redo functionality
undo.addEventListener("click",()=>{
    
    if (history.length > 0) {
        const temp = history.pop();
        deletedShapes.push(temp);
        drawShapes();
    }
    drawShapes()
})
redo.addEventListener("click",()=>{
    
    if (deletedShapes.length > 0) {
        const temp = deletedShapes.pop();
        history.push(temp);
    }
    drawShapes()
})
// to clear the whole slate
clearSlate.addEventListener("click",()=>{
    lineArray.splice(0,lineArray.length)
    rectArray.splice(0,rectArray.length)
    history.splice(0,history.length)
    drawShapes()
})
// add children shapes to inner property
function addToInner(){
    lineArray.forEach(element => {
        lineInsideRect(element)
    });
    rectArray.forEach(element => {
        rectInsideRect(element)
    });
}
// made to check if the current coordiante has any particle 
function onShape(e){
    onRectangle(e)
    onLine(e)
    if (selectedShapeForMoving) {
        document.body.style.cursor = "grab"
    }else{
        document.body.style.cursor = "default"
    }
}
// same as on rectangle funciton but also checks if point is near or inside a rectangle
function lineNearRectangle(e){
    for(let i = 0;i<rectArray.length;++i){
        let {initialX, initialY,finalX,finalY} = rectArray[i]
        const minx = Math.min(initialX,finalX)
        const maxx = Math.max(initialX,finalX)
        const miny = Math.min(initialY,finalY)
        const maxy = Math.max(initialY,finalY)
        if (e.initialX <= maxx+buffer && e.initialX >= minx - buffer && e.initialY<=maxy +buffer && e.initialY >= miny-buffer){
            rectArray[i].connectedLines.add({
                connectedLine:e,
                point:"initial"
            })
        }else if(e.finalX <= maxx+buffer && e.finalX >= minx - buffer && e.finalY<=maxy +buffer && e.finalY >= miny-buffer){
            rectArray[i].connectedLines.add({
                connectedLine:e,
                point:"final"
                
            })
        }
    }
}
// check for any line near a created rectangle
function rectNearLine(e){
    for(let i = 0;i<lineArray.length;++i){
        
        const {initialX,initialY,finalX,finalY} = e
        const minx = Math.min(initialX,finalX)
        const maxx = Math.max(initialX,finalX)
        const miny = Math.min(initialY,finalY)
        const maxy = Math.max(initialY,finalY)
        console.log(e)
        if (lineArray[i].initialY >= miny - buffer && lineArray[i].initialY <= maxy + buffer &&
            lineArray[i].initialX >= minx - buffer && lineArray[i].initialX <= maxx + buffer){
            e.connectedLines.add({
                connectedLine:lineArray[i],
                point:"initial"
            })
        }else if(lineArray[i].finalY >= miny - buffer && lineArray[i].finalY <= maxy + buffer &&
            lineArray[i].finalX >= minx - buffer && lineArray[i].finalX <= maxx + buffer){
            e.connectedLines.add({
                connectedLine:lineArray[i],
                point:"final"
            })
            console.log(`inside`)
        }
    }
}
// move selected element
function moveSelectedElement(e){
    selectedShapeForMoving.initialX +=e.movementX
    selectedShapeForMoving.initialY += e.movementY
    selectedShapeForMoving.finalX += e.movementX
    selectedShapeForMoving.finalY += e.movementY
}
// move elements with all other elements that are inside that element
function moveInnnerElements(e){
    for(const innerShape of selectedShapeForMoving.inner ){
        innerShape.initialX +=e.movementX
        innerShape.initialY += e.movementY
        innerShape.finalX += e.movementX
        innerShape.finalY += e.movementY
    }
}
// move lines connected to the rectangle
function moveConnectedLines(e){
        for(const singleConnectedLine of selectedShapeForMoving.connectedLines ){
            console.log(selectedShapeForMoving)
            console.log(singleConnectedLine)
            if (singleConnectedLine.point == "initial") {
                singleConnectedLine.connectedLine.initialX += e.movementX
                singleConnectedLine.connectedLine.initialY += e.movementY
                
            }else if(singleConnectedLine.point == "final"){
                
                singleConnectedLine.connectedLine.finalX += e.movementX
                singleConnectedLine.connectedLine.finalY += e.movementY
            }
        }
}
// *******************************************************************************************************************
// create update and stop tracking element
canvas.addEventListener("mousedown",(e)=>{
    if (e.button==0) {
        resize = true
        // stop tracking other elements by turning of tracking 
        if (action == "grab") {
            track = false
        }
        // delete the redo array
        if (deletedShapes.length>0) {
            deletedShapes.splice(0,deletedShapes.length)
        }
        // to create a particle
        if (action != "grab") {
            switch (action) {
                case "drawLine":
                    lineArray.push(new Particle(action,e))
                    lastCreatedShape = lineArray[lineArray.length -1]
                    history.push(lastCreatedShape)
                    break;
                case "drawRect":
                    rectArray.push(new Particle(action,e))
                    lastCreatedShape = rectArray[rectArray.length - 1]
                    history.push(lastCreatedShape)
                    break;
            }   
        }
    }
})
canvas.addEventListener("mousemove",(e)=>{
    // check if cursor is on a shape
    if (track== true && action=="grab") {
        onShape(e)
    }
    // move elements with all other elements that are inside that elelment and connected lines too
    if (action == "grab" && track == false) {

        if (selectedShapeForMoving) {
            moveSelectedElement(e)
            moveInnnerElements(e)
            if (selectedShapeForMoving.shape == "drawRect" && lineArray.length>0) {
                moveConnectedLines(e)
            }
        }
    }
    // give initial shape to particle
    if (resize == true && action != "grab") {
        giveShape(history[history.length-1],e)
    }
    drawShapes()
})
canvas.addEventListener("mouseup",(e)=>{
    resize = false
    toAvoidSinglePoint()
    if (action == "drawLine") {
        lineNearRectangle(history[history.length-1])
    }else if (action == "drawRect") {
        rectNearLine(history[history.length-1])
    }
    addToInner()
    todisableTracking()
    sortRectArr()
    drawShapes()
})
// ********************************************************************************************************************
// paint the canvas
function drawShapes(){
    // console.log(history)
    ctx.clearRect(0,0,canvas.width,canvas.height)
    history.forEach(element => {
        const {shape} = element
        switch(shape){
            case "drawLine":
                element.drawLine()
                break;
            case "drawRect":
                element.drawRectangle()
                break;
        }
    });
    
    
}
drawShapes()