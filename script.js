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

const player = {
    x: canvas.width / 2 - 60,
    y: canvas.height - 260,
    width: 120,
    height: 240,
    speed: 5,
    dx: 0
};

const objects = [];
const objectSpeed = 4;
const objectInterval = 2000;
let lastObjectTime = Date.now();

// Event listeners voor speler beweging
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') player.dx = -player.speed;
    if (e.key === 'ArrowRight') player.dx = player.speed;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') player.dx = 0;
});

// Functie om hitboxen van het mannetje te definiëren
function getPlayerHitboxes() {
    return [
        { type: 'circle', x: player.x + 64, y: player.y + 19, radius: 18 },
        { type: 'circle', x: player.x + 66, y: player.y + 74, radius: 32 },
        { type: 'rect', x: player.x + 2, y: player.y + 88, width: 20, height: 20 },
        { type: 'rect', x: player.x + 102, y: player.y + 86, width: 18, height: 18 }
    ];
}

// Functie om een cirkelvormige hitbox voor de kerstbal te definiëren
function getBallHitbox(ball) {
    return {
        x: ball.x + 25,
        y: ball.y + 29,
        radius: 17
    };
}

// Functie om een polygonale hitbox voor het cadeau te definiëren
function getGiftHitbox(gift) {
    return [
        { x: gift.x + 10, y: gift.y + 38 },
        { x: gift.x + 24, y: gift.y + 64 },
        { x: gift.x + 51, y: gift.y + 68 },
        { x: gift.x + 68, y: gift.y + 48 }
    ];
}

// Maak een nieuw vallend object (kerstbal of cadeau)
function newObject() {
    const x = Math.random() * (canvas.width - 80); 
    const isBall = Math.random() < 0.5;
    objects.push({
        x,
        y: -80,
        width: isBall ? 50 : 80,
        height: isBall ? 50 : 80,
        type: isBall ? 'ball' : 'gift'
    });
}

// Update positie van de vallende objecten
function updateObjects() {
    const now = Date.now();
    if (now - lastObjectTime > objectInterval) {
        newObject();
        lastObjectTime = now;
    }

    for (let i = objects.length - 1; i >= 0; i--) {
        objects[i].y += objectSpeed;
        if (objects[i].y > canvas.height) objects.splice(i, 1);
    }
}

// Botsingsdetectie
function isCollision(obj, playerHitboxes) {
    if (obj.type === 'ball') {
        const ballHitbox = getBallHitbox(obj);
        for (const hitbox of playerHitboxes) {
            if (hitbox.type === 'circle') {
                const distX = ballHitbox.x - hitbox.x;
                const distY = ballHitbox.y - hitbox.y;
                const distance = Math.sqrt(distX ** 2 + distY ** 2);
                if (distance < ballHitbox.radius + hitbox.radius) {
                    return true;
                }
            } else if (hitbox.type === 'rect') {
                const closestX = Math.max(hitbox.x, Math.min(ballHitbox.x, hitbox.x + hitbox.width));
                const closestY = Math.max(hitbox.y, Math.min(ballHitbox.y, hitbox.y + hitbox.height));
                const distanceX = ballHitbox.x - closestX;
                const distanceY = ballHitbox.y - closestY;
                if (Math.sqrt(distanceX ** 2 + distanceY ** 2) < ballHitbox.radius) {
                    return true;
                }
            }
        }
    } else if (obj.type === 'gift') {
        const giftHitbox = getGiftHitbox(obj);

        for (const hitbox of playerHitboxes) {
            if (hitbox.type === 'circle') {
                // Controleer cirkel-polygoon botsing (cirkel vs elk lijnsegment van de polygon)
                for (let i = 0; i < giftHitbox.length; i++) {
                    const nextIndex = (i + 1) % giftHitbox.length;
                    const edgeStart = giftHitbox[i];
                    const edgeEnd = giftHitbox[nextIndex];

                    const dx = edgeEnd.x - edgeStart.x;
                    const dy = edgeEnd.y - edgeStart.y;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const unitX = dx / len;
                    const unitY = dy / len;

                    // Projecteer het middelpunt van de cirkel op de lijn
                    const projLength = (hitbox.x - edgeStart.x) * unitX + (hitbox.y - edgeStart.y) * unitY;

                    let closestX, closestY;
                    if (projLength < 0) {
                        // Het dichtstbijzijnde punt is edgeStart
                        closestX = edgeStart.x;
                        closestY = edgeStart.y;
                    } else if (projLength > len) {
                        // Het dichtstbijzijnde punt is edgeEnd
                        closestX = edgeEnd.x;
                        closestY = edgeEnd.y;
                    } else {
                        // Dichtstbijzijnde punt ligt tussen start en end
                        closestX = edgeStart.x + projLength * unitX;
                        closestY = edgeStart.y + projLength * unitY;
                    }

                    const distX = hitbox.x - closestX;
                    const distY = hitbox.y - closestY;
                    const distanceToSegment = Math.sqrt(distX ** 2 + distY ** 2);

                    if (distanceToSegment < hitbox.radius) {
                        return true;
                    }
                }
            } else if (hitbox.type === 'rect') {
                // Eventueel uitbreiding voor rect vs polygon
                // Voor nu niet geïmplementeerd, maar vergelijkbaar principe:
                // Check elk segment van de polygon tegen de rect edges / of polygon-point binnen rect.
            }
        }
    }
    return false;
}

// Teken objecten
function drawBackground() {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);

    // Debug: teken hitboxen van de speler
    const playerHitboxes = getPlayerHitboxes();
    ctx.strokeStyle = 'red';
    playerHitboxes.forEach((hitbox) => {
        if (hitbox.type === 'circle') {
            ctx.beginPath();
            ctx.arc(hitbox.x, hitbox.y, hitbox.radius, 0, Math.PI * 2);
            ctx.stroke();
        } else if (hitbox.type === 'rect') {
            ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
        }
    });
}

function drawObject(obj) {
    const image = obj.type === 'ball' ? ballImage : giftImage;
    ctx.drawImage(image, obj.x, obj.y, obj.width, obj.height);

    // Debug: teken hitboxen
    if (obj.type === 'ball') {
        const ballHitbox = getBallHitbox(obj);
        ctx.beginPath();
        ctx.arc(ballHitbox.x, ballHitbox.y, ballHitbox.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'blue';
        ctx.stroke();
        ctx.closePath();
    } else if (obj.type === 'gift') {
        const giftHitbox = getGiftHitbox(obj);
        ctx.strokeStyle = 'green';
        ctx.beginPath();
        ctx.moveTo(giftHitbox[0].x, giftHitbox[0].y);
        for (let i = 1; i < giftHitbox.length; i++) {
            ctx.lineTo(giftHitbox[i].x, giftHitbox[i].y);
        }
        ctx.closePath();
        ctx.stroke();
    }
}

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Teken achtergrond
    drawBackground();

    // Update en teken speler
    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    drawPlayer();

    // Update en teken objecten
    updateObjects();
    objects.forEach(drawObject);

    // Controleer botsingen
    const playerHitboxes = getPlayerHitboxes();
    for (const obj of objects) {
        if (isCollision(obj, playerHitboxes)) {
            alert('Game Over!');
            objects.length = 0; // Reset objecten
            player.x = canvas.width / 2 - player.width / 2; // Reset spelerpositie
            break; 
        }
    }

    requestAnimationFrame(gameLoop);
}

// Start het spel zodra alle afbeeldingen zijn geladen
window.onload = () => {
    gameLoop();
};
