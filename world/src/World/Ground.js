import * as THREE from 'three'
import { COLORS, TOWN } from '../utils/constants.js'

function noise2D(x, z) {
  return 0.5 * Math.sin(x * 0.31 + 1.7) * Math.cos(z * 0.27 + 0.8)
       + 0.25 * Math.sin(x * 0.63 + z * 0.47 + 3.1)
       + 0.15 * Math.sin(x * 1.17 + 2.3) * Math.sin(z * 0.93 + 1.4)
       + 0.1  * Math.cos(x * 1.71 + z * 1.31 + 0.5)
}

function edgeBoundary(angle) {
  return 0.82
    + 0.055 * Math.sin(angle * 1.0 + 0.3)
    + 0.045 * Math.sin(angle * 2.0 + 1.7)
    + 0.035 * Math.sin(angle * 3.0 + 2.1)
    + 0.028 * Math.sin(angle * 4.0 + 0.8)
    + 0.022 * Math.sin(angle * 5.0 + 3.4)
    + 0.018 * Math.sin(angle * 7.0 + 1.3)
    + 0.014 * Math.sin(angle * 9.0 + 4.2)
    + 0.010 * Math.sin(angle * 13.0 + 0.6)
    + 0.007 * Math.sin(angle * 17.0 + 2.9)
    + 0.005 * Math.sin(angle * 23.0 + 1.1)
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

// Shared height sampler — used by both visual mesh and physics heightField
export const GROUND_SIZE     = TOWN.size + 10   // 40 units
export const GROUND_SEGMENTS = 128

export function sampleGroundHeight(x, z) {
  const halfSize = GROUND_SIZE / 2
  const dist  = Math.sqrt(x * x + z * z) / halfSize
  const angle = Math.atan2(z, x)
  const edge  = edgeBoundary(angle)
  const innerFalloff = 1.0 - smoothstep(edge - 0.1, edge, dist)
  return noise2D(x, z) * 0.4 * innerFalloff
}

export default class Ground {
  constructor(experience) {
    this.experience = experience
    this.group = new THREE.Group()
    this.experience.scene.add(this.group)

    this._createMarsSurface()
  }

  _createMarsSurface() {
    const size = GROUND_SIZE
    const segments = GROUND_SEGMENTS

    const geo = new THREE.PlaneGeometry(size, size, segments, segments)
    geo.rotateX(-Math.PI / 2)

    const pos = geo.attributes.position
    const halfSize = size / 2

    // We'll store per-vertex alpha in a custom attribute
    const alphas = new Float32Array(pos.count)
    const colors = new Float32Array(pos.count * 3)
    const baseColor = new THREE.Color(COLORS.marsSurface)
    const darkColor = new THREE.Color(COLORS.marsSurfaceDark)

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)

      const dist = Math.sqrt(x * x + z * z) / halfSize
      const angle = Math.atan2(z, x)
      const edge = edgeBoundary(angle)

      // Height: use shared sampler (same as physics heightField)
      const innerFalloff = 1.0 - smoothstep(edge - 0.1, edge, dist)
      const y = sampleGroundHeight(x, z)
      pos.setY(i, y)

      // Alpha: fully opaque inside, narrow fade at edge
      const alpha = 1.0 - smoothstep(edge - 0.05, edge + 0.02, dist)
      alphas[i] = alpha

      // Vertex color
      const heightMix = (y + 0.3) * 0.3
      const posMix = 0.15 + 0.2 * (Math.sin(x * 0.4 + z * 0.3) * 0.5 + 0.5)
      const mix = Math.max(0, Math.min(1, posMix + heightMix))
      const c = baseColor.clone().lerp(darkColor, mix)
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    geo.computeBoundingSphere()  // must call after manual position edits

    // Use alphaMap via a canvas texture generated from vertex alphas
    // But vertex alpha is simpler — use onBeforeCompile to inject alpha
    // Actually the simplest: generate an alpha texture from the vertex data

    // Create alpha map canvas
    const mapSize = segments + 1
    const canvas = document.createElement('canvas')
    canvas.width = mapSize
    canvas.height = mapSize
    const ctx = canvas.getContext('2d')
    const imageData = ctx.createImageData(mapSize, mapSize)

    for (let iy = 0; iy < mapSize; iy++) {
      for (let ix = 0; ix < mapSize; ix++) {
        // Vertex index: row-major, PlaneGeometry goes left-to-right, top-to-bottom
        const vertexIdx = iy * mapSize + ix
        const a = Math.round(alphas[vertexIdx] * 255)
        const pixelIdx = (iy * mapSize + ix) * 4
        imageData.data[pixelIdx] = a
        imageData.data[pixelIdx + 1] = a
        imageData.data[pixelIdx + 2] = a
        imageData.data[pixelIdx + 3] = 255
      }
    }
    ctx.putImageData(imageData, 0, 0)

    const alphaMap = new THREE.CanvasTexture(canvas)
    alphaMap.minFilter = THREE.LinearFilter
    alphaMap.magFilter = THREE.LinearFilter

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: false,
      roughness: 0.95,
      metalness: 0,
      transparent: true,
      alphaMap: alphaMap,
      alphaTest: 0.01, // discard fully transparent pixels
    })

    const mesh = new THREE.Mesh(geo, mat)
    mesh.frustumCulled = false  // skip frustum test — geometry modified manually
    mesh.receiveShadow = true
    this.group.add(mesh)
  }
}
