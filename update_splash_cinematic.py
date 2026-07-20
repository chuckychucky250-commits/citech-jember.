import json
import re

# Load Jember GeoJSON for map
with open('frontend/public/data/jember-batas.geojson') as f:
    data = json.load(f)

geom = data['features'][0]['geometry']
coords = geom['coordinates']
if geom['type'] != 'MultiPolygon':
    coords = [coords]

min_x = min_y = float('inf')
max_x = max_y = float('-inf')

for p in coords:
    for r in p:
        for x,y in r:
            min_x = min(min_x, x)
            max_x = max(max_x, x)
            min_y = min(min_y, y)
            max_y = max(max_y, y)

w = max_x - min_x
h = max_y - min_y
s = 100 / max(w,h)

paths = []
for p in coords:
    for r in p:
        ps = []
        for i, (x,y) in enumerate(r):
            sx = (x - min_x) * s
            sy = (max_y - y) * s
            cmd = 'M' if i == 0 else 'L'
            ps.append(f'{cmd}{sx:.2f},{sy:.2f}')
        paths.append(' '.join(ps) + ' Z')

map_path = " ".join(paths)

new_splash = f'''    <!-- Splash Screen -->
    <style>
        /* ===== SPLASH SCREEN ANIMATIONS ===== */
        
        /* Floating particles */
        @keyframes float-up {{
            0% {{ transform: translateY(100vh) translateX(0px); opacity: 0; }}
            10% {{ opacity: 1; }}
            90% {{ opacity: 0.6; }}
            100% {{ transform: translateY(-100px) translateX(var(--drift, 30px)); opacity: 0; }}
        }}
        
        /* Rotating aurora/nebula */
        @keyframes aurora-rotate {{
            0% {{ transform: rotate(0deg) scale(1); opacity: 0.3; }}
            50% {{ transform: rotate(180deg) scale(1.15); opacity: 0.5; }}
            100% {{ transform: rotate(360deg) scale(1); opacity: 0.3; }}
        }}
        
        /* Pulsing glow */
        @keyframes glow-pulse {{
            0%, 100% {{ opacity: 0.4; transform: scale(1); }}
            50% {{ opacity: 0.8; transform: scale(1.05); }}
        }}
        
        /* Map breathing */
        @keyframes map-breathe {{
            0%, 100% {{ opacity: 0.15; transform: scale(1) rotate(0deg); }}
            50% {{ opacity: 0.25; transform: scale(1.02) rotate(0.5deg); }}
        }}
        
        /* Scanning line */
        @keyframes scan-line {{
            0% {{ transform: translateY(-100%); opacity: 0; }}
            10% {{ opacity: 0.6; }}
            90% {{ opacity: 0.6; }}
            100% {{ transform: translateY(200%); opacity: 0; }}
        }}
        
        /* Reveal text */
        @keyframes reveal-up {{
            from {{ opacity: 0; transform: translateY(25px); filter: blur(4px); }}
            to {{ opacity: 1; transform: translateY(0); filter: blur(0); }}
        }}
        
        /* Ripple on button */
        @keyframes ring-expand {{
            0% {{ transform: scale(1); opacity: 0.5; }}
            100% {{ transform: scale(2.5); opacity: 0; }}
        }}

        /* Shooting star */
        @keyframes shoot {{
            0% {{ transform: translateX(0) translateY(0); opacity: 1; width: 0px; }}
            50% {{ opacity: 1; width: 80px; }}
            100% {{ transform: translateX(200px) translateY(60px); opacity: 0; width: 0px; }}
        }}

        /* Twinkling */
        @keyframes twinkle {{
            0%, 100% {{ opacity: 0.2; transform: scale(0.8); }}
            50% {{ opacity: 1; transform: scale(1.2); }}
        }}
        
        .splash-particle {{
            position: absolute;
            border-radius: 50%;
            animation: float-up linear infinite;
            pointer-events: none;
        }}
        
        .reveal-1 {{ animation: reveal-up 0.9s cubic-bezier(0.16,1,0.3,1) 0.3s both; }}
        .reveal-2 {{ animation: reveal-up 0.9s cubic-bezier(0.16,1,0.3,1) 0.55s both; }}
        .reveal-3 {{ animation: reveal-up 0.9s cubic-bezier(0.16,1,0.3,1) 0.75s both; }}
        .reveal-4 {{ animation: reveal-up 0.9s cubic-bezier(0.16,1,0.3,1) 1.0s both; }}
        
        #splashScreen.hiding {{
            opacity: 0 !important;
            pointer-events: none;
            transition: opacity 0.8s ease !important;
        }}
    </style>
    
    <div id="splashScreen" class="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden" style="background: #020818;">
        
        <!-- ===== ANIMATED BACKGROUND LAYERS ===== -->
        
        <!-- Layer 1: Base radial gradient (deep space) -->
        <div class="absolute inset-0" style="background: radial-gradient(ellipse 80% 60% at 50% 40%, rgba(15,30,80,1) 0%, rgba(5,10,30,1) 50%, #020818 100%);"></div>
        
        <!-- Layer 2: Aurora nebula blob - top left -->
        <div class="absolute pointer-events-none" style="top:-20%;left:-15%;width:70vw;height:70vw;max-width:600px;max-height:600px;background:radial-gradient(circle, rgba(6,182,212,0.18) 0%, rgba(37,99,235,0.12) 40%, transparent 70%);animation:aurora-rotate 18s linear infinite;border-radius:50%;"></div>
        
        <!-- Layer 3: Aurora blob - bottom right -->
        <div class="absolute pointer-events-none" style="bottom:-20%;right:-15%;width:60vw;height:60vw;max-width:500px;max-height:500px;background:radial-gradient(circle, rgba(245,158,11,0.12) 0%, rgba(220,38,38,0.08) 40%, transparent 70%);animation:aurora-rotate 22s linear infinite reverse;border-radius:50%;"></div>
        
        <!-- Layer 4: Center glow -->
        <div class="absolute pointer-events-none" style="top:50%;left:50%;transform:translate(-50%,-50%);width:50vw;height:50vw;max-width:400px;max-height:400px;background:radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 65%);animation:glow-pulse 4s ease-in-out infinite;border-radius:50%;"></div>
        
        <!-- Layer 5: Jember map watermark -->
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none" style="animation:map-breathe 6s ease-in-out infinite;">
            <svg viewBox="-20 -20 140 140" class="w-[90vw] h-[90vw] md:w-[55vw] md:h-[55vw]" style="max-width:600px;max-height:600px;" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="mapGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="rgba(6,182,212,0.4)"/>
                        <stop offset="50%" stop-color="rgba(56,189,248,0.15)"/>
                        <stop offset="100%" stop-color="rgba(14,165,233,0.0)"/>
                    </linearGradient>
                    <filter id="mapBloom" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="1.5" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                </defs>
                <path d="{map_path}" fill="url(#mapGrad1)" stroke="rgba(6,182,212,0.5)" stroke-width="0.4" filter="url(#mapBloom)"/>
            </svg>
        </div>

        <!-- Layer 6: Scanning horizontal line -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <div style="position:absolute;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(6,182,212,0.6),rgba(56,189,248,0.8),rgba(6,182,212,0.6),transparent);animation:scan-line 5s ease-in-out 1s infinite;box-shadow:0 0 12px 3px rgba(6,182,212,0.4);"></div>
        </div>
        
        <!-- Layer 7: Static star field -->
        <div class="absolute inset-0 pointer-events-none" id="starField">
            <!-- Stars hardcoded for performance -->
            <div style="position:absolute;top:8%;left:12%;width:2px;height:2px;background:#fff;border-radius:50%;animation:twinkle 3.1s ease-in-out infinite;"></div>
            <div style="position:absolute;top:15%;left:72%;width:1px;height:1px;background:#a5f3fc;border-radius:50%;animation:twinkle 2.4s ease-in-out 0.5s infinite;"></div>
            <div style="position:absolute;top:23%;left:35%;width:2px;height:2px;background:#93c5fd;border-radius:50%;animation:twinkle 4s ease-in-out 1s infinite;"></div>
            <div style="position:absolute;top:31%;left:88%;width:1px;height:1px;background:#fde68a;border-radius:50%;animation:twinkle 2.7s ease-in-out 0.3s infinite;"></div>
            <div style="position:absolute;top:42%;left:5%;width:2px;height:2px;background:#fff;border-radius:50%;animation:twinkle 3.5s ease-in-out 0.8s infinite;"></div>
            <div style="position:absolute;top:55%;left:60%;width:1px;height:1px;background:#a5f3fc;border-radius:50%;animation:twinkle 2.2s ease-in-out 1.2s infinite;"></div>
            <div style="position:absolute;top:67%;left:25%;width:2px;height:2px;background:#93c5fd;border-radius:50%;animation:twinkle 3.8s ease-in-out 0.1s infinite;"></div>
            <div style="position:absolute;top:78%;left:80%;width:1px;height:1px;background:#fff;border-radius:50%;animation:twinkle 2.9s ease-in-out 0.6s infinite;"></div>
            <div style="position:absolute;top:85%;left:45%;width:2px;height:2px;background:#fcd34d;border-radius:50%;animation:twinkle 4.1s ease-in-out 0.9s infinite;"></div>
            <div style="position:absolute;top:92%;left:18%;width:1px;height:1px;background:#a5f3fc;border-radius:50%;animation:twinkle 2.6s ease-in-out 0.4s infinite;"></div>
            <div style="position:absolute;top:5%;left:55%;width:1px;height:1px;background:#fff;border-radius:50%;animation:twinkle 3.3s ease-in-out 1.5s infinite;"></div>
            <div style="position:absolute;top:48%;left:92%;width:2px;height:2px;background:#93c5fd;border-radius:50%;animation:twinkle 2.8s ease-in-out 0.7s infinite;"></div>
        </div>
        
        <!-- Layer 8: Floating particles (JS generated) -->
        <canvas id="particleCanvas" class="absolute inset-0 pointer-events-none" style="width:100%;height:100%;"></canvas>
        
        <!-- ===== MAIN CONTENT ===== -->
        <div class="relative z-10 flex flex-col items-center text-center px-6 max-w-lg w-full mx-auto">
            
            <!-- Badge -->
            <div class="reveal-1 mb-6 md:mb-8">
                <span style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:999px;border:1px solid rgba(6,182,212,0.4);background:rgba(6,182,212,0.08);color:rgba(165,243,252,0.9);font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">
                    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#22d3ee;box-shadow:0 0 8px #22d3ee;animation:twinkle 1.5s ease-in-out infinite;"></span>
                    Kabupaten Jember
                </span>
            </div>
            
            <!-- Title -->
            <div class="reveal-2 mb-4 md:mb-5">
                <h1 style="font-family:Georgia,serif;font-size:clamp(2.2rem,7vw,3.8rem);font-weight:700;color:#ffffff;line-height:1.1;letter-spacing:-0.02em;text-shadow:0 0 40px rgba(56,189,248,0.3);">
                    Arsip Memori<br>
                    <span style="background:linear-gradient(135deg,#38bdf8 0%,#22d3ee 40%,#67e8f9 70%,#fbbf24 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Sejarah Jember</span>
                </h1>
            </div>
            
            <!-- Divider line -->
            <div class="reveal-3 w-full mb-5 md:mb-7" style="max-width:320px;">
                <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(6,182,212,0.7),rgba(251,191,36,0.5),transparent);box-shadow:0 0 8px rgba(6,182,212,0.4);"></div>
            </div>
            
            <!-- Description -->
            <div class="reveal-3">
                <p style="color:rgba(186,230,253,0.75);font-size:clamp(0.85rem,2.5vw,1rem);line-height:1.7;max-width:380px;margin:0 auto 2rem;">
                    Platform interaktif untuk menelusuri, mempelajari, dan turut mencatat memori kolektif Kabupaten Jember — jejak sejarah, bencana, dan pergerakan sosial.
                </p>
            </div>
            
            <!-- CTA Button -->
            <div class="reveal-4" style="position:relative;">
                <!-- Ring animation -->
                <div style="position:absolute;inset:-4px;border-radius:999px;border:1px solid rgba(245,158,11,0.4);animation:ring-expand 2.5s ease-out 1.5s infinite;"></div>
                <button id="startExploreBtn" style="position:relative;display:inline-flex;align-items:center;gap:10px;padding:14px 32px;border-radius:999px;background:linear-gradient(135deg,#f59e0b,#fbbf24,#f59e0b);color:#0c0a00;font-weight:700;font-size:0.9rem;letter-spacing:0.06em;text-transform:uppercase;border:none;cursor:pointer;box-shadow:0 0 30px rgba(245,158,11,0.35),0 4px 20px rgba(0,0,0,0.4);transition:all 0.3s ease;min-width:200px;justify-content:center;"
                    onmouseover="this.style.transform='scale(1.05)';this.style.boxShadow='0 0 50px rgba(245,158,11,0.55),0 8px 30px rgba(0,0,0,0.5)';"
                    onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 0 30px rgba(245,158,11,0.35),0 4px 20px rgba(0,0,0,0.4)';">
                    <span>Mulai Jelajahi</span>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </button>
            </div>
        </div>
    </div>
    
    <!-- Particle animation script -->
    <script>
        (function() {{
            const canvas = document.getElementById('particleCanvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            let W = canvas.width = window.innerWidth;
            let H = canvas.height = window.innerHeight;
            
            window.addEventListener('resize', () => {{
                W = canvas.width = window.innerWidth;
                H = canvas.height = window.innerHeight;
            }});
            
            // Particle colors: cyan, blue, amber
            const colors = [
                'rgba(34,211,238,', // cyan
                'rgba(96,165,250,', // blue
                'rgba(251,191,36,', // amber
                'rgba(167,243,252,', // light cyan
            ];
            
            const particles = [];
            const MAX_P = 60;
            
            function createParticle() {{
                return {{
                    x: Math.random() * W,
                    y: H + Math.random() * 100,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: -(Math.random() * 1.2 + 0.4),
                    size: Math.random() * 2.5 + 0.5,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    opacity: 0,
                    maxOpacity: Math.random() * 0.7 + 0.2,
                    life: 0,
                    maxLife: Math.random() * 300 + 150,
                }};
            }}
            
            for (let i = 0; i < MAX_P; i++) {{
                const p = createParticle();
                p.y = Math.random() * H; // scatter initial
                p.life = Math.floor(Math.random() * p.maxLife);
                particles.push(p);
            }}
            
            let animId;
            function animate() {{
                ctx.clearRect(0, 0, W, H);
                for (let i = 0; i < particles.length; i++) {{
                    const p = particles[i];
                    p.life++;
                    p.x += p.vx;
                    p.y += p.vy;
                    
                    // Fade in / fade out
                    const progress = p.life / p.maxLife;
                    if (progress < 0.15) p.opacity = (progress / 0.15) * p.maxOpacity;
                    else if (progress > 0.8) p.opacity = ((1 - progress) / 0.2) * p.maxOpacity;
                    else p.opacity = p.maxOpacity;
                    
                    // Draw particle
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = p.color + p.opacity + ')';
                    ctx.fill();
                    
                    // Glow
                    if (p.size > 1.5) {{
                        ctx.beginPath();
                        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
                        grad.addColorStop(0, p.color + (p.opacity * 0.4) + ')');
                        grad.addColorStop(1, p.color + '0)');
                        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
                        ctx.fillStyle = grad;
                        ctx.fill();
                    }}
                    
                    if (p.life >= p.maxLife || p.y < -20) {{
                        particles[i] = createParticle();
                    }}
                }}
                animId = requestAnimationFrame(animate);
            }}
            
            animate();
            
            // Stop animation when splash hides
            document.getElementById('startExploreBtn').addEventListener('click', function() {{
                cancelAnimationFrame(animId);
            }});
        }})();
    </script>

\n\n'''

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find and replace splash screen section
splash_start = '    <!-- Splash Screen -->'
splash_end = '    <!-- Onboarding Toast -->'

start_idx = html.find(splash_start)
end_idx = html.find(splash_end)

if start_idx != -1 and end_idx != -1:
    html = html[:start_idx] + new_splash + html[end_idx:]
    with open('frontend/index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("SUCCESS: Cinematic animated splash screen applied!")
else:
    print(f"ERROR: Could not find markers. start={start_idx}, end={end_idx}")
    # Debug: show what's around where it should be
    idx = html.find('splashScreen')
    if idx != -1:
        print("Found splashScreen at:", idx)
        print(html[max(0,idx-100):idx+200])
