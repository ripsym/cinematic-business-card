"use client";

import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

/* ===== Timing ===== */
const T = {
    BLACK: 0.5,
    LIGHT_START: 0.5,
    LIGHT_END: 1.5,
    CONVERGE_START: 1.5,
    CONVERGE_END: 2.8,
    SWEEP_START: 2.8,
    SWEEP_END: 3.4,
    DISSOLVE_START: 3.4,
    DISSOLVE_END: 4.4,
    RECEDE_START: 4.4,
    RECEDE_END: 5.8,
};

/* ===== Hello Letter Positions ===== */
const LETTERS = [
    { char: "H", color: new THREE.Color("#4F8CFF"), points: [] as THREE.Vector3[] },
    { char: "e", color: new THREE.Color("#9B5CF6"), points: [] as THREE.Vector3[] },
    { char: "l", color: new THREE.Color("#3DDCFF"), points: [] as THREE.Vector3[] },
    { char: "l", color: new THREE.Color("#FF5DA2"), points: [] as THREE.Vector3[] },
    { char: "o", color: new THREE.Color("#FF9F40"), points: [] as THREE.Vector3[] },
    { char: ".", color: new THREE.Color("#ffffff"), points: [] as THREE.Vector3[] },
];

/* Generate letter point positions from canvas sampling */
function generateLetterPoints() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = 512;
    canvas.height = 128;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 80px system-ui, -apple-system, sans-serif";
    ctx.fillText("Hello.", 256, 64);

    const imageData = ctx.getImageData(0, 0, 512, 128);
    const data = imageData.data;

    // Find bounding boxes for each letter
    const letterBounds: { xMin: number; xMax: number }[] = [];
    const word = "Hello.";
    const metrics: number[] = [];
    for (const ch of word) {
        metrics.push(ctx.measureText(ch).width);
    }
    const totalWidth = metrics.reduce((a, b) => a + b, 0);
    let xCursor = 256 - totalWidth / 2;
    for (let i = 0; i < word.length; i++) {
        letterBounds.push({ xMin: xCursor, xMax: xCursor + metrics[i] });
        xCursor += metrics[i];
    }

    // Sample white pixels and assign to letters
    const step = 3;
    for (let y = 0; y < 128; y += step) {
        for (let x = 0; x < 512; x += step) {
            const idx = (y * 512 + x) * 4;
            if (data[idx] > 128) {
                // Find letter
                for (let li = 0; li < letterBounds.length; li++) {
                    if (x >= letterBounds[li].xMin && x < letterBounds[li].xMax) {
                        const px = (x - 256) * 0.02;
                        const py = (64 - y) * 0.02;
                        LETTERS[li].points.push(new THREE.Vector3(px, py, 0));
                        break;
                    }
                }
            }
        }
    }
}

/* ===== Particle System ===== */
const PARTICLE_COUNT = 1200;

interface ParticleData {
    homePos: THREE.Vector3;
    letterIdx: number;
    randomOffset: THREE.Vector3;
    speed: number;
}

function createParticleSystem(scene: THREE.Scene) {
    generateLetterPoints();

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const particleData: ParticleData[] = [];

    // Distribute particles among letters
    let totalLetterPoints = 0;
    for (const l of LETTERS) totalLetterPoints += l.points.length;

    let pi = 0;
    for (let li = 0; li < LETTERS.length; li++) {
        const letter = LETTERS[li];
        const count = Math.floor(
            (letter.points.length / Math.max(totalLetterPoints, 1)) * PARTICLE_COUNT * 0.85
        );
        for (let i = 0; i < count && pi < PARTICLE_COUNT; i++) {
            const pt = letter.points[i % letter.points.length];
            // Start scattered far away
            const scatter = 20;
            positions[pi * 3] = (Math.random() - 0.5) * scatter;
            positions[pi * 3 + 1] = (Math.random() - 0.5) * scatter;
            positions[pi * 3 + 2] = (Math.random() - 0.5) * scatter - 15;

            colors[pi * 3] = letter.color.r;
            colors[pi * 3 + 1] = letter.color.g;
            colors[pi * 3 + 2] = letter.color.b;

            sizes[pi] = Math.random() * 2 + 1;

            particleData.push({
                homePos: pt.clone(),
                letterIdx: li,
                randomOffset: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.15,
                    (Math.random() - 0.5) * 0.15,
                    (Math.random() - 0.5) * 0.15
                ),
                speed: 0.8 + Math.random() * 0.4,
            });
            pi++;
        }
    }

    // Ambient particles (not assigned to letters)
    while (pi < PARTICLE_COUNT) {
        positions[pi * 3] = (Math.random() - 0.5) * 30;
        positions[pi * 3 + 1] = (Math.random() - 0.5) * 20;
        positions[pi * 3 + 2] = (Math.random() - 0.5) * 30 - 10;

        colors[pi * 3] = 0.3 + Math.random() * 0.2;
        colors[pi * 3 + 1] = 0.3 + Math.random() * 0.2;
        colors[pi * 3 + 2] = 0.4 + Math.random() * 0.2;

        sizes[pi] = Math.random() * 1.5 + 0.5;

        particleData.push({
            homePos: new THREE.Vector3(
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            ),
            letterIdx: -1,
            randomOffset: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ),
            speed: 0.3 + Math.random() * 0.3,
        });
        pi++;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uOpacity: { value: 0 },
            uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        },
        vertexShader: `
      attribute float size;
      varying vec3 vColor;
      uniform float uPixelRatio;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * uPixelRatio * (8.0 / -mvPosition.z);
        gl_PointSize = clamp(gl_PointSize, 1.0, 12.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
        fragmentShader: `
      varying vec3 vColor;
      uniform float uOpacity;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.1, d) * uOpacity;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
        transparent: true,
        vertexColors: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    return { geometry, material, particleData, positions };
}

