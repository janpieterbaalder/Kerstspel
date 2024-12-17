// STATES
const STATE_START = 'start';
const STATE_PLAYING = 'playing';
const STATE_GAMEOVER = 'gameover';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = STATE_START;

// Images
const backgroundImage = new Image();
backgroundImage.src = 'assets/achtergrond.png';

const playerImage = new Image();
playerImage.src = 'assets/man.png';

const ballImage = new Image();
ballImage.src = 'assets/kerstbal.png';

const giftImage = new Image();
giftImage.src = 'assets/kerstcadeau.png';

const treeImage = new Image();
treeImage.src = 'assets/kerstboom.png';

// Speler info
let playerFacingRight = false;
const player = {
    x: 300 - 60, 
    y: 800 - 260,
    width: 120,
    height: 240,
    speed: 5,
    dx: 0
};

// Variabelen spel
let playerName = "";
let objects = [];
let objectSpeed = 4;
let score = 0;
let lastObjectType = null;
const normalSpacing = 400;
const treeSpacing = 500;

// Knop posities
const startBtn = {x:200, y:500, w:200, h:50};
const replayBtn = {x:200, y:500, w:200, h:50};

// Hover flags
let hoverStartButton = false;
let hoverReplayButton = false;

canvas.addEventListener('click', onCanvasClick);
canvas.addEventListener('keydown', onKeyDown);
canvas.addEventListener('keyup', onKeyUp);
canvas.addEventListener('mousemove', onMouseMove);

window.onload = () => {
    canvas.focus();
    gameLoop();
};

function onKeyDown(e) {
    if (gameState === STATE_START) {
        if (e.key.length === 1 && playerName.length < 10 && !e.metaKey && !e.ctrlKey && !e.altKey) {
            playerName += e.key;
        } else if (e.key === 'Backspace') {
            playerName = playerName.slice(0, -1);
        }
    }
    else if (gameState === STATE_PLAYING) {
        if (e.key === 'ArrowLeft') {
            player.dx = -player.speed;
            playerFacingRight = false;
        } else if (e.key === 'ArrowRight') {
            player.dx = player.speed;
            playerFacingRight = true;
        }
    }
}

function onKeyUp(e) {
    if (gameState === STATE_PLAYING) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            player.dx = 0;
        }
    }
}

function onCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (gameState === STATE_START) {
        if (mx > startBtn.x && mx < startBtn.x+startBtn.w && my > startBtn.y && my < startBtn.y+startBtn.h) {
            if (playerName.trim().length > 0) {
                startGame();
            }
        }
    } else if (gameState === STATE_GAMEOVER) {
        if (mx > replayBtn.x && mx < replayBtn.x+replayBtn.w && my > replayBtn.y && my < replayBtn.y+replayBtn.h) {
            gameState = STATE_START;
            playerName = "";
            objects = [];
            score = 0;
            objectSpeed = 4;
            lastObjectType = null;
        }
    }
}

function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    hoverStartButton = false;
    hoverReplayButton = false;

    if (gameState === STATE_START) {
        // Check hover start button
        if (mx > startBtn.x && mx < startBtn.x+startBtn.w && my > startBtn.y && my < startBtn.y+startBtn.h) {
            hoverStartButton = true;
        }
    } else if (gameState === STATE_GAMEOVER) {
        // Check hover replay button
        if (mx > replayBtn.x && mx < replayBtn.x+replayBtn.w && my > replayBtn.y && my < replayBtn.y+replayBtn.h) {
            hoverReplayButton = true;
        }
    }
}

function startGame() {
    gameState = STATE_PLAYING;
    objects = [];
    score = 0;
    objectSpeed = 4;
    lastObjectType = null;
    player.x = 300 - player.width/2;
    player.dx = 0;
    playerFacingRight = false;
    canvas.focus();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    if (gameState === STATE_PLAYING) {
        player.x += player.dx;
        if (player.x < 0) player.x = 0;
        if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
        updateObjects();
        checkCollisions();
    }
}

function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(backgroundImage,0,0,canvas.width,canvas.height);

    if (gameState === STATE_START) {
        drawStartScreen();
    } else if (gameState === STATE_PLAYING) {
        drawPlayer();
        objects.forEach(drawObject);
        drawScore();
    } else if (gameState === STATE_GAMEOVER) {
        drawGameOverScreen();
    }
}

function drawStartScreen() {
    // Donkerder maken
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle='white';
    ctx.font='30px Arial';
    ctx.fillText('Voer je nickname in voor de Highscore:', 50, 400);

    // "Invoerveld" achtergrond
    ctx.fillStyle='rgba(255,255,255,0.2)';
    ctx.fillRect(50,420,300,40);

    ctx.fillStyle='white';
    ctx.font='30px Arial';
    ctx.fillText(playerName+"_", 60, 450);

    // Start knop
    drawButton(startBtn.x, startBtn.y, startBtn.w, startBtn.h, 'Start', hoverStartButton);
}

