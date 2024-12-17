const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Afbeeldingen
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

// Speler
const player = {
    x: canvas.width / 2 - 60,
    y: canvas.height - 260,
    width: 120,
    height: 240,
    speed: 5,
    dx: 0
};

const objects = [];
let objectSpeed = 4;       
let score = 0;             
let playerFacingRight = false;
let lastObjectType = null; // Om te bepalen of er boom-overgangen zijn

// Verhouding boom:cadeau:bal = 1:3:6
// Afstanden
const normalSpacing = 400;
const treeSpacing = 500;

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        player.dx = -player.speed;
        playerFacingRight = false;
    } else if (e.key === 'ArrowRight') {
        player.dx = player.speed;
        playerFacingRight = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        player.dx = 0;
    }
});

function getPlayerHitboxes() {
    const hitboxes = [
        { type: 'circle', x: player.x + 64, y: player.y + 19, radius: 18 },
        { type: 'circle', x: player.x + 66, y: player.y + 74, radius: 32 },
        { type: 'rect',   x: player.x + 2,  y: player.y + 88, width: 20, height: 20 },
        { type: 'rect',   x: player.x + 102, y: player.y + 86, width: 18, height: 18 }
    ];

    if (playerFacingRight) {
        hitboxes[0].x -= 10;
        hitboxes[1].x -= 10;
    }

    return hitboxes;
}

