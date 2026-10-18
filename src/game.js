import { playFlapSound, playPointSound, playHitSound, playDieSound, playMedalSound } from './audio.js';
import { hapticFlap, hapticScore, hapticCrash } from './haptics.js';
import { ParticleSystem } from './particles.js';

export class FlappyGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Virtual game resolution
    this.VIRTUAL_WIDTH = 380;
    this.VIRTUAL_HEIGHT = 640;

    // Game constants
    this.BIRD_X = 85;
    this.BIRD_RADIUS = 13;
    this.GRAVITY = 0.26;
    this.JUMP_STRENGTH = -5.5;
    this.MAX_FALL_SPEED = 6.8;
    this.PIPE_WIDTH = 58;
    this.PIPE_GAP = 165;
    this.PIPE_SPEED = 2.0;
    this.PIPE_INTERVAL = 175;
    this.GROUND_HEIGHT = 56;

    this.particles = new ParticleSystem();

    // High score from local storage
    this.bestScore = parseInt(localStorage.getItem('flappy_best_score') || '0', 10);
    if (isNaN(this.bestScore)) this.bestScore = 0;

    // State
    this.state = 'READY'; // READY, PLAYING, PAUSED, GAMEOVER
    this.score = 0;
    this.birdY = this.VIRTUAL_HEIGHT / 2;
    this.birdVelocity = 0;
    this.pipes = [];
    this.frameCount = 0;
    this.scoreScale = 1.0;
    this.groundOffset = 0;
    this.clouds = [
      { x: 40, y: 80, scale: 1.1, speed: 0.3 },
      { x: 220, y: 130, scale: 0.85, speed: 0.2 },
      { x: 340, y: 60, scale: 0.95, speed: 0.25 }
    ];

    this.newHighScoreAlert = false;
    this.medalAwarded = null;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const container = this.canvas.parentElement;
    const availWidth = container ? container.clientWidth : window.innerWidth;
    const availHeight = container ? container.clientHeight : window.innerHeight;

    // Fit virtual aspect ratio inside available space
    const targetAspect = this.VIRTUAL_WIDTH / this.VIRTUAL_HEIGHT;
    const currentAspect = availWidth / availHeight;

    let displayWidth, displayHeight;
    if (currentAspect > targetAspect) {
      displayHeight = availHeight;
      displayWidth = availHeight * targetAspect;
    } else {
      displayWidth = availWidth;
      displayHeight = availWidth / targetAspect;
    }

    this.canvas.style.width = `${Math.floor(displayWidth)}px`;
    this.canvas.style.height = `${Math.floor(displayHeight)}px`;

    this.canvas.width = Math.floor(this.VIRTUAL_WIDTH * dpr);
    this.canvas.height = Math.floor(this.VIRTUAL_HEIGHT * dpr);

    this.scale = dpr;
    this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
  }

  reset() {
    this.state = 'READY';
    this.score = 0;
    this.birdY = this.VIRTUAL_HEIGHT / 2 - 20;
    this.birdVelocity = 0;
    this.pipes = [];
    this.frameCount = 0;
    this.scoreScale = 1.0;
    this.newHighScoreAlert = false;
    this.medalAwarded = null;
    this.particles.clear();
  }

  flap() {
    if (this.state === 'READY') {
      this.state = 'PLAYING';
      this.birdVelocity = this.JUMP_STRENGTH;
      playFlapSound();
      hapticFlap();
      this.particles.puffTrail(this.BIRD_X, this.birdY);
      return;
    }

    if (this.state === 'PLAYING') {
      this.birdVelocity = this.JUMP_STRENGTH;
      playFlapSound();
      hapticFlap();
      this.particles.puffTrail(this.BIRD_X, this.birdY);
      return;
    }

    if (this.state === 'GAMEOVER') {
      this.reset();
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
    }
  }

  createPipe() {
    const margin = 50;
    const maxGapY = (this.VIRTUAL_HEIGHT - this.GROUND_HEIGHT) - margin - this.PIPE_GAP;
    const gapY = margin + Math.random() * (maxGapY - margin);

    this.pipes.push({
      x: this.VIRTUAL_WIDTH,
      gapY: gapY,
      scored: false
    });
  }

  checkCollision() {
    // Ceiling collision (soft bounce)
    if (this.birdY - this.BIRD_RADIUS <= 0) {
      this.birdY = this.BIRD_RADIUS;
      this.birdVelocity = 0;
    }

    // Ground collision
    if (this.birdY + this.BIRD_RADIUS >= this.VIRTUAL_HEIGHT - this.GROUND_HEIGHT) {
      this.birdY = this.VIRTUAL_HEIGHT - this.GROUND_HEIGHT - this.BIRD_RADIUS;
      return true;
    }

    // Pipe collision with slightly forgiving hitbox
    const hitRadius = this.BIRD_RADIUS - 2;
    for (const pipe of this.pipes) {
      const inPipeX =
        this.BIRD_X + hitRadius > pipe.x &&
        this.BIRD_X - hitRadius < pipe.x + this.PIPE_WIDTH;

      const aboveGap = this.birdY - hitRadius < pipe.gapY;
      const belowGap = this.birdY + hitRadius > pipe.gapY + this.PIPE_GAP;

      if (inPipeX && (aboveGap || belowGap)) {
        return true;
      }
    }

    return false;
  }

  onGameOver() {
    this.state = 'GAMEOVER';
    playHitSound();
    setTimeout(() => playDieSound(), 120);
    hapticCrash();
    this.particles.burstFeathers(this.BIRD_X, this.birdY);

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.newHighScoreAlert = true;
      localStorage.setItem('flappy_best_score', this.bestScore.toString());
    }

    // Calculate medal
    if (this.score >= 50) this.medalAwarded = 'PLATINUM';
    else if (this.score >= 35) this.medalAwarded = 'GOLD';
    else if (this.score >= 20) this.medalAwarded = 'SILVER';
    else if (this.score >= 10) this.medalAwarded = 'BRONZE';

    if (this.medalAwarded) {
      setTimeout(() => playMedalSound(), 350);
    }
  }

  update() {
    this.frameCount++;

    // Update clouds
    for (const cloud of this.clouds) {
      cloud.x -= cloud.speed;
      if (cloud.x < -80) {
        cloud.x = this.VIRTUAL_WIDTH + 60;
      }
    }

    // Animate score pop
    if (this.scoreScale > 1.0) {
      this.scoreScale = Math.max(1.0, this.scoreScale - 0.04);
    }

    if (this.state === 'READY') {
      // Gentle floating animation
      this.birdY = (this.VIRTUAL_HEIGHT / 2 - 20) + Math.sin(this.frameCount * 0.08) * 8;
      this.groundOffset = (this.groundOffset + this.PIPE_SPEED) % 24;
    } else if (this.state === 'PLAYING') {
      // Ground movement
      this.groundOffset = (this.groundOffset + this.PIPE_SPEED) % 24;

      // Bird physics
      this.birdVelocity += this.GRAVITY;
      if (this.birdVelocity > this.MAX_FALL_SPEED) {
        this.birdVelocity = this.MAX_FALL_SPEED;
      }
      this.birdY += this.birdVelocity;

      // Pipe movement
      for (let i = 0; i < this.pipes.length; i++) {
        const pipe = this.pipes[i];
        pipe.x -= this.PIPE_SPEED;

        // Check if bird passed the pipe center to score
        if (!pipe.scored && pipe.x + this.PIPE_WIDTH / 2 < this.BIRD_X) {
          pipe.scored = true;
          this.score++;
          this.scoreScale = 1.35;
          playPointSound();
          hapticScore();
          this.particles.addFloatingText('+1', this.BIRD_X + 15, this.birdY - 20);
        }
      }

      // Remove off-screen pipes
      if (this.pipes.length && this.pipes[0].x + this.PIPE_WIDTH < 0) {
        this.pipes.shift();
      }

      // Spawn pipes
      if (this.frameCount % Math.round(this.PIPE_INTERVAL / this.PIPE_SPEED) === 0) {
        this.createPipe();
      }

      // Collision
      if (this.checkCollision()) {
        this.onGameOver();
      }
    } else if (this.state === 'GAMEOVER') {
      // Bird plummets to ground
      if (this.birdY + this.BIRD_RADIUS < this.VIRTUAL_HEIGHT - this.GROUND_HEIGHT) {
        this.birdVelocity += this.GRAVITY * 1.4;
        this.birdY += this.birdVelocity;
        if (this.birdY + this.BIRD_RADIUS >= this.VIRTUAL_HEIGHT - this.GROUND_HEIGHT) {
          this.birdY = this.VIRTUAL_HEIGHT - this.GROUND_HEIGHT - this.BIRD_RADIUS;
        }
      }
    }

    this.particles.update();
  }

  // --- Rendering Pipeline ---
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.VIRTUAL_WIDTH, this.VIRTUAL_HEIGHT);

    this.drawSky();
    this.drawBackgroundClouds();
    this.drawCitySkyline();
    this.drawPipes();
    this.drawGround();
    this.drawBird();
    this.particles.draw(ctx);
    this.drawUI();
  }

  drawSky() {
    const ctx = this.ctx;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.VIRTUAL_HEIGHT);
    skyGrad.addColorStop(0, '#38bdf8');   // Daylight sky cyan
    skyGrad.addColorStop(0.55, '#7dd3fc');
    skyGrad.addColorStop(0.85, '#bae6fd');
    skyGrad.addColorStop(1, '#e0f2fe');

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.VIRTUAL_WIDTH, this.VIRTUAL_HEIGHT);
  }

  drawBackgroundClouds() {
    const ctx = this.ctx;
    ctx.save();
    for (const c of this.clouds) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 24 * c.scale, 0, Math.PI * 2);
      ctx.arc(c.x + 22 * c.scale, c.y - 6 * c.scale, 30 * c.scale, 0, Math.PI * 2);
      ctx.arc(c.x + 46 * c.scale, c.y, 22 * c.scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawCitySkyline() {
    const ctx = this.ctx;
    ctx.save();
    const groundY = this.VIRTUAL_HEIGHT - this.GROUND_HEIGHT;

    // Distant city silhouette
    ctx.fillStyle = 'rgba(125, 211, 252, 0.45)';
    const buildings = [
      { x: 10, w: 32, h: 65 },
      { x: 46, w: 26, h: 90 },
      { x: 76, w: 38, h: 50 },
      { x: 118, w: 42, h: 105 },
      { x: 164, w: 30, h: 75 },
      { x: 198, w: 36, h: 55 },
      { x: 238, w: 44, h: 95 },
      { x: 286, w: 34, h: 70 },
      { x: 324, w: 48, h: 85 }
    ];

    for (const b of buildings) {
      ctx.fillRect(b.x, groundY - b.h, b.w, b.h);
      // Small window accents
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let wy = groundY - b.h + 12; wy < groundY - 12; wy += 14) {
        ctx.fillRect(b.x + 6, wy, 4, 6);
        if (b.w > 30) ctx.fillRect(b.x + 18, wy, 4, 6);
      }
      ctx.fillStyle = 'rgba(125, 211, 252, 0.45)';
    }

    ctx.restore();
  }

  drawPipes() {
    const ctx = this.ctx;
    const capHeight = 24;
    const capOverhang = 4;
    const groundY = this.VIRTUAL_HEIGHT - this.GROUND_HEIGHT;

    for (const pipe of this.pipes) {
      // Pipe gradient with 3D cylindrical shine
      const pipeGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + this.PIPE_WIDTH, 0);
      pipeGrad.addColorStop(0, '#86efac');
      pipeGrad.addColorStop(0.2, '#4ade80');
      pipeGrad.addColorStop(0.65, '#22c55e');
      pipeGrad.addColorStop(0.9, '#15803d');
      pipeGrad.addColorStop(1, '#14532d');

      const strokeCol = '#14532d';

      // --- Top Pipe ---
      const topBodyHeight = Math.max(0, pipe.gapY - capHeight);
      ctx.fillStyle = pipeGrad;
      ctx.fillRect(pipe.x, 0, this.PIPE_WIDTH, topBodyHeight);
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(pipe.x, -2, this.PIPE_WIDTH, topBodyHeight + 2);

      // Top Pipe Cap Rim
      ctx.fillStyle = pipeGrad;
      ctx.fillRect(pipe.x - capOverhang, pipe.gapY - capHeight, this.PIPE_WIDTH + capOverhang * 2, capHeight);
      ctx.strokeRect(pipe.x - capOverhang, pipe.gapY - capHeight, this.PIPE_WIDTH + capOverhang * 2, capHeight);

      // Cap shine line
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(pipe.x + 5, pipe.gapY - capHeight + 3, 5, capHeight - 6);

      // --- Bottom Pipe ---
      const bottomCapY = pipe.gapY + this.PIPE_GAP;
      // Bottom Pipe Cap Rim
      ctx.fillStyle = pipeGrad;
      ctx.fillRect(pipe.x - capOverhang, bottomCapY, this.PIPE_WIDTH + capOverhang * 2, capHeight);
      ctx.strokeRect(pipe.x - capOverhang, bottomCapY, this.PIPE_WIDTH + capOverhang * 2, capHeight);

      // Cap shine line
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(pipe.x + 5, bottomCapY + 3, 5, capHeight - 6);

      // Bottom Pipe Body
      const bottomBodyY = bottomCapY + capHeight;
      const bottomBodyHeight = groundY - bottomBodyY;
      if (bottomBodyHeight > 0) {
        ctx.fillStyle = pipeGrad;
        ctx.fillRect(pipe.x, bottomBodyY, this.PIPE_WIDTH, bottomBodyHeight);
        ctx.strokeRect(pipe.x, bottomBodyY, this.PIPE_WIDTH, bottomBodyHeight + 2);
      }
    }
  }

  drawBird() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.BIRD_X, this.birdY);

    // Dynamic pitch banking
    let pitch = 0;
    if (this.state === 'PLAYING') {
      pitch = Math.min(Math.PI / 2.4, Math.max(-Math.PI / 6.5, this.birdVelocity * 0.095));
    } else if (this.state === 'GAMEOVER') {
      pitch = Math.PI / 2; // face down when falling
    }
    ctx.rotate(pitch);

    // Wing flapping
    const flapFrequency = (this.state === 'PLAYING') ? 0.32 : 0.16;
    const wingFlap = Math.sin(this.frameCount * flapFrequency);

    // --- Tail Feathers ---
    ctx.beginPath();
    ctx.moveTo(-13, -2);
    ctx.lineTo(-21, -7);
    ctx.lineTo(-17, 1);
    ctx.lineTo(-21, 8);
    ctx.lineTo(-13, 3);
    ctx.fillStyle = '#eab308';
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = '#854d0e';
    ctx.stroke();

    // --- Bird Body ---
    ctx.beginPath();
    ctx.ellipse(0, 0, 16.5, 13.5, 0, 0, Math.PI * 2);
    const bodyGrad = ctx.createRadialGradient(-3, -4, 2, 0, 0, 17);
    bodyGrad.addColorStop(0, '#fffbeb');
    bodyGrad.addColorStop(0.55, '#facc15');
    bodyGrad.addColorStop(1, '#ca8a04');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#854d0e';
    ctx.stroke();

    // --- Belly Patch ---
    ctx.beginPath();
    ctx.ellipse(-2, 4.5, 10, 7.5, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#fef9c3';
    ctx.fill();

    // --- Rosy Blush Cheek ---
    ctx.beginPath();
    ctx.arc(3, 4.5, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
    ctx.fill();

    // --- Beak ---
    ctx.beginPath();
    ctx.moveTo(11.5, -3.5);
    ctx.lineTo(22, 1.5);
    ctx.lineTo(11.5, 6.5);
    ctx.closePath();
    ctx.fillStyle = '#fb923c';
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = '#9a3412';
    ctx.stroke();

    // Beak mouth slit
    ctx.beginPath();
    ctx.moveTo(12, 1.8);
    ctx.lineTo(20, 1.8);
    ctx.strokeStyle = '#c2410c';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // --- Big Cartoon Eye ---
    ctx.beginPath();
    ctx.arc(6.5, -4, 5.8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = '#854d0e';
    ctx.stroke();

    // Pupil
    ctx.beginPath();
    ctx.arc(8.5, -4, 2.7, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // Catchlight highlight
    ctx.beginPath();
    ctx.arc(7.5, -5.2, 1.1, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // --- Animated Wing ---
    ctx.save();
    ctx.translate(-4, 0);
    ctx.rotate(wingFlap * 0.42);
    ctx.beginPath();
    ctx.ellipse(-2, 1, 9, 6, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#fde047';
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#ca8a04';
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  drawGround() {
    const ctx = this.ctx;
    const groundY = this.VIRTUAL_HEIGHT - this.GROUND_HEIGHT;

    // Dirt base
    const dirtGrad = ctx.createLinearGradient(0, groundY, 0, this.VIRTUAL_HEIGHT);
    dirtGrad.addColorStop(0, '#ded895');
    dirtGrad.addColorStop(1, '#b5a642');
    ctx.fillStyle = dirtGrad;
    ctx.fillRect(0, groundY, this.VIRTUAL_WIDTH, this.GROUND_HEIGHT);

    // Grass strip
    ctx.fillStyle = '#65a30d';
    ctx.fillRect(0, groundY, this.VIRTUAL_WIDTH, 12);
    ctx.strokeStyle = '#3f6212';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, groundY, this.VIRTUAL_WIDTH, 12);

    // Repeating grass blades pattern moving with pipes
    ctx.fillStyle = '#84cc16';
    const bladeStep = 18;
    for (let x = -this.groundOffset; x < this.VIRTUAL_WIDTH + bladeStep; x += bladeStep) {
      ctx.beginPath();
      ctx.moveTo(x, groundY + 12);
      ctx.lineTo(x + 5, groundY + 4);
      ctx.lineTo(x + 10, groundY + 12);
      ctx.fill();
    }
  }

  drawUI() {
    const ctx = this.ctx;

    // In-game score counter
    if (this.state === 'PLAYING' || this.state === 'READY') {
      ctx.save();
      ctx.translate(this.VIRTUAL_WIDTH / 2, 60);
      ctx.scale(this.scoreScale, this.scoreScale);

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 6;
      ctx.lineJoin = 'round';
      ctx.font = '900 42px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';

      ctx.strokeText(this.score.toString(), 0, 0);
      ctx.fillText(this.score.toString(), 0, 0);
      ctx.restore();
    }

    // Top Best Score badge
    ctx.save();
    ctx.font = '700 14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 4;
    ctx.fillText(`🏆 BEST: ${this.bestScore}`, 16, 28);
    ctx.restore();

    // Start Screen Prompt
    if (this.state === 'READY') {
      ctx.save();
      ctx.textAlign = 'center';

      // Title Banner
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 5;
      ctx.font = '900 32px system-ui, sans-serif';
      ctx.strokeText('FLAPPY BIRD', this.VIRTUAL_WIDTH / 2, this.VIRTUAL_HEIGHT / 2 - 80);
      ctx.fillText('FLAPPY BIRD', this.VIRTUAL_WIDTH / 2, this.VIRTUAL_HEIGHT / 2 - 80);

      // Subtitle
      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = '#713f12';
      ctx.lineWidth = 3;
      ctx.font = '700 16px system-ui, sans-serif';
      ctx.strokeText('CROSS-PLATFORM EDITION', this.VIRTUAL_WIDTH / 2, this.VIRTUAL_HEIGHT / 2 - 50);
      ctx.fillText('CROSS-PLATFORM EDITION', this.VIRTUAL_WIDTH / 2, this.VIRTUAL_HEIGHT / 2 - 50);

      // Pulsing start button indicator
      const pulse = 1 + Math.sin(this.frameCount * 0.1) * 0.05;
      ctx.translate(this.VIRTUAL_WIDTH / 2, this.VIRTUAL_HEIGHT / 2 + 35);
      ctx.scale(pulse, pulse);

      // Glowing pill box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.beginPath();
      ctx.roundRect(-125, -22, 250, 44, 22);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillText('👆 TAP OR PRESS SPACE', 0, 6);
      ctx.restore();
    }

    // Pause Screen Overlay
    if (this.state === 'PAUSED') {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fillRect(0, 0, this.VIRTUAL_WIDTH, this.VIRTUAL_HEIGHT);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', this.VIRTUAL_WIDTH / 2, this.VIRTUAL_HEIGHT / 2 - 20);

      ctx.font = '600 16px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Tap or press Esc to resume', this.VIRTUAL_WIDTH / 2, this.VIRTUAL_HEIGHT / 2 + 20);
      ctx.restore();
    }

    // Game Over Score Card
    if (this.state === 'GAMEOVER') {
      this.drawGameOverCard();
    }
  }

  drawGameOverCard() {
    const ctx = this.ctx;
    ctx.save();

    const cx = this.VIRTUAL_WIDTH / 2;
    const cy = this.VIRTUAL_HEIGHT / 2 - 10;

    // Game Over Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 6;
    ctx.font = '900 36px system-ui, sans-serif';
    ctx.strokeText('GAME OVER', cx, cy - 100);
    ctx.fillText('GAME OVER', cx, cy - 100);

    // Score Card Box
    ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cx - 140, cy - 75, 280, 160, 16);
    ctx.fill();
    ctx.stroke();

    // Medal slot
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx - 85, cy + 5, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Medal if earned
    if (this.medalAwarded) {
      let mColor = '#cd7f32'; // Bronze
      let mLabel = '🥉';
      if (this.medalAwarded === 'SILVER') {
        mColor = '#cbd5e1';
        mLabel = '🥈';
      } else if (this.medalAwarded === 'GOLD') {
        mColor = '#facc15';
        mLabel = '🥇';
      } else if (this.medalAwarded === 'PLATINUM') {
        mColor = '#38bdf8';
        mLabel = '💎';
      }

      ctx.fillStyle = mColor;
      ctx.beginPath();
      ctx.arc(cx - 85, cy + 5, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(mLabel, cx - 85, cy + 14);

      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(this.medalAwarded, cx - 85, cy - 38);
    } else {
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('MEDAL', cx - 85, cy - 38);
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText('None', cx - 85, cy + 10);
    }

    // Score & Best labels
    ctx.textAlign = 'right';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('SCORE', cx + 115, cy - 42);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 28px system-ui, sans-serif';
    ctx.fillText(this.score.toString(), cx + 115, cy - 14);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('BEST', cx + 115, cy + 16);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 28px system-ui, sans-serif';
    ctx.fillText(this.bestScore.toString(), cx + 115, cy + 44);

    if (this.newHighScoreAlert) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText('★ NEW HIGH SCORE! ★', cx, cy + 70);
    }

    // Play Again button
    ctx.fillStyle = '#22c55e';
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx - 100, cy + 105, 200, 44, 22);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText('🔄 PLAY AGAIN', cx, cy + 133);

    ctx.restore();
  }
}
