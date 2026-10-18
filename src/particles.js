// Particle Engine for visual juice and game feedback

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // Create feather burst when bird hits pipe or ground
  burstFeathers(x, y) {
    const colors = ['#facc15', '#fef08a', '#eab308', '#fb923c', '#ffffff'];
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 5.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4.5,
        alpha: 1,
        life: 0.95 + Math.random() * 0.04,
        decay: 0.02 + Math.random() * 0.02,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        type: 'feather'
      });
    }
  }

  // Create gentle puff trail when flapping
  puffTrail(x, y) {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x - 12 + (Math.random() - 0.5) * 6,
        y: y + 4 + (Math.random() - 0.5) * 4,
        vx: -(1 + Math.random() * 1.5),
        vy: 0.5 + (Math.random() - 0.5) * 0.8,
        color: 'rgba(255, 255, 255, 0.65)',
        size: 2.5 + Math.random() * 2.5,
        alpha: 0.7,
        decay: 0.045,
        type: 'puff'
      });
    }
  }

  // Floating score pop animation (+1 indicator)
  addFloatingText(text, x, y) {
    this.particles.push({
      text,
      x,
      y,
      vy: -1.8,
      alpha: 1,
      decay: 0.025,
      type: 'text'
    });
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.type === 'feather') {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.vx *= 0.98;
        p.rotation += p.vRot;
        p.alpha -= p.decay;
      } else if (p.type === 'puff') {
        p.x += p.vx;
        p.y += p.vy;
        p.size *= 1.04;
        p.alpha -= p.decay;
      } else if (p.type === 'text') {
        p.y += p.vy;
        p.vy *= 0.96;
        p.alpha -= p.decay;
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.type === 'feather') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.6, p.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'puff') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'text') {
        ctx.fillStyle = '#fde047';
        ctx.strokeStyle = '#854d0e';
        ctx.lineWidth = 3;
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillText(p.text, p.x, p.y);
      }

      ctx.restore();
    }
  }

  clear() {
    this.particles = [];
  }
}
