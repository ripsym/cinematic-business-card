"use client";

import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

/* ===== Timing Constants ===== */
const T = {
    BLACK: 0.5,
    WAKE_START: 0.5,
    WAKE_END: 1.5,
    CONVERGE_START: 1.5,
    CONVERGE_END: 2.7,
    SWEEP_START: 2.7,
    SWEEP_END: 3.1,
    DISSOLVE_START: 3.1,
    DISSOLVE_END: 3.9,
    RECEDE_START: 3.9,
    RECEDE_END: 5.2,
};

/* ===== Adaptive Quality ===== */
interface QualityConfig {
    particleCount: number;
    dpr: number;
}

function getQualityConfig(): QualityConfig {
    let particleCount = 1200;
    const conn = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
    const effectiveType = conn?.effectiveType;

    if (effectiveType === "4g") {
        particleCount = 1200;
    } else if (effectiveType === "3g" || !effectiveType) {
        particleCount = 700;
    } else {
        particleCount = 500;
    }

    // Respect reduced motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
        particleCount = 0; // Will trigger fallback
    }

    const dpr = Math.min(1.5, window.devicePixelRatio || 1);

    return { particleCount, dpr };
}

/* ===== Hello Letter Points ===== */
const LETTER_COLORS = [
    new THREE.Color("#4F8CFF"),
    new THREE.Color("#9B5CF6"),
    new THREE.Color("#3DDCFF"),
    new THREE.Color("#FF5DA2"),
    new THREE.Color("#FF9F40"),
    new THREE.Color("#ffffff"),
];

function generateLetterPoints(): { points: THREE.Vector3[]; letterIdx: number }[] {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = 400;
    canvas.height = 100;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 400, 100);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 64px system-ui, -apple-system, sans-serif";
    ctx.fillText("Hello.", 200, 50);

    const imageData = ctx.getImageData(0, 0, 400, 100);
    const data = imageData.data;

    const word = "Hello.";
    const metrics: number[] = [];
    for (const ch of word) metrics.push(ctx.measureText(ch).width);
    const totalWidth = metrics.reduce((a, b) => a + b, 0);
    let xCursor = 200 - totalWidth / 2;
    const bounds: { xMin: number; xMax: number }[] = [];
    for (let i = 0; i < word.length; i++) {
        bounds.push({ xMin: xCursor, xMax: xCursor + metrics[i] });
        xCursor += metrics[i];
    }

    const results: { points: THREE.Vector3[]; letterIdx: number }[] = [];
    const step = 3;
    for (let y = 0; y < 100; y += step) {
        for (let x = 0; x < 400; x += step) {
            const idx = (y * 400 + x) * 4;
            if (data[idx] > 128) {
                for (let li = 0; li < bounds.length; li++) {
                    if (x >= bounds[li].xMin && x < bounds[li].xMax) {
                        results.push({
                            points: [new THREE.Vector3((x - 200) * 0.018, (50 - y) * 0.018, 0)],
                            letterIdx: li,
                        });
                        break;
                    }
                }
            }
        }
    }
    return results;
}

/* ===== Phase Callbacks ===== */
export interface PhaseCallbacks {
    onIdentityStart: () => void;
    onCardStart: () => void;
}

