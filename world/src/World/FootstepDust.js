import * as THREE from 'three'

const DUST_COUNT = 60       // max simultaneous particles
const DUST_LIFE  = 0.6      // seconds
const DUST_SPEED = 0.8      // upward initial velocity
const EMIT_INTERVAL = 0.12  // seconds between emits (every ~2 frames at 60fps)

export default class FootstepDust {
  constructor(experience) {
    this.experience = experience
    this._particles = []
    this._emitTimer = 0
    this._wasMoving = false

    this._build()
    this.experience.scene.add(this.group)
  }

  _build() {
    this.group = new THREE.Group()

    const positions  = new Float32Array(DUST_COUNT * 3)
    const opacities  = new Float32Array(DUST_COUNT)
    const sizes      = new Float32Array(DUST_COUNT)

    this._geo = new THREE.BufferGeometry()
    this._geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this._geo.setAttribute('opacity',  new THREE.BufferAttribute(opacities,  1))
    this._geo.setAttribute('size',     new THREE.BufferAttribute(sizes,      1))

    // Init all positions far below ground
    for (let i = 0; i < DUST_COUNT; i++) {
      positions[i * 3]     = 0
      positions[i * 3 + 1] = -999
      positions[i * 3 + 2] = 0
    }

    // Pre-set fixed bounding sphere — reassigned every frame after needsUpdate
    this._fixedSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 5000)
    this._geo.boundingSphere = this._fixedSphere

    // Pool of particle state objects
    this._pool = Array.from({ length: DUST_COUNT }, (_, i) => ({
      index: i,
      life: 0,
      maxLife: 0,
      vx: 0, vy: 0, vz: 0,
      active: false,
    }))

    this._mat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        attribute float opacity;
        attribute float size;
        varying float vOpacity;
        void main() {
          vOpacity = opacity;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (200.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying float vOpacity;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          if (d > 1.0) discard;
          float alpha = (1.0 - d) * vOpacity;
          // Mars dust: warm sandy orange
          gl_FragColor = vec4(0.82, 0.52, 0.28, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      fog: true,
    })

    this._points = new THREE.Points(this._geo, this._mat)
    this.group.add(this._points)
  }

  // Emit a burst of dust at position x, y, z
  emit(x, y, z) {
    const burst = 3 + Math.floor(Math.random() * 3)
    let spawned = 0
    for (const p of this._pool) {
      if (p.active) continue
      p.active  = true
      p.life    = 0
      p.maxLife = DUST_LIFE * (0.7 + Math.random() * 0.6)
      const angle = Math.random() * Math.PI * 2
      const speed = (0.3 + Math.random() * 0.5) * DUST_SPEED
      p.vx = Math.cos(angle) * speed * 0.5
      p.vy = (0.2 + Math.random() * 0.6) * DUST_SPEED
      p.vz = Math.sin(angle) * speed * 0.5

      const pos = this._geo.attributes.position
      pos.setXYZ(p.index, x + (Math.random() - 0.5) * 0.3, y + 0.05, z + (Math.random() - 0.5) * 0.3)

      if (++spawned >= burst) break
    }
  }

  update(delta, playerPos, isMoving, isGrounded) {
    if (!playerPos) return
    const pos = this._geo.attributes.position
    const opc = this._geo.attributes.opacity
    const siz = this._geo.attributes.size

    // Emit when moving on ground
    if (isMoving && isGrounded) {
      this._emitTimer += delta
      if (this._emitTimer >= EMIT_INTERVAL) {
        this._emitTimer = 0
        this.emit(playerPos.x, playerPos.y, playerPos.z)
      }
    } else {
      this._emitTimer = 0
    }

    // Update active particles
    for (const p of this._pool) {
      if (!p.active) {
        opc.setX(p.index, 0)
        siz.setX(p.index, 0)
        pos.setXYZ(p.index, 0, -999, 0)  // hide below ground, avoid NaN bounding sphere
        continue
      }

      p.life += delta
      const t = p.life / p.maxLife   // 0 → 1

      if (t >= 1) {
        p.active = false
        opc.setX(p.index, 0)
        siz.setX(p.index, 0)
        continue
      }

      // Fade out in last 40%, rise up and slow
      const fade = t < 0.6 ? 1.0 : 1.0 - (t - 0.6) / 0.4
      opc.setX(p.index, fade * 0.7)
      siz.setX(p.index, 0.8 + t * 1.2)

      // Move
      p.vy -= delta * 1.2  // gravity drag
      const x = pos.getX(p.index) + p.vx * delta
      const y = pos.getY(p.index) + p.vy * delta
      const z = pos.getZ(p.index) + p.vz * delta
      pos.setXYZ(p.index, x, Math.max(y, playerPos.y - 0.05), z)

      // Slow down horizontally
      p.vx *= 1 - delta * 3
      p.vz *= 1 - delta * 3
    }

    pos.needsUpdate = true
    opc.needsUpdate = true
    siz.needsUpdate = true
    // needsUpdate clears boundingSphere — must reassign every frame to prevent NaN crash
    this._geo.boundingSphere = this._fixedSphere
  }
}
