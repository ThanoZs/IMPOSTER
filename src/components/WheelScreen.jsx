// WheelScreen.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const ease = {
  outExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  outBack: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  outQuart: t => 1 - Math.pow(1 - t, 4),
};

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ── Synthesised gunshot ── */
let _actx = null;
function bang() {
  try {
    if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _actx, sr = ctx.sampleRate;
    const cb = ctx.createBuffer(1, sr * .04, sr);
    const cd = cb.getChannelData(0);
    for (let i = 0; i < cd.length; i++) cd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * .008));
    const cs = ctx.createBufferSource(); cs.buffer = cb;
    const cg = ctx.createGain(); cg.gain.value = 0.5;
    cs.connect(cg); cg.connect(ctx.destination); cs.start();
    const bb = ctx.createBuffer(1, sr * .5, sr);
    const bd = bb.getChannelData(0);
    for (let i = 0; i < bd.length; i++) { const t = i / sr; bd[i] = (Math.random() * 2 - 1) * Math.exp(-t * 10) * (1 + .8 * Math.sin(TAU * 80 * t)); }
    const bs = ctx.createBufferSource(); bs.buffer = bb;
    const lo = ctx.createBiquadFilter(); lo.type = 'lowpass'; lo.frequency.value = 800;
    const bg2 = ctx.createGain(); bg2.gain.value = 1.2;
    bs.connect(lo); lo.connect(bg2); bg2.connect(ctx.destination); bs.start(ctx.currentTime + .04);
  } catch (_) { }
}

