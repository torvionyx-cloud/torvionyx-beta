// @ts-nocheck
'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import gsap from 'gsap';
import './landing.css';

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let setAccent3D = (_hex: string) => {};
    const canvas = canvasRef.current;
    if (canvas) {
      let renderer: any;
      try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); } catch {}
      if (renderer) {
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        const scene = new THREE.Scene();
        const cam = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
        cam.position.set(0, 0, 6.2);
        const group = new THREE.Group(); scene.add(group);
        const geo = new THREE.IcosahedronGeometry(2.05, 0);
        group.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x16294a, metalness: .35, roughness: .42, flatShading: true })));
        const edgeMat = new THREE.LineBasicMaterial({ color: 0xDCAA33, transparent: true, opacity: .9 });
        group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xDCAA33, transparent: true, opacity: .10 });
        const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 0), coreMat); group.add(core);
        const N = 140, pos = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
          const r = 3 + Math.random() * 4, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
          pos[i*3]=r*Math.sin(p)*Math.cos(t); pos[i*3+1]=r*Math.sin(p)*Math.sin(t); pos[i*3+2]=r*Math.cos(p);
        }
        const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const sparkMat = new THREE.PointsMaterial({ color: 0xDCAA33, size: .045, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false });
        const sparks = new THREE.Points(sg, sparkMat); scene.add(sparks);
        scene.add(new THREE.AmbientLight(0x4060a0, .7));
        const key = new THREE.PointLight(0xDCAA33, 1.4, 40); key.position.set(4,3,5); scene.add(key);
        const rim = new THREE.DirectionalLight(0x6fa0ff, .6); rim.position.set(-5,-2,3); scene.add(rim);
        setAccent3D = (hex: string) => { const c = new THREE.Color(hex); edgeMat.color=c; sparkMat.color=c; coreMat.color=c; key.color=c; };
        let baseX = 1.1, baseY = 1.0;
        const fit = () => {
          const w = canvas.clientWidth, h = canvas.clientHeight; if (!w||!h) return;
          renderer.setSize(w,h,false); cam.aspect=w/h; cam.updateProjectionMatrix();
          baseX=w>980?1.1:0; baseY=w>980?1.0:0.4;
          group.position.set(baseX,baseY,0); sparks.position.copy(group.position);
        };
        window.addEventListener('resize', fit); fit();
        let mx=0, my=0;
        if (!reduce) window.addEventListener('pointermove', e => { mx=e.clientX/innerWidth-.5; my=e.clientY/innerHeight-.5; });
        let t=0;
        const loop = () => {
          requestAnimationFrame(loop); t+=reduce?0:.004;
          group.rotation.y+=reduce?0:.0032; group.rotation.x=Math.sin(t)*.18+(-my*.4); group.rotation.z=Math.sin(t*.6)*.06;
          group.position.x+=((baseX+mx*.5)-group.position.x)*.05; group.position.y+=((baseY-my*.3)-group.position.y)*.05;
          sparks.position.x=group.position.x; sparks.position.y=group.position.y;
          core.rotation.y-=.01; sparks.rotation.y+=reduce?0:.0008;
          renderer.render(scene,cam);
        };
        loop();
      }
    }

    const root = document.documentElement;
    const applyAccent = (hex: string) => {
      root.style.setProperty('--accent', hex);
      const c = hex.replace('#','');
      root.style.setProperty('--accent-soft',`rgba(${parseInt(c.substr(0,2),16)},${parseInt(c.substr(2,2),16)},${parseInt(c.substr(4,2),16)},.14)`);
      document.querySelectorAll('.brand-bolt').forEach(e => (e as HTMLElement).style.fill = hex);
      setAccent3D(hex);
    };
    document.getElementById('swatches')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest('.sw') as HTMLElement|null; if (!btn) return;
      document.querySelectorAll('.sw').forEach(s => s.setAttribute('aria-pressed','false'));
      btn.setAttribute('aria-pressed','true'); applyAccent(btn.dataset.c ?? '#DCAA33');
    });

    const gbp = (v: number) => '£'+Math.round(v).toLocaleString('en-GB');
    const countUp = (el: HTMLElement|null, to: number, fmt: (v:number)=>string, dur=1.6) => {
      if (!el) return; if (reduce) { el.textContent=fmt(to); return; }
      const o={v:0}; gsap.to(o,{v:to,duration:dur,ease:'power2.out',onUpdate:()=>el.textContent=fmt(o.v)});
    };

    const feedData = [
      {who:'Northwind Studio',amt:'£4,800'},{who:'Halcyon & Co.',amt:'£2,150'},
      {who:'Mira Bright',amt:'£6,400'},{who:'Bright Fox Labs',amt:'£3,900'},
    ];
    const feed = document.getElementById('feed');
    if (feed) feedData.forEach(d => {
      const row = document.createElement('div'); row.className='feed-row';
      row.innerHTML=`<span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg></span><span class="who">${d.who}</span><span class="amt">${d.amt}</span>`;
      feed.appendChild(row);
    });

    const reveal = () => {
      countUp(document.getElementById('revFig'),48200,gbp,1.6);
      const rd=document.getElementById('revDelta'); if(rd) rd.textContent='+18%';
      countUp(document.getElementById('acceptFig'),9,v=>Math.round(v).toString(),1.2);
      document.querySelectorAll<HTMLElement>('.feed-row').forEach(r=>{r.style.opacity='1';r.style.transform='none';});
      const area=document.querySelector<HTMLElement>('.area'); if(area) area.style.opacity='1';
      const dot=document.getElementById('chartDot'); if(dot) dot.style.opacity='1';
      const rate={v:0};
      if (!reduce) {
        gsap.to(rate,{v:73,duration:1.4,ease:'power2.out',onUpdate:()=>{
          const rf=document.getElementById('rateFig'); if(rf) rf.textContent=Math.round(rate.v)+'%';
          document.getElementById('ring')?.setAttribute('stroke-dashoffset',(100.5*(1-rate.v/100)).toFixed(2));
        }});
        const line = document.getElementById('chartLine');
        if (line) {
          const len = (line as SVGPathElement).getTotalLength();
          gsap.set(line,{strokeDasharray:len,strokeDashoffset:len});
          gsap.to(line,{strokeDashoffset:0,duration:1.3,ease:'power2.inOut',delay:.3});
        }
      } else {
        const rf=document.getElementById('rateFig'); if(rf) rf.textContent='73%';
        document.getElementById('ring')?.setAttribute('stroke-dashoffset',(100.5*(1-0.73)).toFixed(1));
      }
    };

    setTimeout(reveal, 400);

    const revealBtn=document.getElementById('reveal'), pwInput=document.getElementById('pw') as HTMLInputElement|null;
    revealBtn?.addEventListener('click',()=>{
      if (!pwInput) return;
      const show=pwInput.type==='password'; pwInput.type=show?'text':'password';
      if (revealBtn) revealBtn.textContent=show?'HIDE':'SHOW';
    });
  }, []);

  return (
    <>
      <div className="wrap">

        {/* LEFT PANEL */}
        <section className="show">
          <canvas id="gem" ref={canvasRef} aria-hidden="true" />
          <div className="show-inner">

            <div className="brand">
              <svg className="brand-logo" viewBox="0 0 100 157" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M50 0 L100 48.4 L50 156.5 L0 48.4 Z" fill="#FAF2E8" />
                <path className="brand-bolt" d="M79.7 37.7 L19.9 37.9 L19.9 52 L41.5 52.2 L35 96.5 L46.4 93.5 L45.1 135.3 L66.1 75.9 L54.5 78.1 L59.6 52.7 L79.7 52 Z" fill="#DCAA33" stroke="#132543" strokeWidth="3" paintOrder="stroke" />
              </svg>
              <span className="bname">torvionyx</span>
            </div>

            <div className="lede">
              <div className="eyebrow">Proposal OS for freelancers</div>
              <h1>Send it branded.<br /><span className="em">Watch it close.</span></h1>
              <p className="sub">On-brand proposals, live acceptance tracking, and revenue you can see coming — all in one place built for people who run the whole show.</p>
            </div>

            <div className="cards">
              <div className="card card-revenue">
                <div className="clabel">Projected revenue · next 90 days</div>
                <div className="figure" id="revFig">£48,200</div>
                <div className="delta"><span id="revDelta">+18%</span> <span className="vs">vs last quarter</span></div>
                <div className="chart">
                  <svg viewBox="0 0 220 96" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#DCAA33" stopOpacity="0.28"/>
                        <stop offset="100%" stopColor="#DCAA33" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <path className="area" d="M0,80 C20,75 40,70 60,60 S100,40 130,35 S180,20 220,10 L220,96 L0,96 Z"/>
                    <path id="chartLine" className="chart-line" d="M0,80 C20,75 40,70 60,60 S100,40 130,35 S180,20 220,10"/>
                    <circle id="chartDot" className="chart-dot" cx="220" cy="10" r="4"/>
                  </svg>
                </div>
              </div>

              <div className="card">
                <div className="clabel">Proposals accepted · today</div>
                <div className="figure" id="acceptFig" style={{fontSize:30}}>9</div>
                <div className="feed-list" id="feed"></div>
              </div>

              <div className="card card-brand">
                <div className="clabel">Your brand · live</div>
                <div className="swatches" id="swatches" role="group" aria-label="Choose brand accent">
                  <button className="sw" style={{background:'#DCAA33'}} data-c="#DCAA33" aria-label="Gold" aria-pressed="true"></button>
                  <button className="sw" style={{background:'#3DB9C9'}} data-c="#3DB9C9" aria-label="Cyan" aria-pressed="false"></button>
                  <button className="sw" style={{background:'#7C6BE8'}} data-c="#7C6BE8" aria-label="Violet" aria-pressed="false"></button>
                  <button className="sw" style={{background:'#52C285'}} data-c="#52C285" aria-label="Emerald" aria-pressed="false"></button>
                  <button className="sw" style={{background:'#E8635C'}} data-c="#E8635C" aria-label="Coral" aria-pressed="false"></button>
                </div>
                <div className="ring-wrap">
                  <svg className="ring-svg" viewBox="0 0 40 40">
                    <circle className="track" cx="20" cy="20" r="16"/>
                    <circle className="val" id="ring" cx="20" cy="20" r="16" strokeDasharray="100.5" strokeDashoffset="27.1"/>
                  </svg>
                  <div>
                    <div className="rfig" id="rateFig">73%</div>
                    <div className="rlab">accept rate</div>
                  </div>
                </div>
                <p className="brand-hint">Pick a colour — your proposals, charts and logo restyle instantly.</p>
              </div>
            </div>

          </div>
        </section>

        {/* RIGHT PANEL */}
        <section className="form-col">
          <div className="form">
            <div className="step-label">Step 1 of 2 · Free</div>
            <h2>Create your account</h2>
            <p className="form-lead">Start free — no card required. Your first three proposals are on us.</p>

            <Link href="/sign-up" className="oauth" style={{textDecoration:'none'}}>
              <svg viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.1 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.2 13.7 17.6 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7C43.8 38 46.5 31.8 46.5 24.5z"/>
                <path fill="#FBBC05" d="M10.4 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.7l7.9-6.1z"/>
                <path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.3-5.7c-2 1.4-4.6 2.2-7.7 2.2-6.4 0-11.8-4.2-13.6-9.9l-7.9 6.1C6.4 42.6 14.6 48 24 48z"/>
              </svg>
              Continue with Google
            </Link>

            <div className="or-div">or</div>

            <div className="field">
              <label htmlFor="email">Work email</label>
              <div className="inp-wrap">
                <input id="email" type="email" autoComplete="email" placeholder="you@studio.com"/>
              </div>
            </div>

            <div className="field">
              <label htmlFor="pw">Password</label>
              <div className="inp-wrap">
                <input id="pw" type="password" autoComplete="new-password" placeholder="8+ characters"/>
                <button className="reveal-btn" type="button" id="reveal" aria-label="Show password">SHOW</button>
              </div>
            </div>

            <Link href="/sign-up" className="submit-btn" style={{textDecoration:'none'}}>
              <span>Create account</span>
              <span aria-hidden="true">→</span>
            </Link>

            <p className="fine">By creating an account you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy-policy">Privacy Policy</Link>.</p>
            <p className="switch-link">Already with us? <Link href="/sign-in">Sign in</Link></p>
          </div>
        </section>

      </div>
    </>
  );
}