function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle='white';
    ctx.font='40px Arial';
    ctx.fillText('Game Over!', 200, 300);

    const scores = getHighScores();
    ctx.font='30px Arial';
    ctx.fillText('Top 3 Highscores:', 180, 360);
    if (scores.length===0) {
        ctx.fillText('Nog geen highscores.',180,400);
    } else {
        let startY = 400;
        for (let i=0;i<scores.length && i<3;i++) {
            ctx.fillText(`${i+1}. ${scores[i].name}: ${scores[i].score}`,180,startY);
            startY+=40;
        }
    }

    // Opnieuw spelen knop
    drawButton(replayBtn.x, replayBtn.y, replayBtn.w, replayBtn.h, 'Opnieuw Spelen', hoverReplayButton);
}

function drawButton(x, y, w, h, text, hovered) {
    // Als hovered is, maak de knop iets groter
    let drawX = x;
    let drawY = y;
    let drawW = w;
    let drawH = h;
    if (hovered) {
        drawX = x - 5; 
        drawY = y - 5; 
        drawW = w + 10; 
        drawH = h + 10;
    }

    ctx.fillStyle='darkgreen';
    ctx.fillRect(drawX, drawY, drawW, drawH);
    ctx.fillStyle='white';
    ctx.font='25px Arial';
    const textWidth = ctx.measureText(text).width;
    ctx.fillText(text, drawX+(drawW/2 - textWidth/2), drawY+(drawH/2+8));
}

function drawPlayer() {
    ctx.save();
    if (playerFacingRight) {
        ctx.translate(player.x+player.width, player.y);
        ctx.scale(-1,1);
        ctx.drawImage(playerImage,0,0,player.width,player.height);
    } else {
        ctx.drawImage(playerImage,player.x,player.y,player.width,player.height);
    }
    ctx.restore();
}

function drawObject(obj) {
    let image;
    if (obj.type==='ball') image=ballImage;
    else if (obj.type==='gift') image=giftImage;
    else image=treeImage;
    ctx.drawImage(image,obj.x,obj.y,obj.width,obj.height);
}

function drawScore() {
    ctx.font='40px Arial';
    ctx.fillStyle='darkgreen';
    ctx.fillText(`Score: ${score}`,10,canvas.height-30);
}

function newObject() {
    let type;
    const rand = Math.floor(Math.random()*10);
    if (rand<1) type='tree';
    else if (rand<4) type='gift';
    else type='ball';

    let width=(type==='ball')?50:(type==='gift')?80:250;
    let height=width;

    let spawnY;
    if (objects.length===0) {
        spawnY=-normalSpacing;
    } else {
        const lastObj=objects[objects.length-1];
        const prevType=lastObj.type;
        const transitionToTree=(prevType!=='tree'&&type==='tree');
        const transitionFromTree=(prevType==='tree'&&type!=='tree');
        let spacing=normalSpacing;
        if (transitionToTree||transitionFromTree) spacing=treeSpacing;
        spawnY=lastObj.y - spacing;
    }

    objects.push({x: Math.random()*(canvas.width-250),y:spawnY,width,height,type});
    lastObjectType=type;
}

function updateObjects() {
    for (let i=objects.length-1;i>=0;i--) {
        objects[i].y+=objectSpeed;
        if (objects[i].y>canvas.height) {
            score++;
            if (score%10===0) objectSpeed++;
            objects.splice(i,1);
        }
    }

    if (objects.length===0) {
        newObject();
    } else {
        const topMostObj=objects.reduce((t,o)=>(o.y<t.y?o:t),objects[0]);
        if (topMostObj.y>-1000 && objects.length<3) {
            newObject();
        }
    }
}

function getGiftHitbox(gift) {
    return [
        { x: gift.x + 10, y: gift.y + 38 },
        { x: gift.x + 24, y: gift.y + 64 },
        { x: gift.x + 51, y: gift.y + 68 },
        { x: gift.x + 68, y: gift.y + 48 }
    ];
}

function getTreeHitbox(tree) {
    const basePoints = [
        { x: 3,   y: 210 },
        { x: 43,  y: 242 },
        { x: 77,  y: 221 },
        { x: 110, y: 234 },
        { x: 128, y: 227 },
        { x: 143, y: 175 },
        { x: 167, y: 172 },
        { x: 182, y: 125 },
        { x: 197, y: 118 },
        { x: 211, y: 57 },
        { x: 250, y: 1 },
        { x: 15,  y: 125 },
        { x: 16,  y: 169 }
    ];
    return basePoints.map(p => ({ x: p.x + tree.x, y: p.y + tree.y }));
}

function getPlayerHitboxes() {
    const hitboxes = [
        { type: 'circle', x: player.x+64, y: player.y+19, radius:18 },
        { type: 'circle', x: player.x+66, y: player.y+74, radius:32 },
        { type: 'rect', x:player.x+2,y:player.y+88,width:20,height:20 },
        { type: 'rect',x:player.x+102,y:player.y+86,width:18,height:18 }
    ];
    if (playerFacingRight) {
        hitboxes[0].x-=10;
        hitboxes[1].x-=10;
    }
    return hitboxes;
}

