/* eslint-disable react/no-unknown-property */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
} from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import * as THREE from 'three';

extend({ MeshLineGeometry, MeshLineMaterial });

/**
 * Physically-simulated ID-badge lanyard — adapted from reactbits.dev's
 * Lanyard (https://reactbits.dev/components/lanyard), swapped to load its
 * model/texture from `public/lanyard/` (Astro static-asset URLs) instead of
 * bundler ES imports. Mounted in Header.astro via `client:media="(min-width:
 * 1024px)"` so the whole three.js/rapier/glTF payload is never even
 * downloaded below that breakpoint — the actual load-cost win. Never renders
 * its Canvas at all under reduced-motion — see `CLAUDE.md` golden rule #5.
 *
 * This is intentionally the heaviest island in the codebase (three.js +
 * react-three-fiber + a WASM physics engine + a 2.4MB glTF model). Keep it
 * that way deliberately, not by accident — see the design-philosophy
 * discussion this was added alongside.
 */

const CARD_GLB_URL = '/lanyard/card.glb';
const BAND_TEXTURE_URL = '/lanyard/lanyard-band.png';

// 1x1 transparent pixel — lets useTexture be called unconditionally when a
// front/back image isn't supplied.
const BLANK_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// The card model's front face is UV-mapped to the LEFT half of its texture
// atlas, back face to the RIGHT half (measured from card.glb). Each custom
// image is composited into its own half so both faces render independently,
// aspect-preserving (no stretching).
const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 };

interface LanyardProps {
  className?: string;
  /** Camera position — third number is distance; larger = more zoomed out. */
  position?: [number, number, number];
  /** Where the fixed clip attaches, in the same 3D world space the camera
   *  looks at. This is what actually moves the badge around on screen —
   *  react-three-fiber's default camera always looks at the world origin,
   *  so panning the *camera* doesn't pan the view the way you'd expect from
   *  a normal 2D UI; move this instead. */
  anchorPosition?: [number, number, number];
  /** Multiplier on the cord's length (1 = the original component's own
   *  proportions). Scales the rope segments AND the card's attachment
   *  offset together, so it can't drift out of physics sync — don't tune
   *  those two independently by hand. */
  ropeLength?: number;
  gravity?: [number, number, number];
  fov?: number;
  /** Front-face photo URL — falls back to the model's built-in texture when unset. */
  frontImage?: string | null;
  backImage?: string | null;
  imageFit?: 'cover' | 'contain';
}