function getBallHitbox(ball) {
    return {
        type: 'circle',
        x: ball.x + 25,
        y: ball.y + 29,
        radius: 17
    };
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

function newObject() {
    let type;
    const rand = Math.floor(Math.random() * 10);
    if (rand < 1) {
        type = 'tree';
    } else if (rand < 4) {
        type = 'gift';
    } else {
        type = 'ball';
    }

    let width, height;
    if (type === 'ball') {
        width = 50; height = 50;
    } else if (type === 'gift') {
        width = 80; height = 80;
    } else { // tree
        width = 250; height = 250;
    }

    // Bepaal spawnpositie
    let spawnY;
    if (objects.length === 0) {
        // Eerste object
        spawnY = -normalSpacing;
    } else {
        // Bepaal afstand op basis van vorige en huidige type
        const lastObj = objects[objects.length - 1];
        const prevType = lastObj.type;

        const transitionToTree = (prevType !== 'tree' && type === 'tree');
        const transitionFromTree = (prevType === 'tree' && type !== 'tree');

        let spacing = normalSpacing;
        if (transitionToTree || transitionFromTree) {
            spacing = treeSpacing;
        }

        // Nieuwe object komt spacing boven het vorige object
        spawnY = lastObj.y - spacing;
    }

    objects.push({ x: Math.random() * (canvas.width - 250), y: spawnY, width, height, type });
    lastObjectType = type;
}

function updateObjects() {
    for (let i = objects.length - 1; i >= 0; i--) {
        objects[i].y += objectSpeed;
        if (objects[i].y > canvas.height) {
            score++;
            if (score % 10 === 0) {
                objectSpeed++;
            }
            objects.splice(i, 1);
        }
    }

    // Als er geen objecten zijn, spawn nieuw
    if (objects.length === 0) {
        newObject();
    } else {
        // Check of we een nieuw object moeten spawnen
        // We spawnen continu objecten boven de laatst geplaatste
        // omdat newObject() bij aanroep de positie op basis van het laatste object bepaalt.
        // Dus roep gewoon altijd newObject() aan als we weinig objecten hebben in beeld.
        // Maar om overbevolking te voorkomen, kijken we of het laatste object al in beeld is.
        
        // Als het laatste object (bovenaan) al onder -500 is, kan er nog wel een nieuw object boven komen.
        const topMostObj = objects.reduce((topObj, obj) => (obj.y < topObj.y ? obj : topObj), objects[0]);
        
        // Komt het topObj dichter bij het canvas? Zo ja, dan nieuw object spawnen
        if (topMostObj.y > -1000) {
            // Zorg dat er altijd minimaal een paar objecten bovenaan gestapeld zijn
            // zodat er geen gaten ontstaan.
            if (objects.length < 3) {
                newObject();
            }
        }
    }
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

function polygonsIntersect(polyA, polyB) {
    for (let i = 0; i < polyA.length; i++) {
        if (pointInPolygon(polyA[i], polyB)) return true;
    }

    for (let i = 0; i < polyB.length; i++) {
        if (pointInPolygon(polyB[i], polyA)) return true;
    }

    for (let i = 0; i < polyA.length; i++) {
        const a1 = polyA[i];
        const a2 = polyA[(i + 1) % polyA.length];
        for (let j = 0; j < polyB.length; j++) {
            const b1 = polyB[j];
            const b2 = polyB[(j + 1) % polyB.length];
            if (doLineSegmentsIntersect(a1, a2, b1, b2)) {
                return true;
            }
        }
    }

    return false;
}

function isCollision(obj, playerHitboxes) {
    if (obj.type === 'ball') {
        const ballHit = getBallHitbox(obj);
        for (const hitbox of playerHitboxes) {
            if (hitbox.type === 'circle') {
                const distX = ballHit.x - hitbox.x;
                const distY = ballHit.y - hitbox.y;
                const distance = Math.sqrt(distX ** 2 + distY ** 2);
                if (distance < ballHit.radius + hitbox.radius) {
                    return true;
                }
            } else if (hitbox.type === 'rect') {
                const closestX = Math.max(hitbox.x, Math.min(ballHit.x, hitbox.x + hitbox.width));
                const closestY = Math.max(hitbox.y, Math.min(ballHit.y, hitbox.y + hitbox.height));
                const distanceX = ballHit.x - closestX;
                const distanceY = ballHit.y - closestY;
                if (Math.sqrt(distanceX ** 2 + distanceY ** 2) < ballHit.radius) {
                    return true;
                }
            }
        }
    } else {
        const poly = (obj.type === 'gift') ? getGiftHitbox(obj) : getTreeHitbox(obj);
        for (const hitbox of playerHitboxes) {
            if (hitbox.type === 'circle') {
                const circleX = hitbox.x;
                const circleY = hitbox.y;
                const radius = hitbox.radius;

                for (let i = 0; i < poly.length; i++) {
                    const nextIndex = (i + 1) % poly.length;
                    const edgeStart = poly[i];
                    const edgeEnd = poly[nextIndex];

                    const dx = edgeEnd.x - edgeStart.x;
                    const dy = edgeEnd.y - edgeStart.y;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const unitX = dx / len;
                    const unitY = dy / len;

                    const projLength = (circleX - edgeStart.x) * unitX + (circleY - edgeStart.y) * unitY;

                    let closestX, closestY;
                    if (projLength < 0) {
                        closestX = edgeStart.x;
                        closestY = edgeStart.y;
                    } else if (projLength > len) {
                        closestX = edgeEnd.x;
                        closestY = edgeEnd.y;
                    } else {
                        closestX = edgeStart.x + projLength * unitX;
                        closestY = edgeStart.y + projLength * unitY;
                    }

                    const distX = circleX - closestX;
                    const distY = circleY - closestY;
                    const distanceToSegment = Math.sqrt(distX ** 2 + distY ** 2);

                    if (distanceToSegment < radius) {
                        return true;
                    }
                }
            } else if (hitbox.type === 'rect') {
                const rectPoly = [
                    { x: hitbox.x, y: hitbox.y },
                    { x: hitbox.x + hitbox.width, y: hitbox.y },
                    { x: hitbox.x + hitbox.width, y: hitbox.y + hitbox.height },
                    { x: hitbox.x, y: hitbox.y + hitbox.height }
                ];

                if (polygonsIntersect(poly, rectPoly)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function drawBackground() {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
    ctx.save();
    if (playerFacingRight) {
        ctx.translate(player.x + player.width, player.y);
        ctx.scale(-1, 1);
        ctx.drawImage(playerImage, 0, 0, player.width, player.height);
    } else {
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    }
    ctx.restore();
}

function drawObject(obj) {
    let image;
    if (obj.type === 'ball') image = ballImage;
    else if (obj.type === 'gift') image = giftImage;
    else image = treeImage;

    ctx.drawImage(image, obj.x, obj.y, obj.width, obj.height);
}

function drawScore() {
    ctx.font = '40px Arial';
    ctx.fillStyle = 'darkgreen'; // Donkergroene score
    ctx.fillText(`Score: ${score}`, 10, canvas.height - 30);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();

    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    drawPlayer();

    updateObjects();
    objects.forEach(drawObject);

    drawScore();

    const playerHitboxes = getPlayerHitboxes();
    for (const obj of objects) {
        if (isCollision(obj, playerHitboxes)) {
            alert('Game Over!');
            objects.length = 0; 
            player.x = canvas.width / 2 - player.width / 2;
            objectSpeed = 4;
            score = 0;
            lastObjectType = null;
            playerFacingRight = false;
            break;
        }
    }

    requestAnimationFrame(gameLoop);
}

window.onload = () => {
    gameLoop();
};