function isCollision(obj,playerHitboxes) {
    if (obj.type==='ball') {
        const ballHit={x:obj.x+25,y:obj.y+29,radius:17};
        for (const h of playerHitboxes) {
            if (h.type==='circle') {
                const dx=ballHit.x-h.x;const dy=ballHit.y-h.y;
                const dist=Math.sqrt(dx*dx+dy*dy);
                if (dist<ballHit.radius+h.radius) return true;
            } else {
                const closestX=Math.max(h.x,Math.min(ballHit.x,h.x+h.width));
                const closestY=Math.max(h.y,Math.min(ballHit.y,h.y+h.height));
                const dx=ballHit.x-closestX;
                const dy=ballHit.y-closestY;
                if (Math.sqrt(dx*dx+dy*dy)<ballHit.radius) return true;
            }
        }
    } else {
        const poly=(obj.type==='gift')?getGiftHitbox(obj):getTreeHitbox(obj);
        for (const h of playerHitboxes) {
            if (h.type==='circle') {
                if (circlePolygonCollision(h.x,h.y,h.radius,poly)) return true;
            } else {
                const rectPoly=[
                    {x:h.x,y:h.y},
                    {x:h.x+h.width,y:h.y},
                    {x:h.x+h.width,y:h.y+h.height},
                    {x:h.x,y:h.y+h.height}
                ];
                if (polygonsIntersect(poly,rectPoly)) return true;
            }
        }
    }
    return false;
}

function circlePolygonCollision(cx,cy,cr,poly) {
    for (let i=0;i<poly.length;i++) {
        const next=(i+1)%poly.length;
        const edgeStart=poly[i];const edgeEnd=poly[next];
        const dx=edgeEnd.x-edgeStart.x;const dy=edgeEnd.y-edgeStart.y;
        const len=Math.sqrt(dx*dx+dy*dy);
        const ux=dx/len;const uy=dy/len;
        const projLength=(cx-edgeStart.x)*ux+(cy-edgeStart.y)*uy;
        let closestX,closestY;
        if (projLength<0) {closestX=edgeStart.x;closestY=edgeStart.y;}
        else if (projLength>len){closestX=edgeEnd.x;closestY=edgeEnd.y;}
        else {
            closestX=edgeStart.x+projLength*ux;
            closestY=edgeStart.y+projLength*uy;
        }
        const distX=cx-closestX;const distY=cy-closestY;
        const dist=Math.sqrt(distX*distX+distY*distY);
        if (dist<cr)return true;
    }
    return false;
}

function checkCollisions() {
    const playerHitboxes=getPlayerHitboxes();
    for (const obj of objects) {
        if (isCollision(obj,playerHitboxes)) {
            gameOver();
            break;
        }
    }
}

function gameOver() {
    gameState=STATE_GAMEOVER;
    saveHighScore(playerName,score);
}

function getHighScores(){
    return JSON.parse(localStorage.getItem('highScores')||'[]');
}

function saveHighScore(name,scoreVal) {
    const scores=getHighScores();
    scores.push({name,score:scoreVal});
    scores.sort((a,b)=>b.score-a.score);
    while(scores.length>3)scores.pop();
    localStorage.setItem('highScores',JSON.stringify(scores));
}

function polygonsIntersect(polyA,polyB) {
    for (let i=0;i<polyA.length;i++){
        if(pointInPolygon(polyA[i],polyB))return true;
    }
    for(let i=0;i<polyB.length;i++){
        if(pointInPolygon(polyB[i],polyA))return true;
    }
    for(let i=0;i<polyA.length;i++){
        const a1=polyA[i];
        const a2=polyA[(i+1)%polyA.length];
        for(let j=0;j<polyB.length;j++){
            const b1=polyB[j];
            const b2=polyB[(j+1)%polyB.length];
            if(doLineSegmentsIntersect(a1,a2,b1,b2))return true;
        }
    }
    return false;
}

function pointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;

        const intersect = ((yi > point.y) !== (yj > point.y)) &&
            (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function doLineSegmentsIntersect(p1, p2, p3, p4) {
    function orientation(a, b, c) {
        const val = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
        if (val === 0) return 0;  
        return (val > 0) ? 1 : 2; 
    }

    function onSegment(a, b, c) {
        return (Math.min(a.x, c.x) <= b.x && b.x <= Math.max(a.x, c.x) &&
                Math.min(a.y, c.y) <= b.y && b.y <= Math.max(a.y, c.y));
    }

    const o1 = orientation(p1, p2, p3);
    const o2 = orientation(p1, p2, p4);
    const o3 = orientation(p3, p4, p1);
    const o4 = orientation(p3, p4, p2);

    if (o1 !== o2 && o3 !== o4) return true;
    if (o1 === 0 && onSegment(p1, p3, p2)) return true;
    if (o2 === 0 && onSegment(p1, p4, p2)) return true;
    if (o3 === 0 && onSegment(p3, p1, p4)) return true;
    if (o4 === 0 && onSegment(p3, p2, p4)) return true;

    return false;
}
