"use client";

import { useRef, useMemo, useCallback, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const MAX_RIPPLES = 8;

const vertexShader = `
  uniform float uTime;
  uniform float uNoiseScale;
  uniform float uNoiseStrength;
  uniform vec3 uRippleOrigins[${MAX_RIPPLES}];
  uniform float uRippleTimes[${MAX_RIPPLES}];
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

  vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x2_ = x_ * ns.x + ns.yyyy;
    vec4 y2_ = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x2_) - abs(y2_);
    vec4 b0 = vec4(x2_.xy, y2_.xy);
    vec4 b1 = vec4(x2_.zw, y2_.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main() {
    float noise = snoise(normal * uNoiseScale + uTime * 0.06);
    noise += 0.5 * snoise(normal * uNoiseScale * 2.0 + uTime * 0.1);
    noise += 0.25 * snoise(normal * uNoiseScale * 4.0 - uTime * 0.14);
    float displacement = noise * uNoiseStrength;

    vec3 surfaceDir = normalize(position);
    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      float age = uTime - uRippleTimes[i];
      if (age < 0.0 || age > 3.0) continue;
      float dist = acos(clamp(dot(surfaceDir, normalize(uRippleOrigins[i])), -1.0, 1.0));
      float rippleRadius = age * 1.8;
      float rippleWidth = 0.4;
      float ring = exp(-pow((dist - rippleRadius) / rippleWidth, 2.0));
      float wave = sin(dist * 12.0 - age * 6.0) * ring;
      float decay = exp(-age * 1.2);
      displacement += wave * 0.15 * decay;
    }

    vDisplacement = displacement;
    vec3 newPosition = position + normal * displacement;
    vNormal = normalMatrix * normal;
    vPosition = (modelViewMatrix * vec4(newPosition, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

  void main() {
    vec3 lightDir = normalize(vec3(1.0, 1.0, 2.0));
    float diff = max(dot(normalize(vNormal), lightDir), 0.0);

    vec3 baseColor = vec3(0.227, 0.525, 1.0);
    vec3 accentColor = vec3(0.424, 0.388, 1.0);
    vec3 peakColor = vec3(0.65, 0.3, 0.95);

    float t = smoothstep(-0.3, 0.3, vDisplacement);
    vec3 color = mix(baseColor, accentColor, t);
    color = mix(color, peakColor, smoothstep(0.12, 0.32, vDisplacement) * 0.5);

    vec3 viewDir = normalize(-vPosition);
    float rim = 1.0 - max(dot(normalize(vNormal), viewDir), 0.0);
    rim = pow(rim, 3.0);

    vec3 finalColor = color * (0.15 + diff * 0.5) + rim * baseColor * 0.6;
    finalColor += max(vDisplacement, 0.0) * baseColor * 0.4;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const wireframeFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

  void main() {
    vec3 baseColor = vec3(0.227, 0.525, 1.0);
    vec3 viewDir = normalize(-vPosition);
    float rim = 1.0 - max(dot(normalize(vNormal), viewDir), 0.0);
    float alpha = rim * 0.4 + 0.05;
    gl_FragColor = vec4(baseColor, alpha);
  }
`;

interface Ripple {
  origin: THREE.Vector3;
  time: number;
}

function NoiseSphere() {
  const meshRef = useRef<THREE.Group>(null!);
  const ripples = useRef<Ripple[]>([]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uNoiseScale: { value: 2.0 },
      uNoiseStrength: { value: 0.35 },
      uRippleOrigins: {
        value: new Array(MAX_RIPPLES)
          .fill(null)
          .map(() => new THREE.Vector3()),
      },
      uRippleTimes: { value: new Float32Array(MAX_RIPPLES).fill(-10) },
    }),
    [],
  );

  const addRipple = useCallback(
    (point: THREE.Vector3) => {
      if (!meshRef.current) return;
      const local = meshRef.current.worldToLocal(point.clone()).normalize();
      const now = uniforms.uTime.value;
      ripples.current.push({ origin: local, time: now });
      if (ripples.current.length > MAX_RIPPLES) {
        ripples.current.shift();
      }
      for (let i = 0; i < MAX_RIPPLES; i++) {
        const r = ripples.current[i];
        if (r) {
          uniforms.uRippleOrigins.value[i].copy(r.origin);
          uniforms.uRippleTimes.value[i] = r.time;
        } else {
          uniforms.uRippleTimes.value[i] = -10;
        }
      }
    },
    [uniforms],
  );

  const { camera } = useThree();
  useEffect(() => {
    const onClick = () => {
      if (!meshRef.current) return;
      const camDir = camera.position.clone().normalize();
      const up =
        Math.abs(camDir.y) < 0.99
          ? new THREE.Vector3(0, 1, 0)
          : new THREE.Vector3(1, 0, 0);
      const tangent = new THREE.Vector3()
        .crossVectors(camDir, up)
        .normalize();
      const bitangent = new THREE.Vector3()
        .crossVectors(camDir, tangent)
        .normalize();
      const theta = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 0.85;
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const z = Math.sqrt(1 - r * r);
      const point = camDir
        .clone()
        .multiplyScalar(z)
        .add(tangent.clone().multiplyScalar(x))
        .add(bitangent.clone().multiplyScalar(y))
        .normalize()
        .multiplyScalar(1.6);
      addRipple(point);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [camera, addRipple]);

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      <mesh>
        <icosahedronGeometry args={[1.6, 64]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.6, 64]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={wireframeFragmentShader}
          uniforms={uniforms}
          wireframe
          transparent
        />
      </mesh>
    </group>
  );
}

function createCircleTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.6, "rgba(255,255,255,0.8)");
  gradient.addColorStop(0.85, "rgba(255,255,255,0.2)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function Particles() {
  const pointsRef = useRef<THREE.Points>(null!);
  const circleTexture = useMemo(() => createCircleTexture(), []);
  const count = 600;

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 3 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      sz[i] = 0.5 + Math.random() * 1.5;
    }
    return [pos, sz];
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.02;
      pointsRef.current.rotation.x =
        Math.sin(clock.getElapsedTime() * 0.01) * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.07}
        color="#3A86FF"
        map={circleTexture}
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function MouseCamera() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });
  const smoothMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame(() => {
    smoothMouse.current.x +=
      (mouse.current.x - smoothMouse.current.x) * 0.05;
    smoothMouse.current.y +=
      (mouse.current.y - smoothMouse.current.y) * 0.05;
    camera.position.x = smoothMouse.current.x * 1.5;
    camera.position.y = -smoothMouse.current.y * 1.0;
    camera.position.z = 5;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function HeroSphere() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="pointer-events-auto absolute inset-0 z-0 opacity-70">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <NoiseSphere />
        <Particles />
        <MouseCamera />
      </Canvas>
    </div>
  );
}