export default function Lanyard({
  className,
  position = [0, 0, 13],
  anchorPosition = [0, 4, 0],
  ropeLength = 1,
  gravity = [0, -40, 0],
  fov = 20,
  frontImage = null,
  backImage = null,
  imageFit = 'cover',
}: LanyardProps) {
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Latest pointer position in viewport (client) coordinates — tracked on
  // `window`, independent of whatever the canvas's own `pointer-events` CSS
  // is set to (see the proximity-based toggle in Band below).
  const pointerRef = useRef({ x: -9999, y: -9999 });
  // Toggled by Band's proximity check via a plain classList call (an
  // `is-interactive` class, forced through in the <style> below) — see that
  // effect's comment for why this can't just be a `pointer-events: none` on
  // this wrapper alone: react-three-fiber's own internal wrapper divs around
  // the actual <canvas> set their *own* inline `pointer-events: auto`,
  // which wins over anything an ancestor sets, CSS inheritance or not.
  const hitAreaRef = useRef<HTMLDivElement>(null);

  // Canvas/WebGL must never run during Astro's build-time SSR pass — defer
  // the entire 3D tree to a client-only mount.
  //
  // Note on the known Cursor.tsx rAF/idle-callback starvation bug this
  // codebase has hit before: that was an *infinite* rAF loop that never
  // stopped scheduling frames for the entire page lifetime. This component's
  // Canvas does run its own continuous rAF loop too (physics need every-frame
  // updates), but only once this island exists at all — and `client:media`
  // below is what actually matters for load cost: below the breakpoint, none
  // of this ever downloads or executes, so there's nothing to starve
  // anything with in the case that matters most (mobile).
  useEffect(() => {
    setMounted(true);
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);

    const onPointerMove = (e: PointerEvent) => {
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
    };
    // Deliberately on `window`, not the canvas: this must keep working even
    // while the canvas itself has `pointer-events: none` (its default state
    // — see Band's proximity check), otherwise nothing could ever tell it
    // to switch back to `auto`.
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      mq.removeEventListener('change', onChange);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  // A swinging physics lanyard is exactly the "autoplaying decorative
  // animation" golden rule #5 warns about — under reduced-motion, skip
  // loading three.js/rapier entirely rather than just freezing them in
  // place, so reduced-motion users also never pay for the download.
  if (!mounted || reduced) {
    return (
      <div
        className={className}
        aria-hidden="true"
        style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '1.5rem' }}
      >
        {frontImage && (
          <img
            src={frontImage}
            alt=""
            style={{
              width: '220px',
              aspectRatio: '3 / 4',
              objectFit: imageFit,
              borderRadius: 'var(--radius-box)',
              border: '1px solid var(--color-border)',
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`lanyard-hit-area ${className ?? ''}`} ref={hitAreaRef}>
      <Canvas
        camera={{ position, fov }}
        dpr={[1, isMobile ? 1.25 : 2]}
        gl={{ alpha: true }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), 0)}
      >
        <ambientLight intensity={Math.PI} />
        <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
          <Band
            frontImage={frontImage}
            backImage={backImage}
            imageFit={imageFit}
            isMobile={isMobile}
            anchorPosition={anchorPosition}
            ropeLength={ropeLength}
            pointerRef={pointerRef}
            hitAreaRef={hitAreaRef}
          />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer
            intensity={2}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={10}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Canvas>

      <style>{`
        /*
         * react-three-fiber's Canvas wraps the actual <canvas> in its own
         * div(s) that set an *inline* pointer-events: auto on themselves —
         * that wins over any pointer-events this wrapper (or Header.astro's
         * outer container) sets, inheritance or not, because an inline
         * style can only be beaten by an !important rule, never by a plain
         * ancestor declaration. This is the one place in the codebase that
         * reaches for !important on purpose: overriding a third-party
         * library's own inline styles has no other mechanism (see the
         * .claude/rules on avoiding !important — this is the documented,
         * deliberate exception, not a shortcut).
         */
        .lanyard-hit-area,
        .lanyard-hit-area * {
          pointer-events: none !important;
        }
        .lanyard-hit-area.is-interactive,
        .lanyard-hit-area.is-interactive * {
          pointer-events: auto !important;
        }
      `}</style>
    </div>
  );
}

interface BandProps {
  frontImage: string | null;
  backImage: string | null;
  imageFit: 'cover' | 'contain';
  isMobile: boolean;
  anchorPosition: [number, number, number];
  ropeLength: number;
  pointerRef: React.RefObject<{ x: number; y: number }>;
  hitAreaRef: React.RefObject<HTMLDivElement | null>;
}

// Generous hit-radius (CSS px) around the card's on-screen projection before
// the canvas becomes clickable/draggable — bigger than the card's own
// rendered size so it's easy to grab, without needing pixel-perfect aim.
const HOVER_RADIUS_PX = 130;

function Band({
  frontImage,
  backImage,
  imageFit,
  isMobile,
  anchorPosition,
  ropeLength,
  pointerRef,
  hitAreaRef,
}: BandProps) {
  const band = useRef<any>(null);
  const fixed = useRef<any>(null);
  const j1 = useRef<any>(null);
  const j2 = useRef<any>(null);
  const j3 = useRef<any>(null);
  const card = useRef<any>(null);

  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const screenVec = new THREE.Vector3();
  const wasInteractive = useRef(false);
  const segmentProps = {
    type: 'dynamic' as const,
    canSleep: true,
    colliders: false as const,
    angularDamping: 4,
    linearDamping: 4,
  };

  const { nodes, materials } = useGLTF(CARD_GLB_URL) as any;
  const texture = useTexture(BAND_TEXTURE_URL);
  // useTexture must be called unconditionally; use a blank pixel when an
  // image isn't supplied for a given face, then skip compositing it below.
  const frontTex = useTexture(frontImage || BLANK_PIXEL);
  const backTex = useTexture(backImage || BLANK_PIXEL);

  // Composite the front/back photos into the card's texture atlas (front =
  // left half, back = right half), each drawn aspect-preserving.
  const cardMap = useMemo(() => {
    const baseMap = materials.base.map;
    if (!frontImage && !backImage) return baseMap;

    const baseImg = baseMap.image;
    const W = baseImg.width;
    const H = baseImg.height;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return baseMap;
    ctx.drawImage(baseImg, 0, 0, W, H);

    const drawFitted = (img: HTMLImageElement, rect: typeof FRONT_UV_RECT) => {
      const rx = rect.x * W;
      const ry = rect.y * H;
      const rw = rect.w * W;
      const rh = rect.h * H;
      const pick = imageFit === 'contain' ? Math.min : Math.max;
      const scale = pick(rw / img.width, rh / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = rx + (rw - dw) / 2;
      const dy = ry + (rh - dh) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    };

    if (frontImage && frontTex.image) drawFitted(frontTex.image as HTMLImageElement, FRONT_UV_RECT);
    if (backImage && backTex.image) drawFitted(backTex.image as HTMLImageElement, BACK_UV_RECT);

    const composite = new THREE.CanvasTexture(canvas);
    composite.colorSpace = THREE.SRGBColorSpace;
    composite.flipY = baseMap.flipY;
    composite.anisotropy = 16;
    composite.needsUpdate = true;
    return composite;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frontImage, backImage, imageFit, frontTex, backTex, materials.base.map]);

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ])
  );
  const [dragged, drag] = useState<THREE.Vector3 | false>(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [
    [0, 0, 0],
    [0, 0, 0],
    ropeLength,
  ]);
  useRopeJoint(j1, j2, [
    [0, 0, 0],
    [0, 0, 0],
    ropeLength,
  ]);
  useRopeJoint(j2, j3, [
    [0, 0, 0],
    [0, 0, 0],
    ropeLength,
  ]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45 * ropeLength, 0],
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => void (document.body.style.cursor = 'auto');
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    // Proximity-based interactivity: this canvas spans most of the viewport
    // (see Header.astro) with pointer-events forced off by default (the
    // `.lanyard-hit-area` rule above) so it never blocks clicks on the rest
    // of the page. Project the card's current on-screen position each frame
    // and flip the `is-interactive` class only while the real cursor is
    // actually near it (or it's already being dragged) — R3F's own
    // onPointerOver/onPointerDown below can only ever fire once the canvas
    // is *already* accepting events, so this check has to happen outside
    // Three's event system, against the raw window-level pointer position
    // tracked in the parent component.
    if (card.current) {
      screenVec.copy(card.current.translation()).project(state.camera);
      const rect = state.gl.domElement.getBoundingClientRect();
      const screenX = rect.left + ((screenVec.x + 1) / 2) * rect.width;
      const screenY = rect.top + ((1 - screenVec.y) / 2) * rect.height;
      const dx = pointerRef.current.x - screenX;
      const dy = pointerRef.current.y - screenY;
      const interactive = dx * dx + dy * dy < HOVER_RADIUS_PX * HOVER_RADIUS_PX || !!dragged;
      if (interactive !== wasInteractive.current) {
        wasInteractive.current = interactive;
        hitAreaRef.current?.classList.toggle('is-interactive', interactive);
      }
    }

    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }
    if (fixed.current) {
      [j1, j2].forEach((ref) => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        const clampedDistance = Math.max(
          0.1,
          Math.min(1, ref.current.lerped.distanceTo(ref.current.translation()))
        );
        ref.current.lerped.lerp(ref.current.translation(), delta * (0 + clampedDistance * 50));
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());
      const sampled = curve.getPoints(isMobile ? 16 : 32);
      // meshline's setPoints() -> process() computes a tangent between every
      // consecutive pair of points and normalizes it, then always ends in a
      // fresh computeBoundingSphere() call. Whenever two of the curve's 4
      // control points land on (near-)identical positions — common in the
      // first physics steps right after mount, before the rope segments
      // have spread out — the Catmull-Rom sampling produces a
      // (near-)duplicate point pair, meshline normalizes a ~zero-length
      // tangent, and every downstream computation (including the bounding
      // sphere) comes out NaN. Skip that one frame's update rather than feed
      // meshline degenerate data; physics separates the points again within
      // a frame or two either way.
      const degenerate = sampled.some(
        (p, i) => i > 0 && p.distanceToSquared(sampled[i - 1]) < 1e-8
      );
      if (!degenerate) {
        band.current.geometry.setPoints(sampled);
      }
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
  });

  curve.curveType = 'chordal';
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  return (
    <>
      {/* Shifted right from the original's [0,4,0] for header placement —
          react-three-fiber's default camera looks at the world origin
          regardless of its own `position`, so shifting the camera alone
          doesn't pan the view the way a fixed-forward camera would; moving
          the anchor itself (via the `anchorPosition` prop) is what actually
          places the badge on screen. Its Y needs to stay roughly at/above
          the top edge of the visible frustum for the ribbon to reach the
          very top of the canvas (behind the header, no gap) — that's
          coupled to the camera's `position` distance and the container's
          `top-*` offset in Header.astro, so re-tune together. */}
      <group position={anchorPosition}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5 * ropeLength, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1 * ropeLength, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5 * ropeLength, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2 * ropeLength, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? 'kinematicPosition' : 'dynamic'}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e: any) => (e.target.releasePointerCapture(e.pointerId), drag(false))}
            onPointerDown={(e: any) => (
              e.target.setPointerCapture(e.pointerId),
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())))
            )}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={cardMap}
                map-anisotropy={16}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={0.9}
                metalness={0.8}
              />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      {/* frustumCulled off: meshline's setPoints() marks the geometry dirty
          every frame, and its computeBoundingSphere() can transiently return
          NaN mid-lerp — harmless visually, but the renderer's automatic
          per-frame frustum check keeps recomputing it. This element is a
          small always-on-screen badge with nothing to gain from culling. */}
      {/* No `depthTest={false}` here (the original component sets it) — that
          skips the depth buffer entirely, so the band always painted on top
          of the metal clip/clamp regardless of which was actually in front,
          hiding the hook. Normal depth testing lets whichever is actually
          nearer the camera occlude correctly. */}
      <mesh ref={band} frustumCulled={false}>
        <meshLineGeometry />
        <meshLineMaterial
          args={[{ resolution: new THREE.Vector2(1000, 1000) }]}
          color="white"
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap={1}
          map={texture}
          repeat={[-4, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  );
}

useGLTF.preload(CARD_GLB_URL);
