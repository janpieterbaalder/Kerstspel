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
let ballSpeed = 4;
let score = 0;
const ballDistance = 300;
let lastBallY = -ballDistance;

// Voeg knoppen toe voor mobiel gebruik
document.body.insertAdjacentHTML('beforeend', `
    <div id="controls">
        <button id="leftButton">⬅️</button>
        <button id="rightButton">➡️</button>
    </div>
`);

// Styling voor de knoppen
const controlsStyle = document.createElement('style');
controlsStyle.textContent = `
    #controls {
        position: absolute;
        bottom: 50px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 15px;
        z-index: 10;
        pointer-events: auto;
    }
    #controls button {
        padding: 15px 30px;
        font-size: 24px;
        border: none;
        border-radius: 10px;
        background-color: rgba(85, 85, 85, 0.8);
        color: white;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    }
    #controls button:active {
        background-color: rgba(119, 119, 119, 0.8);
    }
`;
document.head.appendChild(controlsStyle);

// Event listeners voor knoppen
const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');

leftButton.addEventListener('pointerdown', () => {
    player.dx = -player.speed;
    console.log("Moving left");
});
rightButton.addEventListener('pointerdown', () => {
    player.dx = player.speed;
    console.log("Moving right");
});

leftButton.addEventListener('pointerup', () => {
    player.dx = 0;
    console.log("Stopped moving left");
});
rightButton.addEventListener('pointerup', () => {
    player.dx = 0;
    console.log("Stopped moving right");
});

// Event listeners voor toetsenbord
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
        y: ball.y + 25,
        radius: 25
    };
}

// Maak een nieuwe kerstbal
function newBall() {
    const x = Math.random() * (canvas.width - 50);
    balls.push({ x, y: -50, width: 50, height: 50 });
}

// Update positie van de kerstballen
function updateBalls() {
    if (balls.length === 0 || balls[balls.length - 1].y > lastBallY + ballDistance) {
        newBall();
        lastBallY = balls[balls.length - 1].y;
    }

    balls.forEach((ball, index) => {
        ball.y += ballSpeed;
        if (ball.y > canvas.height) {
            balls.splice(index, 1);
            score++;
            if (score % 10 === 0) ballSpeed += 1; // Verhoog snelheid na 10 punten
        }
    });
}

// Botsingsdetectie
function isCollision(ball, playerHitboxes) {
    const ballHitbox = getBallHitbox(ball);

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

    return false;
}

// Teken objecten
function drawBackground() {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
}

function drawBall(ball) {
    ctx.drawImage(ballImage, ball.x, ball.y, ball.width, ball.height);
}

function drawScore() {
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(`Score: ${score}`, 10, 30);
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
            score = 0; // Reset score
            ballSpeed = 4; // Reset snelheid
        }
    });

    // Teken score
    drawScore();

    requestAnimationFrame(gameLoop);
}

// Start het spel zodra alle afbeeldingen zijn geladen
window.onload = () => {
    gameLoop();
};
