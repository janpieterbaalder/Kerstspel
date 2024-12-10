const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Afbeeldingen
const backgroundImage = new Image();
backgroundImage.src = 'assets/achtergrond.png';

const playerImage = new Image();
playerImage.src = 'assets/man.png';

const ballImage = new Image();
ballImage.src = 'assets/kerstbal.png';

const player = {
    x: canvas.width / 2 - 60,
    y: canvas.height - 260,
    width: 120,
    height: 240,
    speed: 5,
    dx: 0
};

const balls = [];
const ballSpeed = 4;
const ballInterval = 2000;
let lastBallTime = Date.now();

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
        // Hoofd
        { type: 'circle', x: player.x + 60, y: player.y + 40, radius: 40 },
        // Torso
        { type: 'circle', x: player.x + 60, y: player.y + 150, radius: 50 },
        // Linkerhand
        { type: 'rect', x: player.x + 10, y: player.y + 100, width: 20, height: 20 },
        // Rechterhand
        { type: 'rect', x: player.x + 90, y: player.y + 100, width: 20, height: 20 }
    ];
}

// Functie om een cirkelvormige hitbox voor de kerstbal te definiëren
function getBallHitbox(ball) {
    return {
        x: ball.x + ball.width / 2,
        y: ball.y + ball.height / 2,
        radius: 20
    };
}

// Maak een nieuwe kerstbal
function newBall() {
    const x = Math.random() * (canvas.width - 50);
    balls.push({ x, y: -50, width: 50, height: 50 });
}

// Update positie van de kerstballen
function updateBalls() {
    const now = Date.now();
    if (now - lastBallTime > ballInterval) {
        newBall();
        lastBallTime = now;
    }

    balls.forEach((ball, index) => {
        ball.y += ballSpeed;
        if (ball.y > canvas.height) balls.splice(index, 1);
    });
}

// Botsingsdetectie
function isCollision(ball, playerHitboxes) {
    const ballHitbox = getBallHitbox(ball);

    for (const hitbox of playerHitboxes) {
        if (hitbox.type === 'circle') {
            // Controleer cirkel-cirkel botsing
            const distX = ballHitbox.x - hitbox.x;
            const distY = ballHitbox.y - hitbox.y;
            const distance = Math.sqrt(distX ** 2 + distY ** 2);
            if (distance < ballHitbox.radius + hitbox.radius) {
                return true;
            }
        } else if (hitbox.type === 'rect') {
            // Controleer cirkel-rechthoek botsing
            const closestX = Math.max(hitbox.x, Math.min(ballHitbox.x, hitbox.x + hitbox.width));
            const closestY = Math.max(hitbox.y, Math.min(ballHitbox.y, hitbox.y + hitbox.height));
            const distanceX = ballHitbox.x - closestX;
            const distanceY = ballHitbox.y - closestY;
            if (Math.sqrt(distanceX ** 2 + distanceY ** 2) < ballHitbox.radius) {
                return true;
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

    // Teken hitboxen van de speler
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

function drawBall(ball) {
    ctx.drawImage(ballImage, ball.x, ball.y, ball.width, ball.height);

    // Teken hitbox van de bal
    const ballHitbox = getBallHitbox(ball);
    ctx.beginPath();
    ctx.arc(ballHitbox.x, ballHitbox.y, ballHitbox.radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'blue';
    ctx.stroke();
    ctx.closePath();
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

    // Update en teken kerstballen
    updateBalls();
    balls.forEach(drawBall);

    // Controleer botsingen
    const playerHitboxes = getPlayerHitboxes();
    balls.forEach((ball) => {
        if (isCollision(ball, playerHitboxes)) {
            alert('Game Over!');
            balls.length = 0; // Reset ballen
            player.x = canvas.width / 2 - player.width / 2; // Reset spelerpositie
        }
    });

    requestAnimationFrame(gameLoop);
}

// Start het spel zodra alle afbeeldingen zijn geladen
window.onload = () => {
    gameLoop();
};