/* ===== Main Component ===== */
export function ParticleScene({ onPhase }: { onPhase: PhaseCallbacks }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const onPhaseRef = useRef(onPhase);
    onPhaseRef.current = onPhase;

    const init = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        const config = getQualityConfig();
        if (config.particleCount === 0) {
            // Reduced motion: fire phases on timers, no WebGL
            const t1 = setTimeout(() => onPhaseRef.current.onIdentityStart(), T.DISSOLVE_START * 1000);
            const t2 = setTimeout(() => onPhaseRef.current.onCardStart(), T.RECEDE_START * 1000);
            return () => { clearTimeout(t1); clearTimeout(t2); };
        }

        const PARTICLE_COUNT = config.particleCount;

        // Renderer
        let renderer: THREE.WebGLRenderer;
        try {
            renderer = new THREE.WebGLRenderer({
                antialias: false,
                alpha: true,
                powerPreference: "high-performance",
            });
        } catch {
            // WebGL failed — fire phases on timers
            const t1 = setTimeout(() => onPhaseRef.current.onIdentityStart(), T.DISSOLVE_START * 1000);
            const t2 = setTimeout(() => onPhaseRef.current.onCardStart(), T.RECEDE_START * 1000);
            return () => { clearTimeout(t1); clearTimeout(t2); };
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            50, window.innerWidth / window.innerHeight, 0.1, 100
        );
        camera.position.set(0, 0, 10);

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(config.dpr);
        container.appendChild(renderer.domElement);

        // Generate letter targets
        const letterData = generateLetterPoints();

        // Build particles
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(PARTICLE_COUNT * 3);
        const colors = new Float32Array(PARTICLE_COUNT * 3);
        const sizes = new Float32Array(PARTICLE_COUNT);

        interface PData {
            home: THREE.Vector3;
            li: number; // letterIdx, -1 = ambient
            offset: THREE.Vector3;
            speed: number;
        }
        const pd: PData[] = [];

        // Assign particles to letters
        const letterParticleCount = Math.floor(PARTICLE_COUNT * 0.8);
        for (let i = 0; i < letterParticleCount; i++) {
            const ld = letterData[i % letterData.length];
            const home = ld.points[0];
            const col = LETTER_COLORS[ld.letterIdx];

            // Start scattered
            positions[i * 3] = (Math.random() - 0.5) * 18;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
            positions[i * 3 + 2] = -8 - Math.random() * 12;

            colors[i * 3] = col.r;
            colors[i * 3 + 1] = col.g;
            colors[i * 3 + 2] = col.b;
            sizes[i] = 1 + Math.random() * 1.5;

            pd.push({
                home: home.clone(),
                li: ld.letterIdx,
                offset: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.12,
                    (Math.random() - 0.5) * 0.12,
                    (Math.random() - 0.5) * 0.08
                ),
                speed: 0.7 + Math.random() * 0.5,
            });
        }

        // Ambient particles
        for (let i = letterParticleCount; i < PARTICLE_COUNT; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 25;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
            positions[i * 3 + 2] = -5 - Math.random() * 15;

            colors[i * 3] = 0.25 + Math.random() * 0.15;
            colors[i * 3 + 1] = 0.25 + Math.random() * 0.15;
            colors[i * 3 + 2] = 0.35 + Math.random() * 0.15;
            sizes[i] = 0.5 + Math.random();

            pd.push({
                home: new THREE.Vector3(
                    (Math.random() - 0.5) * 12,
                    (Math.random() - 0.5) * 8,
                    -3 - Math.random() * 6
                ),
                li: -1,
                offset: new THREE.Vector3(
                    (Math.random() - 0.5) * 1.5,
                    (Math.random() - 0.5) * 1.5,
                    (Math.random() - 0.5) * 1
                ),
                speed: 0.2 + Math.random() * 0.3,
            });
        }

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

        // Shader material (minimal)
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uOpacity: { value: 0 },
                uDpr: { value: config.dpr },
            },
            vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float uDpr;
        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = clamp(size * uDpr * (6.0 / -mv.z), 1.0, 10.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
            fragmentShader: `
        varying vec3 vColor;
        uniform float uOpacity;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.08, d) * uOpacity;
          gl_FragColor = vec4(vColor, a);
        }
      `,
            transparent: true,
            vertexColors: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);

        const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
        const sizeAttr = geometry.getAttribute("size") as THREE.BufferAttribute;
        const startTime = performance.now();
        let identityFired = false;
        let cardFired = false;
        let animId = 0;

        const animate = () => {
            animId = requestAnimationFrame(animate);
            const t = (performance.now() - startTime) / 1000;

            // Phase 0: Black
            if (t < T.BLACK) {
                material.uniforms.uOpacity.value = 0;
                renderer.render(scene, camera);
                return;
            }

            // Phase 1: Wake
            if (t < T.WAKE_END) {
                const p = (t - T.WAKE_START) / (T.WAKE_END - T.WAKE_START);
                material.uniforms.uOpacity.value = p * 0.35;
                camera.position.z = 10 - p * 1;
            }
            // Phase 2: Converge
            else if (t < T.CONVERGE_END) {
                const raw = (t - T.CONVERGE_START) / (T.CONVERGE_END - T.CONVERGE_START);
                const ease = 1 - Math.pow(1 - raw, 3);
                material.uniforms.uOpacity.value = 0.35 + ease * 0.65;
                camera.position.z = 9 - ease * 1.5;

                for (let i = 0; i < pd.length; i++) {
                    if (pd[i].li < 0) continue;
                    const h = pd[i].home;
                    const s = pd[i].speed;
                    const micro = (1 - ease) * 0.04;
                    const mx = Math.sin(t * s * 2 + i) * micro;
                    const my = Math.cos(t * s * 1.7 + i * 0.5) * micro;

                    positions[i * 3] += (h.x + pd[i].offset.x * (1 - ease) + mx - positions[i * 3]) * ease * 0.06 * s;
                    positions[i * 3 + 1] += (h.y + pd[i].offset.y * (1 - ease) + my - positions[i * 3 + 1]) * ease * 0.06 * s;
                    positions[i * 3 + 2] += (h.z - positions[i * 3 + 2]) * ease * 0.08 * s;
                }
            }
            // Phase 3: Sweep
            else if (t < T.SWEEP_END) {
                material.uniforms.uOpacity.value = 1;
                const sp = (t - T.SWEEP_START) / (T.SWEEP_END - T.SWEEP_START);
                const sweepX = -5 + sp * 10;

                for (let i = 0; i < pd.length; i++) {
                    if (pd[i].li < 0) continue;
                    // Micro jitter
                    positions[i * 3] = pd[i].home.x + Math.sin(t * pd[i].speed + i) * 0.02;
                    positions[i * 3 + 1] = pd[i].home.y + Math.cos(t * pd[i].speed * 1.3 + i) * 0.02;
                    positions[i * 3 + 2] = Math.sin(t * 0.7 + i) * 0.01;

                    // Sweep glow
                    const dist = Math.abs(positions[i * 3] - sweepX);
                    if (dist < 1.2) {
                        sizeAttr.array[i] = (1 + Math.random() * 1.5) * (1 + (1 - dist / 1.2) * 1.8);
                    }
                }
                sizeAttr.needsUpdate = true;
            }
            // Phase 4: Dissolve
            else if (t < T.DISSOLVE_END) {
                const p = (t - T.DISSOLVE_START) / (T.DISSOLVE_END - T.DISSOLVE_START);
                material.uniforms.uOpacity.value = Math.max(0, 1 - p * 1.3);

                if (!identityFired) {
                    identityFired = true;
                    onPhaseRef.current.onIdentityStart();
                }

                for (let i = 0; i < pd.length; i++) {
                    if (pd[i].li < 0) continue;
                    positions[i * 3] += pd[i].offset.x * p * 0.4;
                    positions[i * 3 + 1] += pd[i].offset.y * p * 0.4;
                    positions[i * 3 + 2] += (Math.random() - 0.5) * p * 0.06;
                }
            }
            // Phase 5: Recede
            else if (t < T.RECEDE_END) {
                const p = (t - T.RECEDE_START) / (T.RECEDE_END - T.RECEDE_START);
                material.uniforms.uOpacity.value = Math.max(0, 0.25 - p * 0.2);

                if (!cardFired) {
                    cardFired = true;
                    onPhaseRef.current.onCardStart();
                }
            }
            // Idle
            else {
                material.uniforms.uOpacity.value = 0.05;
                for (let i = 0; i < pd.length; i++) {
                    if (pd[i].li >= 0) continue;
                    const s = t * 0.15 * pd[i].speed;
                    positions[i * 3] = pd[i].home.x + Math.sin(s + i * 0.1) * 0.4;
                    positions[i * 3 + 1] = pd[i].home.y + Math.cos(s * 0.7 + i * 0.2) * 0.25;
                    positions[i * 3 + 2] = pd[i].home.z + Math.sin(s * 0.4 + i) * 0.2;
                }
            }

            posAttr.needsUpdate = true;
            renderer.render(scene, camera);
        };

        animate();

        const onResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener("resize", onResize);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", onResize);
            renderer.dispose();
            geometry.dispose();
            material.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    useEffect(() => {
        const cleanup = init();
        return cleanup;
    }, [init]);

    return (
        <div
            ref={containerRef}
            style={{ position: "fixed", inset: 0, zIndex: 0 }}
        />
    );
}
