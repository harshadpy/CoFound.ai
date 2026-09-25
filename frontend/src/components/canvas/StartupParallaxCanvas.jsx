import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * StartupParallaxCanvas
 * Integrated Three.js 3D floating intelligence cards & subtle white glitter network.
 * Features:
 * - Floating cards showcasing CoFound's real 11-agent architecture & core features:
 *   (Competitor Radar, Adversarial Critic, Trend Intelligence, Decision Authority, Autonomous Swarm, Market Validation)
 * - Subtle, delicate white glitter particles with soft twinkle effect ("not too much")
 * - Gyroscope & cursor-driven camera parallax with smooth lerp
 * - Peripheral layout with center fade-out mask to ensure zero clutter over central content
 * - Pointer-events-none so all interactions (typing, clicking) remain 100% unhindered
 * - Clean WebGL disposal on unmount
 */
export default function StartupParallaxCanvas({ className = '' }) {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 1000);
        camera.position.z = 24;

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
        } catch (e) {
            console.warn('WebGL not supported for background parallax:', e);
            return;
        }

        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        container.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
        scene.add(ambientLight);

        const dirLight1 = new THREE.DirectionalLight(0x6366f1, 1.6);
        dirLight1.position.set(15, 20, 15);
        scene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.2);
        dirLight2.position.set(-15, -10, 10);
        scene.add(dirLight2);

        const texturesToDispose = [];
        const materialsToDispose = [];
        const geometriesToDispose = [];

        // Texture generator helper to create clean UI cards / badges / chips
        function createCardCanvas(title, subtitle, tag, colorHex) {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            if (!ctx) return new THREE.CanvasTexture(canvas);

            function roundRect(x, y, width, height, radius) {
                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + width - radius, y);
                ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                ctx.lineTo(x + width, y + height - radius);
                ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                ctx.lineTo(x + radius, y + height);
                ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.closePath();
            }

            // Card base with subtle dark glass tint
            ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
            roundRect(10, 10, 492, 236, 24);
            ctx.fill();

            // Glass border
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = colorHex || 'rgba(99, 102, 241, 0.5)';
            ctx.stroke();

            // Subtle gradient header bar
            const grad = ctx.createLinearGradient(0, 0, 512, 0);
            grad.addColorStop(0, colorHex ? colorHex : 'rgba(59, 130, 246, 0.35)');
            grad.addColorStop(1, 'rgba(147, 51, 234, 0.12)');
            ctx.fillStyle = grad;
            roundRect(14, 14, 484, 42, 18);
            ctx.fill();

            // Tag / Badge
            ctx.fillStyle = colorHex || '#38bdf8';
            ctx.font = 'bold 21px system-ui, -apple-system, sans-serif';
            ctx.fillText(tag || 'COFOUND AGENT', 34, 43);

            // Card Content (Actual Feature / Agent Title)
            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 27px system-ui, -apple-system, sans-serif';
            ctx.fillText(title || 'Startup Intelligence', 34, 115);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '20px system-ui, -apple-system, sans-serif';
            ctx.fillText(subtitle || 'Real-time Agentic Insights', 34, 158);

            // Mini decorative metric bar / progress track
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            roundRect(34, 192, 444, 14, 7);
            ctx.fill();

            ctx.fillStyle = colorHex || '#6366f1';
            roundRect(34, 192, 280, 14, 7);
            ctx.fill();

            return new THREE.CanvasTexture(canvas);
        }

        // Real CoFound features & agents represented on peripheral 3D cards
        const cardData = [
            {
                tag: 'COMPETITOR RADAR',
                title: 'Competitor Moats & Gaps',
                subtitle: 'Tavily Web Search & Saturation Score',
                color: '#818cf8',
                pos: [-16.5, 9.2, -4],
                rot: [0.06, 0.24, -0.05]
            },
            {
                tag: 'ADVERSARIAL CRITIC',
                title: 'Fatal Flaws & Redlines',
                subtitle: 'Stress-Tests Founder Assumptions',
                color: '#f43f5e',
                pos: [17.0, 8.8, -5.5],
                rot: [-0.08, -0.26, 0.06]
            },
            {
                tag: 'TREND INTELLIGENCE',
                title: 'Market Size & CAGR',
                subtitle: 'Quant TAM Sizing & Growth Drivers',
                color: '#38bdf8',
                pos: [-17.2, -4.5, -3.5],
                rot: [0.10, 0.22, -0.04]
            },
            {
                tag: 'DECISION AUTHORITY',
                title: 'Go / Pivot / Kill Verdict',
                subtitle: 'Multi-Agent Institutional Consensus',
                color: '#10b981',
                pos: [17.5, -5.0, -4.5],
                rot: [-0.08, -0.20, 0.05]
            },
            {
                tag: 'AGENTIC SWARM',
                title: '11-Agent Parallel DAG',
                subtitle: 'LangGraph Streaming & Telemetry',
                color: '#a855f7',
                pos: [-6.0, 16.0, -8],
                rot: [0.14, 0.0, 0.02]
            },
            {
                tag: 'MARKET VALIDATION',
                title: 'Customer Pain Signals',
                subtitle: 'Willingness to Pay & Grounding Guardrails',
                color: '#f59e0b',
                pos: [7.0, -16.5, -7.5],
                rot: [-0.14, 0.05, -0.04]
            }
        ];

        const cards = [];
        const geom = new THREE.PlaneGeometry(6.2, 3.1);
        geometriesToDispose.push(geom);

        cardData.forEach((data, index) => {
            const texture = createCardCanvas(data.title, data.subtitle, data.tag, data.color);
            texturesToDispose.push(texture);

            const mat = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 0.44, // Clean non-intrusive backdrop
                side: THREE.DoubleSide
            });
            materialsToDispose.push(mat);

            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(...data.pos);
            mesh.rotation.set(...data.rot);

            mesh.userData = {
                baseX: data.pos[0],
                baseY: data.pos[1],
                baseZ: data.pos[2],
                baseRotX: data.rot[0],
                baseRotY: data.rot[1],
                baseRotZ: data.rot[2],
                phase: index * 1.05,
                speed: 0.55 + (index % 3) * 0.2,
                floatDist: 0.4 + (index % 2) * 0.3
            };

            scene.add(mesh);
            cards.push(mesh);
        });

        // ── Subtle White Glitter Particles ("not too much") ──
        function createGlitterTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
            grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.7)');
            grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.22)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 64, 64);

            return new THREE.CanvasTexture(canvas);
        }

        const glitterCount = 68; // Balanced count: subtle sparkle without overwhelming the canvas
        const glitterGeom = new THREE.BufferGeometry();
        geometriesToDispose.push(glitterGeom);

        const glitterPositions = new Float32Array(glitterCount * 3);
        for (let i = 0; i < glitterCount; i++) {
            glitterPositions[i * 3] = (Math.random() - 0.5) * 40;
            glitterPositions[i * 3 + 1] = (Math.random() - 0.5) * 30;
            glitterPositions[i * 3 + 2] = -2 + (Math.random() - 0.5) * 16;
        }
        glitterGeom.setAttribute('position', new THREE.BufferAttribute(glitterPositions, 3));

        const glitterTexture = createGlitterTexture();
        if (glitterTexture) texturesToDispose.push(glitterTexture);

        const glitterMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.36,
            map: glitterTexture,
            transparent: true,
            opacity: 0.52,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        materialsToDispose.push(glitterMat);

        const glitterPoints = new THREE.Points(glitterGeom, glitterMat);
        scene.add(glitterPoints);

        // Parallax tracking variables (smooth interpolated lerp)
        let targetMouseX = 0;
        let targetMouseY = 0;
        let mouseX = 0;
        let mouseY = 0;

        function onPointerMove(e) {
            if (prefersReducedMotion) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const winW = window.innerWidth;
            const winH = window.innerHeight;
            targetMouseX = (clientX / winW - 0.5) * 2;
            targetMouseY = (clientY / winH - 0.5) * 2;
        }

        window.addEventListener('mousemove', onPointerMove, { passive: true });
        window.addEventListener('touchmove', onPointerMove, { passive: true });

        // Gyroscope tilt parallax for mobile devices
        const handleOrientation = (e) => {
            if (prefersReducedMotion) return;
            if (e.gamma !== null && e.beta !== null) {
                targetMouseX = Math.min(Math.max(e.gamma / 35, -1), 1);
                targetMouseY = Math.min(Math.max((e.beta - 40) / 35, -1), 1);
            }
        };

        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleOrientation, { passive: true });
        }

        // Window resize handler
        function onResize() {
            if (!container) return;
            const currentW = container.clientWidth || window.innerWidth;
            const currentH = container.clientHeight || window.innerHeight;
            camera.aspect = currentW / currentH;
            camera.updateProjectionMatrix();
            renderer.setSize(currentW, currentH);
        }
        window.addEventListener('resize', onResize);

        // Animation Loop
        const clock = new THREE.Clock();
        let animationFrameId;

        function animate() {
            animationFrameId = requestAnimationFrame(animate);
            const time = clock.getElapsedTime();

            if (!prefersReducedMotion) {
                // Smooth lerp for parallax response
                mouseX += (targetMouseX - mouseX) * 0.05;
                mouseY += (targetMouseY - mouseY) * 0.05;

                // Move camera slightly for parallax depth
                camera.position.x = mouseX * 2.6;
                camera.position.y = -mouseY * 2.0;
                camera.lookAt(0, 0, 0);

                // Animate floating startup cards
                cards.forEach((card) => {
                    const u = card.userData;
                    card.position.y = u.baseY + Math.sin(time * u.speed + u.phase) * u.floatDist - (mouseY * 1.6);
                    card.position.x = u.baseX + Math.cos(time * u.speed * 0.8 + u.phase) * (u.floatDist * 0.6) - (mouseX * 2.2);

                    card.rotation.x = u.baseRotX + Math.sin(time * 0.5 + u.phase) * 0.04 + mouseY * 0.18;
                    card.rotation.y = u.baseRotY + Math.cos(time * 0.5 + u.phase) * 0.04 + mouseX * 0.22;
                });

                // Delicate white glitter shimmer and slow ambient float
                glitterMat.opacity = 0.42 + Math.sin(time * 1.5) * 0.14;
                glitterPoints.rotation.y = time * 0.014 + mouseX * 0.07;
                glitterPoints.rotation.x = -time * 0.009 - mouseY * 0.05;
            }

            renderer.render(scene, camera);
        }

        animate();

        // Cleanup on unmount
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('mousemove', onPointerMove);
            window.removeEventListener('touchmove', onPointerMove);
            if (window.DeviceOrientationEvent) {
                window.removeEventListener('deviceorientation', handleOrientation);
            }
            window.removeEventListener('resize', onResize);

            // Dispose WebGL resources
            texturesToDispose.forEach(t => t.dispose());
            materialsToDispose.forEach(m => m.dispose());
            geometriesToDispose.forEach(g => g.dispose());
            renderer.dispose();
            if (renderer.domElement && renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            aria-hidden="true"
            style={{
                WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 32%, rgba(0,0,0,0.85) 72%)',
                maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 32%, rgba(0,0,0,0.85) 72%)',
            }}
            className={`fixed inset-0 left-0 md:left-14 lg:left-64 pointer-events-none z-0 overflow-hidden select-none transition-opacity duration-700 ${className}`}
        />
    );
}