/* ══════════════════════════════════════════════════════════ */
const WheelScreen = ({ players, type, onFinish }) => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const st = useRef({
    angle: -Math.PI / 2, startAngle: -Math.PI / 2,
    totalSpin: 0, targetAngle: 0,
    aimAngle: 0,       // barrel-tip world direction = exact player angle
    phase: 'idle',
    flash: 0, recoil: 0, shake: { x: 0, y: 0 },
    smoke: [], sparks: [],
    laserAlpha: 0, laserLen: 0,
    winnerIdx: 0,
    hitT: 0,
    hitPx: 0, hitPy: 0,
    t0: 0,
    SPIN_MS: 4200, AIM_MS: 700, COCK_MS: 280, SHOOT_MS: 110, SETTLE_MS: 800,
  });

  const [uiPhase, setUiPhase] = useState('idle');
  const [winnerName, setWinnerName] = useState('');
  const N = players.length;

  /* ── canvas engine ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const DPR = window.devicePixelRatio || 1;

    // Measure real container size for responsive layout
    const container = canvas.parentElement;
    const cw = container.clientWidth;
    // Use most of the available height minus space for title + button + announcement
    const maxH = window.innerHeight * 0.62;
    const W = cw;
    const H = Math.min(maxH, cw * 0.7);  // maintain ~aspect ratio but cap height
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(DPR, DPR);
    const CX = W / 2, CY = H * .46;
    // Ring radius: sized to fill canvas, with margin for player figures+labels
    const RING_R = Math.min(W * 0.40, H * 0.38);

    /* ── arena ring + bg ── */
    function drawBg() {
      ctx.clearRect(0, 0, W, H);
      // deep bg radial
      const bg = ctx.createRadialGradient(CX, CY, 10, CX, CY, H * .95);
      bg.addColorStop(0, '#0d1628');
      bg.addColorStop(.55, '#060814');
      bg.addColorStop(1, '#020307');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      // grid
      ctx.save();
      ctx.strokeStyle = 'rgba(111,94,245,0.045)'; ctx.lineWidth = .5;
      const gs = 30;
      for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.restore();
      // arena outer glow ring
      ctx.save();
      ctx.strokeStyle = 'rgba(111,94,245,0.16)'; ctx.lineWidth = 1;
      ctx.setLineDash([5, 9]);
      ctx.beginPath(); ctx.arc(CX, CY, RING_R, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      // tick marks at each player slot
      for (let i = 0; i < N; i++) {
        const a = (i / N) * TAU - Math.PI / 2;
        ctx.strokeStyle = 'rgba(111,94,245,0.28)'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(CX + (RING_R - 7) * Math.cos(a), CY + (RING_R - 7) * Math.sin(a));
        ctx.lineTo(CX + (RING_R + 4) * Math.cos(a), CY + (RING_R + 4) * Math.sin(a));
        ctx.stroke();
      }
      // inner floor mood glow
      const ig = ctx.createRadialGradient(CX, CY, 0, CX, CY, RING_R * .5);
      ig.addColorStop(0, 'rgba(111,94,245,0.06)'); ig.addColorStop(1, 'rgba(111,94,245,0)');
      ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(CX, CY, RING_R * .5, 0, TAU); ctx.fill();
      ctx.restore();
    }

    /* ── draw person silhouette icon ── */
    // cx,cy = center of torso. sc = scale factor
    // isWinner, hitT: 0 = normal, hitT > 0 = being hit (slumping)
    function drawPerson(px, py, name, isWinner, hitT, phase, now) {
      ctx.save();
      ctx.translate(px, py);

      // slump rotation when hit
      const slump = hitT > 0 ? ease.outQuart(hitT) * 0.7 : 0;
      ctx.rotate(slump);

      const alive = phase !== 'settle' && phase !== 'done' || !isWinner;
      // Scale person: more players = smaller figures to avoid overlap
      // Arc spacing between players = 2*PI*RING_R / N pixels
      const arcSpacing = (2 * Math.PI * RING_R) / N;
      const maxFigH = arcSpacing * 0.62; // figure height in pixels
      const SCALE = Math.min(maxFigH / 80, W / 360);
      const S = Math.max(SCALE, 0.55);

      // pulse aura when targeted
      if (isWinner && (phase === 'aim' || phase === 'cock')) {
        const pulse = .5 + .5 * Math.sin(now / 150);
        ctx.shadowColor = `rgba(232,25,44,${.5 * pulse})`;
        ctx.shadowBlur = 18;
        const ag = ctx.createRadialGradient(0, 0, 0, 0, 0, 38 * S);
        ag.addColorStop(0, `rgba(232,25,44,${.15 * pulse})`);
        ag.addColorStop(1, 'rgba(232,25,44,0)');
        ctx.fillStyle = ag;
        ctx.beginPath(); ctx.arc(0, 0, 38 * S, 0, TAU); ctx.fill();
        ctx.shadowBlur = 0;
      }

      const isRevealed = isWinner && (phase === 'shoot' || phase === 'settle' || phase === 'done');
      const bodyCol = isRevealed ? '#8b0a10' : 'rgba(140,160,220,0.85)';
      const rimCol = isRevealed ? 'rgba(232,25,44,0.8)' : 'rgba(111,94,245,0.55)';
      const glowCol = isRevealed ? 'rgba(232,25,44,0.55)' : 'rgba(111,94,245,0.28)';

      ctx.shadowColor = glowCol;
      ctx.shadowBlur = isRevealed ? 14 : 5;

      // — head —
      const HY = -30 * S;
      ctx.fillStyle = bodyCol;
      ctx.strokeStyle = rimCol;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, HY, 9 * S, 0, TAU);
      ctx.fill(); ctx.stroke();

      // face features (tiny)
      if (!isRevealed) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath(); ctx.arc(-3 * S, HY - 1 * S, 1.5 * S, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(3 * S, HY - 1 * S, 1.5 * S, 0, TAU); ctx.fill();
      } else {
        // X eyes when dead/hit
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1;
        [[-3, 1], [3, 1]].forEach(([ex, ey]) => {
          ctx.beginPath();
          ctx.moveTo((ex - 1.5) * S, (HY + (ey - 1.5) * S)); ctx.lineTo((ex + 1.5) * S, (HY + (ey + 1.5) * S)); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo((ex + 1.5) * S, (HY + (ey - 1.5) * S)); ctx.lineTo((ex - 1.5) * S, (HY + (ey + 1.5) * S)); ctx.stroke();
        });
      }

      // — neck —
      ctx.strokeStyle = bodyCol; ctx.lineWidth = 4 * S;
      ctx.beginPath(); ctx.moveTo(0, -21 * S); ctx.lineTo(0, -16 * S); ctx.stroke();

      // — torso —
      const tg = ctx.createLinearGradient(-10 * S, -16 * S, 10 * S, 10 * S);
      tg.addColorStop(0, isRevealed ? '#a01820' : 'rgba(100,120,200,0.8)');
      tg.addColorStop(1, isRevealed ? '#600a10' : 'rgba(60,80,150,0.6)');
      ctx.fillStyle = tg;
      ctx.strokeStyle = rimCol;
      ctx.lineWidth = 1;
      rrect(ctx, -10 * S, -16 * S, 20 * S, 26 * S, 4 * S);
      ctx.fill(); ctx.stroke();

      // — arms —
      ctx.strokeStyle = bodyCol; ctx.lineWidth = 3.5 * S; ctx.lineCap = 'round';
      // left arm
      ctx.beginPath();
      ctx.moveTo(-10 * S, -12 * S);
      if (isRevealed && hitT > 0) {
        ctx.lineTo(-18 * S, -8 * S + hitT * 12 * S);
      } else {
        ctx.lineTo(-18 * S, -2 * S);
      }
      ctx.stroke();
      // right arm
      ctx.beginPath();
      ctx.moveTo(10 * S, -12 * S);
      if (isRevealed && hitT > 0) {
        ctx.lineTo(18 * S, -8 * S + hitT * 14 * S);
      } else {
        ctx.lineTo(18 * S, -2 * S);
      }
      ctx.stroke();

      // — legs —
      const legSplay = isRevealed && hitT > 0 ? hitT * 8 * S : 0;
      ctx.strokeStyle = bodyCol; ctx.lineWidth = 4 * S;
      ctx.beginPath();
      ctx.moveTo(-4 * S, 10 * S);
      ctx.lineTo(-6 * S - legSplay, 26 * S);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(4 * S, 10 * S);
      ctx.lineTo(6 * S + legSplay, 26 * S);
      ctx.stroke();

      ctx.shadowBlur = 0;

      // — name label below legs —
      const nameY = 36 * S;
      ctx.font = `700 ${Math.max(9, 10 * S)}px 'Orbitron', monospace`;
      const label = name.toUpperCase().slice(0, 8);
      const tw = ctx.measureText(label).width + 14;
      const th = 18;

      // label bg
      const lbg = ctx.createLinearGradient(-tw / 2, nameY, tw / 2, nameY + th);
      if (isRevealed) {
        lbg.addColorStop(0, 'rgba(90,6,10,0.95)');
        lbg.addColorStop(1, 'rgba(50,3,6,0.95)');
      } else {
        lbg.addColorStop(0, 'rgba(14,20,44,0.92)');
        lbg.addColorStop(1, 'rgba(8,12,28,0.92)');
      }
      ctx.fillStyle = lbg;
      ctx.strokeStyle = isRevealed ? 'rgba(232,25,44,0.85)' : 'rgba(111,94,245,0.38)';
      ctx.lineWidth = isRevealed ? 1.2 : 0.7;
      rrect(ctx, -tw / 2, nameY, tw, th, 5);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = isRevealed ? '#ff6060' : 'rgba(180,196,240,0.9)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, nameY + th / 2);

      // concentric rings when eliminated
      if (isRevealed) {
        ctx.strokeStyle = 'rgba(232,25,44,0.45)'; ctx.lineWidth = .9;
        ctx.beginPath(); ctx.arc(0, 0, 40 * S, 0, TAU); ctx.stroke();
        ctx.strokeStyle = 'rgba(232,25,44,0.18)'; ctx.lineWidth = .7;
        ctx.beginPath(); ctx.arc(0, 0, 52 * S, 0, TAU); ctx.stroke();
      }

      ctx.restore();
    }

    /* ── players ring ── */
    function drawPlayers(phase, now, hitT) {
      players.forEach((p, i) => {
        const a = (i / N) * TAU - Math.PI / 2;
        const px = CX + RING_R * Math.cos(a);
        const py = CY + RING_R * Math.sin(a);
        const isWinner = i === st.current.winnerIdx;
        const pHitT = isWinner ? hitT : 0;
        drawPerson(px, py, p.name, isWinner, pHitT, phase, now);
      });
    }

    /* ── laser sight ── */
    function drawLaser(angle, alpha, len) {
      if (alpha <= 0) return;
      const sc = Math.min(W, H) / 480;
      const mD = 150 * sc;
      const mx = CX + Math.cos(angle + Math.PI) * mD;
      const my = CY + Math.sin(angle + Math.PI) * mD;
      const ex = mx + Math.cos(angle + Math.PI) * len;
      const ey = my + Math.sin(angle + Math.PI) * len;
      ctx.save();
      ctx.shadowColor = `rgba(232,25,44,${alpha * .8})`; ctx.shadowBlur = 8;
      const lg = ctx.createLinearGradient(mx, my, ex, ey);
      lg.addColorStop(0, `rgba(255,80,80,${alpha * .9})`);
      lg.addColorStop(.6, `rgba(232,25,44,${alpha * .5})`);
      lg.addColorStop(1, 'rgba(232,25,44,0)');
      ctx.strokeStyle = lg; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(ex, ey); ctx.stroke();
      const dg = ctx.createRadialGradient(ex, ey, 0, ex, ey, 4 * alpha);
      dg.addColorStop(0, `rgba(255,180,180,${alpha})`);
      dg.addColorStop(1, 'rgba(232,25,44,0)');
      ctx.fillStyle = dg;
      ctx.beginPath(); ctx.arc(ex, ey, 4 * alpha, 0, TAU); ctx.fill();
      ctx.restore();
    }

    /* ── aim reticle (dashed line) ── */
    function drawAimLine(angle, alpha) {
      if (alpha <= 0) return;
      const sc = Math.min(W, H) / 480;
      const mD = 150 * sc;
      const mx = CX + Math.cos(angle + Math.PI) * mD;
      const my = CY + Math.sin(angle + Math.PI) * mD;
      ctx.save();
      ctx.globalAlpha = alpha * .3;
      ctx.strokeStyle = 'rgba(232,25,44,0.8)'; ctx.lineWidth = .7;
      ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(mx, my);
      ctx.lineTo(mx + Math.cos(angle + Math.PI) * W, my + Math.sin(angle + Math.PI) * W);
      ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    }

    /* ── GUN ── */
    function drawGun(angle, recoil, shake) {
      ctx.save();
      ctx.translate(CX + shake.x, CY + shake.y);
      ctx.rotate(angle);
      const sc = Math.min(W, H) / 480;
      ctx.translate(recoil * 10 * sc, 0);
      ctx.scale(sc, sc);

      ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 8;

      /* grip */
      {
        const gg = ctx.createLinearGradient(-10, 32, 28, 100);
        gg.addColorStop(0, '#4a2a12'); gg.addColorStop(.4, '#2e180a'); gg.addColorStop(1, '#150804');
        ctx.fillStyle = gg; ctx.strokeStyle = 'rgba(90,50,20,0.7)'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(14, 30); ctx.lineTo(26, 30);
        ctx.bezierCurveTo(38, 46, 36, 68, 32, 88);
        ctx.bezierCurveTo(28, 100, 14, 106, 4, 100);
        ctx.bezierCurveTo(-6, 94, -4, 78, 0, 58);
        ctx.lineTo(6, 36); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.save(); ctx.clip();
        ctx.strokeStyle = 'rgba(255,160,60,0.06)'; ctx.lineWidth = .6;
        for (let g = -8; g < 16; g++) {
          ctx.beginPath(); ctx.moveTo(-8 + g * 4, 30); ctx.lineTo(g * 4, 110); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-8 + g * 4 + 32, 30); ctx.lineTo(g * 4, 110); ctx.stroke();
        }
        ctx.restore();
        ctx.strokeStyle = 'rgba(111,94,245,0.5)'; ctx.lineWidth = .8;
        ctx.beginPath(); ctx.arc(16, 72, 9, 0, TAU); ctx.stroke();
        ctx.fillStyle = 'rgba(111,94,245,0.18)'; ctx.fill();
        ctx.fillStyle = 'rgba(111,94,245,0.6)';
        ctx.font = 'bold 7px Orbitron,monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('I', 16, 72);
      }

      ctx.shadowBlur = 10; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 4;

      /* frame */
      {
        const fg = ctx.createLinearGradient(-16, -22, 22, 34);
        fg.addColorStop(0, '#28365a'); fg.addColorStop(.3, '#1a2440'); fg.addColorStop(1, '#07091a');
        ctx.fillStyle = fg; ctx.strokeStyle = 'rgba(111,94,245,0.35)'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-16, -22); ctx.lineTo(22, -22); ctx.lineTo(28, -8);
        ctx.lineTo(28, 30); ctx.lineTo(20, 36); ctx.lineTo(-16, 36);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(160,180,255,0.08)'; ctx.lineWidth = .7;
        ctx.beginPath(); ctx.moveTo(-14, -20); ctx.lineTo(20, -20); ctx.lineTo(26, -8); ctx.stroke();
      }

      /* trigger guard + trigger */
      {
        const fg2 = ctx.createLinearGradient(-20, 36, 20, 68);
        fg2.addColorStop(0, '#1a2440'); fg2.addColorStop(1, '#07091a');
        ctx.fillStyle = fg2; ctx.strokeStyle = 'rgba(111,94,245,0.25)'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-4, 36); ctx.bezierCurveTo(-20, 36, -22, 52, -20, 64);
        ctx.bezierCurveTo(-18, 72, -6, 70, 4, 68); ctx.lineTo(12, 36); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#04060f'; ctx.strokeStyle = 'rgba(232,25,44,0.55)'; ctx.lineWidth = .9;
        ctx.beginPath();
        ctx.moveTo(-1, 38); ctx.lineTo(-4, 60); ctx.lineTo(4, 60); ctx.lineTo(6, 38);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }

      /* hammer */
      {
        const hg = ctx.createLinearGradient(-30, -30, -10, -10);
        hg.addColorStop(0, '#2a3860'); hg.addColorStop(1, '#0a0f20');
        ctx.fillStyle = hg; ctx.strokeStyle = 'rgba(111,94,245,0.3)'; ctx.lineWidth = .9;
        ctx.beginPath();
        ctx.moveTo(-16, -22); ctx.lineTo(-30, -32); ctx.lineTo(-36, -20); ctx.lineTo(-24, -10);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }

      ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(111,94,245,0.15)';

      /* barrel */
      {
        const bg2 = ctx.createLinearGradient(-8, -30, 8, -8);
        bg2.addColorStop(0, '#30406a'); bg2.addColorStop(.4, '#111828'); bg2.addColorStop(1, '#050810');
        ctx.fillStyle = bg2; ctx.strokeStyle = 'rgba(111,94,245,0.45)'; ctx.lineWidth = 1;
        rrect(ctx, -138, -26, 122, 18, 5); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#07091a'; ctx.strokeStyle = 'rgba(111,94,245,0.2)'; ctx.lineWidth = .7;
        rrect(ctx, -136, -8, 118, 8, 3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(200,220,255,0.06)';
        rrect(ctx, -134, -26, 114, 5, 2); ctx.fill();
        // front sight
        ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(255,255,255,0.6)'; ctx.shadowBlur = 4;
        rrect(ctx, -140, -30, 5, 8, 1); ctx.fill();
        // rear sight
        ctx.fillStyle = '#08101e'; ctx.shadowBlur = 0;
        rrect(ctx, -22, -30, 12, 6, 1); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-18, -30, 4, 3);
        ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
        // muzzle
        const mg = ctx.createLinearGradient(-148, -28, -130, -6);
        mg.addColorStop(0, '#28364e'); mg.addColorStop(1, '#050810');
        ctx.fillStyle = mg; ctx.strokeStyle = 'rgba(111,94,245,0.55)'; ctx.lineWidth = 1.1;
        rrect(ctx, -150, -28, 16, 22, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(-142, -17, 5.5, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(111,94,245,0.3)'; ctx.lineWidth = .6;
        ctx.beginPath(); ctx.arc(-142, -17, 5.5, 0, TAU); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath(); ctx.arc(-142, -17, 3, 0, TAU); ctx.stroke();
        // laser rail
        const lr = ctx.createLinearGradient(-136, 0, -136, 18);
        lr.addColorStop(0, '#1a2238'); lr.addColorStop(1, '#07091a');
        ctx.fillStyle = lr; ctx.strokeStyle = 'rgba(232,25,44,0.35)'; ctx.lineWidth = .7;
        rrect(ctx, -130, 0, 80, 10, 3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(232,25,44,0.7)';
        ctx.shadowColor = 'rgba(232,25,44,0.9)'; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(-128, 5, 2.5, 0, TAU); ctx.fill();
        ctx.shadowBlur = 0;
      }

      /* cylinder */
      {
        const cg = ctx.createRadialGradient(6, 4, 2, 6, 4, 32);
        cg.addColorStop(0, '#283050'); cg.addColorStop(.5, '#141c36'); cg.addColorStop(1, '#070a18');
        ctx.fillStyle = cg; ctx.strokeStyle = 'rgba(111,94,245,0.4)'; ctx.lineWidth = 1.6;
        ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(6, 4, 32, 0, TAU); ctx.fill(); ctx.stroke();
        for (let fi = 0; fi < 6; fi++) {
          const fa = (fi / 6) * TAU;
          ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 3.5;
          ctx.beginPath(); ctx.arc(6, 4, 24, fa - .22, fa + .22); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(6, 4, 28, fa - .14, fa + .14); ctx.stroke();
        }
        for (let fi = 0; fi < 6; fi++) {
          const fa = (fi / 6) * TAU;
          const bx = 6 + 17 * Math.cos(fa), by = 4 + 17 * Math.sin(fa);
          const br = ctx.createRadialGradient(bx - 2.5, by - 2.5, .5, bx, by, 8);
          br.addColorStop(0, '#e8c060'); br.addColorStop(.5, '#b88020'); br.addColorStop(1, '#6a4808');
          ctx.fillStyle = br; ctx.shadowColor = 'rgba(200,140,30,0.4)'; ctx.shadowBlur = 3;
          ctx.beginPath(); ctx.arc(bx, by, 8, 0, TAU); ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(bx, by, 8, 0, TAU); ctx.stroke();
          ctx.fillStyle = '#1a0e02'; ctx.shadowBlur = 0;
          ctx.beginPath(); ctx.arc(bx, by, 4, 0, TAU); ctx.fill();
          ctx.fillStyle = '#2e1c04';
          ctx.beginPath(); ctx.arc(bx, by, 2.5, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(255,200,80,0.3)';
          ctx.beginPath(); ctx.arc(bx - .8, by - .8, 1, 0, TAU); ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#03050e'; ctx.strokeStyle = 'rgba(111,94,245,0.7)'; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.arc(6, 4, 6, 0, TAU); ctx.fill(); ctx.stroke();
        const axg = ctx.createRadialGradient(4, 2, 0, 6, 4, 6);
        axg.addColorStop(0, 'rgba(180,190,255,0.55)'); axg.addColorStop(1, 'rgba(111,94,245,0.1)');
        ctx.fillStyle = axg; ctx.beginPath(); ctx.arc(6, 4, 6, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath(); ctx.arc(5, 3, 1.8, 0, TAU); ctx.fill();
      }

      ctx.restore();
    }

    /* ── muzzle flash ── */
    function drawFlash(angle, t) {
      if (t <= 0) return;
      const sc = Math.min(W, H) / 480, mD = 150 * sc;
      const mx = CX + Math.cos(angle + Math.PI) * mD, my = CY + Math.sin(angle + Math.PI) * mD;
      ctx.save();
      const fr = 72 * t * sc;
      const fg = ctx.createRadialGradient(mx, my, 0, mx, my, fr);
      fg.addColorStop(0, `rgba(255,255,220,${t})`);
      fg.addColorStop(.15, `rgba(255,220,80,${t * .95})`);
      fg.addColorStop(.4, `rgba(245,120,30,${t * .7})`);
      fg.addColorStop(.75, `rgba(232,25,44,${t * .35})`);
      fg.addColorStop(1, 'rgba(232,25,44,0)');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.ellipse(mx, my, fr * 1.6, fr * .8, angle + Math.PI, 0, TAU); ctx.fill();
      for (let i = 0; i < 8; i++) {
        const sa = angle + Math.PI + (i / 8) * TAU + (t * 2);
        const sl = (28 + Math.sin(i * 7) * 14) * t * sc;
        ctx.strokeStyle = `rgba(255,200,80,${t * .65})`; ctx.lineWidth = (2 + Math.sin(i * 3)) * t;
        ctx.shadowColor = `rgba(255,150,30,${t * .5})`; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.moveTo(mx, my);
        ctx.lineTo(mx + Math.cos(sa) * sl, my + Math.sin(sa) * sl); ctx.stroke();
      }
      ctx.restore();
    }

    /* ── smoke ── */
    function drawSmoke(ps) {
      ps.forEach(p => {
        ctx.save(); ctx.globalAlpha = p.a;
        const sg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        sg.addColorStop(0, 'rgba(200,200,220,0.35)'); sg.addColorStop(1, 'rgba(150,150,170,0)');
        ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); ctx.restore();
      });
    }

    /* ── sparks ── */
    function drawSparks(ps) {
      ps.forEach(p => {
        ctx.save(); ctx.globalAlpha = p.a;
        ctx.strokeStyle = `rgb(${p.r},${p.g},${p.b})`;
        ctx.lineWidth = 1.2; ctx.shadowColor = `rgba(${p.r},${p.g},${p.b},0.8)`; ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 4, p.y - p.vy * 4); ctx.stroke();
        ctx.restore();
      });
    }

    /* ── bullet tracer ── */
    function drawTracer(angle, progress, tx, ty) {
      if (progress <= 0) return;
      const sc = Math.min(W, H) / 480, mD = 150 * sc;
      const mx = CX + Math.cos(angle + Math.PI) * mD, my = CY + Math.sin(angle + Math.PI) * mD;
      const ex = mx + (tx - mx) * progress, ey = my + (ty - my) * progress;
      ctx.save();
      const tr = ctx.createLinearGradient(mx, my, ex, ey);
      tr.addColorStop(0, 'rgba(255,240,120,0)');
      tr.addColorStop(.4, 'rgba(255,220,80,0.55)');
      tr.addColorStop(.85, 'rgba(255,180,40,0.85)');
      tr.addColorStop(1, 'rgba(255,255,200,1)');
      ctx.strokeStyle = tr; ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(255,180,40,0.8)'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(ex, ey); ctx.stroke();
      const bg2 = ctx.createRadialGradient(ex, ey, 0, ex, ey, 5);
      bg2.addColorStop(0, 'rgba(255,255,200,1)'); bg2.addColorStop(1, 'rgba(255,180,40,0)');
      ctx.fillStyle = bg2; ctx.beginPath(); ctx.arc(ex, ey, 5, 0, TAU); ctx.fill();
      ctx.restore();
    }

    /* ── impact burst at person ── */
    function drawHitBurst(px, py, t) {
      if (t <= 0) return;
      ctx.save();
      const ig = ctx.createRadialGradient(px, py, 0, px, py, 50 * t);
      ig.addColorStop(0, `rgba(255,100,80,${t * .9})`);
      ig.addColorStop(.4, `rgba(232,25,44,${t * .5})`);
      ig.addColorStop(1, 'rgba(232,25,44,0)');
      ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(px, py, 50 * t, 0, TAU); ctx.fill();
      ctx.restore();
    }

    /* ── state machine + render loop ── */
    let bulletProgress = 0, impactBurstT = 0;
    let targetPx = 0, targetPy = 0;

    const loop = (now) => {
      const s = st.current;
      const elapsed = now - s.t0;

      if (s.phase === 'spinning') {
        const t = clamp(elapsed / s.SPIN_MS, 0, 1);
        s.angle = s.startAngle + s.totalSpin * ease.outQuart(t);
        if (t >= 1) {
          // Normalize to clean angle to avoid floating-point drift
          s.angle = ((s.targetAngle % TAU) + TAU) % TAU;
          s.phase = 'aim'; s.t0 = now;
        }
      } else if (s.phase === 'aim') {
        const t = clamp(elapsed / s.AIM_MS, 0, 1);
        s.laserAlpha = ease.outBack(t) * .9;
        s.laserLen = ease.outExpo(t) * Math.min(W, H) * .7;
        if (elapsed > s.AIM_MS) { s.phase = 'cock'; s.t0 = now; }
      } else if (s.phase === 'cock') {
        s.laserAlpha = .9 + .08 * Math.sin(now / 55);
        if (elapsed > s.COCK_MS) {
          s.phase = 'shoot'; s.t0 = now;
          bang();
          // compute target person centre
          const a = (s.winnerIdx / N) * TAU - Math.PI / 2;
          targetPx = CX + RING_R * Math.cos(a);
          targetPy = CY + RING_R * Math.sin(a);
          // spawn muzzle sparks
          const sc2 = Math.min(W, H) / 480, mD = 150 * sc2;
          const mx2 = CX + Math.cos(s.angle + Math.PI) * mD;
          const my2 = CY + Math.sin(s.angle + Math.PI) * mD;
          for (let k = 0; k < 30; k++) {
            const sa = s.angle + Math.PI + (Math.random() - .5) * 1.4;
            const spd = 3 + Math.random() * 5;
            const col = Math.random() < .5
              ? { r: 255, g: (200 + Math.random() * 55) | 0, b: 50 }
              : { r: 255, g: (80 + Math.random() * 40) | 0, b: 20 };
            s.sparks.push({ x: mx2, y: my2, vx: Math.cos(sa) * spd, vy: Math.sin(sa) * spd, a: 1, ...col });
          }
        }
      } else if (s.phase === 'shoot') {
        const t = clamp(elapsed / s.SHOOT_MS, 0, 1);
        s.flash = ease.outExpo(1 - t);
        s.recoil = t < .3 ? t / .3 : 1 - (t - .3) / .7;
        s.shake = { x: (1 - t) * (Math.random() - .5) * 14, y: (1 - t) * (Math.random() - .5) * 9 };
        bulletProgress = ease.outExpo(t);
        s.laserAlpha = 1 - t;
        if (elapsed > s.SHOOT_MS) {
          impactBurstT = 1;
          s.hitT = 0;
          s.phase = 'settle'; s.t0 = now;
          setUiPhase('done');
          setWinnerName(players[s.winnerIdx].name);
          setTimeout(() => onFinish(players[s.winnerIdx].name), 2500);
        }
      } else if (s.phase === 'settle') {
        s.recoil = Math.max(0, s.recoil - .045);
        s.shake = { x: s.shake.x * .82, y: s.shake.y * .82 };
        s.flash = 0; bulletProgress = 0; s.laserAlpha = 0;
        impactBurstT = Math.max(0, impactBurstT - .022);
        // ramp up hit animation
        s.hitT = Math.min(1, s.hitT + .018);
        if (elapsed > s.SETTLE_MS) s.phase = 'done';
      } else if (s.phase === 'done') {
        s.hitT = Math.min(1, s.hitT + .01);
      }

      // particles
      s.sparks = s.sparks.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + .18, vx: p.vx * .93, a: p.a - .03 })).filter(p => p.a > 0);
      if ((s.phase === 'shoot' || s.phase === 'settle') && s.smoke.length < 20 && Math.random() < .4) {
        const sc2 = Math.min(W, H) / 480, mD = 150 * sc2;
        const mx2 = CX + Math.cos(s.angle + Math.PI) * mD, my2 = CY + Math.sin(s.angle + Math.PI) * mD;
        s.smoke.push({ x: mx2 + (Math.random() - .5) * 6, y: my2 + (Math.random() - .5) * 6, vx: (Math.random() - .5) * .8, vy: -.6 - Math.random() * .8, r: 5 + Math.random() * 8, a: .55 });
      }
      s.smoke = s.smoke.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, r: p.r + .32, a: p.a - .01 })).filter(p => p.a > 0);

      // Use the gun's CURRENT angle for everything so gun + effects are always in sync
      const barrelDir = s.angle + Math.PI;  // world direction the barrel tip points
      // render
      drawBg();
      drawAimLine(s.angle, s.phase === 'aim' || s.phase === 'cock' ? s.laserAlpha * .55 : 0);
      drawPlayers(s.phase, now, s.hitT);
      drawSmoke(s.smoke);
      drawSparks(s.sparks);
      drawTracer(s.angle, bulletProgress, targetPx, targetPy);
      drawHitBurst(targetPx, targetPy, impactBurstT);
      drawLaser(s.angle, s.laserAlpha, s.laserLen);
      drawGun(s.angle, s.recoil, s.shake);
      drawFlash(s.angle, s.flash);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [players]);

  /* ── spin handler ── */
  const handleSpin = useCallback(() => {
    const s = st.current;
    if (s.phase !== 'idle') return;
    const winnerIdx = Math.floor(Math.random() * N);
    // Player i sits at angle: (i/N)*TAU - PI/2
    const playerAngle = (winnerIdx / N) * TAU - Math.PI / 2;
    // Barrel extends in -X local → barrel tip world direction = gunAngle + PI
    // To aim at player: gunAngle + PI = playerAngle → gunAngle = playerAngle - PI
    const desiredGunAngle = playerAngle - Math.PI;
    // Normalize both to [0, TAU)
    const currentNorm = ((s.angle % TAU) + TAU) % TAU;
    const targetNorm = ((desiredGunAngle % TAU) + TAU) % TAU;
    // Forward arc from current to target (always positive)
    const diff = ((targetNorm - currentNorm) % TAU + TAU) % TAU;
    // Add 6-12 extra full rotations for drama
    const fullSpins = (6 + Math.floor(Math.random() * 6)) * TAU;
    const totalSpin = fullSpins + diff;
    s.startAngle = s.angle;
    s.totalSpin = totalSpin;
    s.targetAngle = s.startAngle + totalSpin;
    s.aimAngle = playerAngle;  // exact direction barrel should point
    s.winnerIdx = winnerIdx;
    s.t0 = performance.now(); s.phase = 'spinning';
    s.smoke = []; s.sparks = []; s.flash = 0; s.recoil = 0;
    s.shake = { x: 0, y: 0 }; s.laserAlpha = 0; s.laserLen = 0; s.hitT = 0;
    setUiPhase('spinning'); setWinnerName('');
  }, [N]);

  const isIdle = uiPhase === 'idle';
  const isDone = uiPhase === 'done';

  return (
    <div className="screen-container wheel-screen active-bg">
      <motion.h2
        key={type}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="title"
        style={{ fontSize: 'clamp(0.85rem,3.5vw,1.15rem)', letterSpacing: '6px', marginBottom: 0 }}
      >
        {type === 'PICKER' ? '— WHO PICKS FIRST —' : '— WHO SPEAKS FIRST —'}
      </motion.h2>

      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          display: 'block',
          borderRadius: 14,
          border: '1px solid rgba(111,94,245,0.18)',
          boxShadow: '0 0 60px rgba(111,94,245,0.07), inset 0 0 50px rgba(0,0,0,0.55)',
          flex: '1 1 auto',
          minHeight: 0,
        }}
      />

      <AnimatePresence>
        {winnerName && (
          <motion.div
            initial={{ scale: .5, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18 }}
            style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
          >
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '.6rem', letterSpacing: '5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              // target eliminated //
            </p>
            <p className="winner-announcement" style={{ fontSize: '1.4rem', letterSpacing: '3px' }}>
              ◈ {winnerName} ◈
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={isIdle ? { scale: 1.03 } : {}}
        whileTap={isIdle ? { scale: 0.95 } : {}}
        className="primary spin-btn"
        onClick={handleSpin}
        disabled={!isIdle}
        style={{ width: 250, letterSpacing: '3px' }}
      >
        {isIdle ? 'SPIN & FIRE' : isDone ? '✓ FIRED' : 'EXECUTING...'}
      </motion.button>
    </div>
  );
};

export default WheelScreen;