/* ===== Phase Callbacks ===== */
interface PhaseCallbacks {
    onIdentityStart: () => void;
    onCardStart: () => void;
}

/* ===== Main Component ===== */
export function ParticleScene({ onPhase }: { onPhase: PhaseCallbacks }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const startTimeRef = useRef<number>(0);
    const identityFired = useRef(false);
    const cardFired = useRef(false);

    const onPhaseRef = useRef(onPhase);
    onPhaseRef.current = onPhase;

    const init = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        camera.position.set(0, 0, 12);

        const renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: true,
            powerPreference: "high-performance",
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Ambient glow
        const glowGeo = new THREE.PlaneGeometry(40, 40);
        const glowMat = new THREE.ShaderMaterial({
            uniforms: { uOpacity: { value: 0 } },
            vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        varying vec2 vUv;
        uniform float uOpacity;
        void main() {
          float d = distance(vUv, vec2(0.5));
          float glow = smoothstep(0.5, 0.0, d) * 0.08 * uOpacity;
          vec3 col = mix(vec3(0.15, 0.1, 0.3), vec3(0.1, 0.2, 0.35), d);
          gl_FragColor = vec4(col, glow);
        }
      `,
            transparent: true,
            depthWrite: false,
        });
        const glowPlane = new THREE.Mesh(glowGeo, glowMat);
        glowPlane.position.z = -5;
        scene.add(glowPlane);

        const { material, particleData, positions, geometry } =
            createParticleSystem(scene);

        startTimeRef.current = performance.now();

        const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;

        // Sweep light uniform
        let sweepProgress = -1;

        const animate = () => {
            const elapsed = (performance.now() - startTimeRef.current) / 1000;

            // Phase 1: Black (0-0.5s) — particles invisible
            if (elapsed < T.BLACK) {
                material.uniforms.uOpacity.value = 0;
                glowMat.uniforms.uOpacity.value = 0;
            }
            // Phase 2: Distant light emerges (0.5-1.5s)
            else if (elapsed < T.LIGHT_END) {
                const p = (elapsed - T.LIGHT_START) / (T.LIGHT_END - T.LIGHT_START);
                material.uniforms.uOpacity.value = p * 0.4;
                glowMat.uniforms.uOpacity.value = p * 0.5;
                camera.position.z = 12 - p * 1.5;
            }
            // Phase 3: Convergence (1.5-2.8s)
            else if (elapsed < T.CONVERGE_END) {
                const p = Math.min(
                    1,
                    (elapsed - T.CONVERGE_START) / (T.CONVERGE_END - T.CONVERGE_START)
                );
                const ease = 1 - Math.pow(1 - p, 3); // easeOutCubic
                material.uniforms.uOpacity.value = 0.4 + ease * 0.6;
                glowMat.uniforms.uOpacity.value = 0.5 + ease * 0.5;
                camera.position.z = 10.5 - ease * 2;

                for (let i = 0; i < particleData.length; i++) {
                    const pd = particleData[i];
                    if (pd.letterIdx >= 0) {
                        const target = pd.homePos;
                        const microTime = elapsed * pd.speed;
                        const micro = new THREE.Vector3(
                            Math.sin(microTime * 2 + i) * 0.05 * (1 - ease),
                            Math.cos(microTime * 1.7 + i * 0.5) * 0.05 * (1 - ease),
                            Math.sin(microTime * 1.3 + i * 0.3) * 0.03 * (1 - ease)
                        );

                        positions[i * 3] = THREE.MathUtils.lerp(
                            positions[i * 3],
                            target.x + pd.randomOffset.x * (1 - ease) + micro.x,
                            ease * 0.08 * pd.speed
                        );
                        positions[i * 3 + 1] = THREE.MathUtils.lerp(
                            positions[i * 3 + 1],
                            target.y + pd.randomOffset.y * (1 - ease) + micro.y,
                            ease * 0.08 * pd.speed
                        );
                        positions[i * 3 + 2] = THREE.MathUtils.lerp(
                            positions[i * 3 + 2],
                            target.z + micro.z,
                            ease * 0.1 * pd.speed
                        );
                    }
                }
            }
            // Phase 4: Energy sweep (2.8-3.4s)
            else if (elapsed < T.SWEEP_END) {
                const p = (elapsed - T.SWEEP_START) / (T.SWEEP_END - T.SWEEP_START);
                sweepProgress = p;
                material.uniforms.uOpacity.value = 1;

                // Keep particles in letter positions with micro movement
                for (let i = 0; i < particleData.length; i++) {
                    const pd = particleData[i];
                    if (pd.letterIdx >= 0) {
                        const microTime = elapsed * pd.speed;
                        positions[i * 3] = pd.homePos.x + Math.sin(microTime + i) * 0.03;
                        positions[i * 3 + 1] =
                            pd.homePos.y + Math.cos(microTime * 1.3 + i) * 0.03;
                        positions[i * 3 + 2] = Math.sin(microTime * 0.7 + i) * 0.02;

                        // Sweep intensity: brighten particles as sweep passes
                        const sweepX = -6 + sweepProgress * 12;
                        const dist = Math.abs(positions[i * 3] - sweepX);
                        if (dist < 1.5) {
                            const intensity = 1 - dist / 1.5;
                            const sizeAttr = geometry.getAttribute("size") as THREE.BufferAttribute;
                            sizeAttr.array[i] = (Math.random() * 2 + 1) * (1 + intensity * 1.5);
                            sizeAttr.needsUpdate = true;
                        }
                    }
                }
            }
            // Phase 5: Dissolve (3.4-4.4s)
            else if (elapsed < T.DISSOLVE_END) {
                const p = (elapsed - T.DISSOLVE_START) / (T.DISSOLVE_END - T.DISSOLVE_START);
                const ease = p * p; // easeIn
                material.uniforms.uOpacity.value = Math.max(0, 1 - ease * 1.2);

                if (!identityFired.current) {
                    identityFired.current = true;
                    onPhaseRef.current.onIdentityStart();
                }

                for (let i = 0; i < particleData.length; i++) {
                    const pd = particleData[i];
                    if (pd.letterIdx >= 0) {
                        positions[i * 3] += pd.randomOffset.x * ease * 0.5;
                        positions[i * 3 + 1] += pd.randomOffset.y * ease * 0.5;
                        positions[i * 3 + 2] += (Math.random() - 0.5) * ease * 0.1;
                    }
                }
            }
            // Phase 6: Recede (4.4-5.8s)
            else if (elapsed < T.RECEDE_END) {
                const p = (elapsed - T.RECEDE_START) / (T.RECEDE_END - T.RECEDE_START);
                material.uniforms.uOpacity.value = Math.max(0, 0.3 - p * 0.25);
                glowMat.uniforms.uOpacity.value = Math.max(0.1, 0.8 - p * 0.6);

                if (!cardFired.current) {
                    cardFired.current = true;
                    onPhaseRef.current.onCardStart();
                }
            }
            // Idle
            else {
                material.uniforms.uOpacity.value = 0.06;
                glowMat.uniforms.uOpacity.value = 0.15;

                // Subtle ambient drift
                for (let i = 0; i < particleData.length; i++) {
                    const pd = particleData[i];
                    const t = elapsed * 0.2 * pd.speed;
                    if (pd.letterIdx < 0) {
                        positions[i * 3] =
                            pd.homePos.x + Math.sin(t + i * 0.1) * 0.5;
                        positions[i * 3 + 1] =
                            pd.homePos.y + Math.cos(t * 0.7 + i * 0.2) * 0.3;
                        positions[i * 3 + 2] =
                            pd.homePos.z + Math.sin(t * 0.5 + i) * 0.3;
                    }
                }
            }

            posAttr.needsUpdate = true;
            material.uniforms.uTime.value = elapsed;
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            renderer.dispose();
            geometry.dispose();
            material.dispose();
            glowMat.dispose();
            glowGeo.dispose();
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
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 0,
            }}
        />
    );
}
