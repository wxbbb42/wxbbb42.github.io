import * as THREE from 'three'
import { COLORS } from '../utils/constants.js'

export default class Props {
  constructor(experience) {
    this.experience = experience
    this.group = new THREE.Group()
    this.experience.scene.add(this.group)

    this._createFences()
    this._createFlowers()
    this._createRocks()
    this._createSignPost()
  }

  _createFences() {
    const fenceMat = new THREE.MeshStandardMaterial({
      color: COLORS.fence,
      flatShading: true,
      roughness: 0.6,
    })

    // Fence along flower garden (south-west area)
    const fencePositions = [
      { x: -14, z: 8, rot: 0, length: 10 },
      { x: -4, z: 8, rot: 0, length: 10 },
    ]

    for (const fp of fencePositions) {
      this._createFenceSection(fp.x, fp.z, fp.length, fp.rot, fenceMat)
    }
  }

  _createFenceSection(x, z, length, rotation, material) {
    const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 4)
    const railGeo = new THREE.BoxGeometry(length, 0.06, 0.06)

    const numPosts = Math.ceil(length / 1.5) + 1

    for (let i = 0; i < numPosts; i++) {
      const post = new THREE.Mesh(postGeo, material)
      const offset = (i / (numPosts - 1) - 0.5) * length
      post.position.set(x + offset, 0.4, z)
      post.castShadow = true
      this.group.add(post)
    }

    // Top rail
    const topRail = new THREE.Mesh(railGeo, material)
    topRail.position.set(x, 0.7, z)
    topRail.castShadow = true
    this.group.add(topRail)

    // Bottom rail
    const botRail = new THREE.Mesh(railGeo, material)
    botRail.position.set(x, 0.35, z)
    botRail.castShadow = true
    this.group.add(botRail)

    // Collider
    this.experience.physics.addBoxCollider(x, 0.4, z, length / 2, 0.4, 0.1)
  }

  _createFlowers() {
    const flowerColors = [0xff4444, 0xff88aa, 0xffdd44, 0xffffff, 0xff66cc]

    for (let i = 0; i < 40; i++) {
      const geo = new THREE.IcosahedronGeometry(0.12, 0)
      const mat = new THREE.MeshStandardMaterial({
        color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
        flatShading: true,
        roughness: 0.6,
      })
      const flower = new THREE.Mesh(geo, mat)
      flower.position.set(
        -14 + Math.random() * 12,
        0.12,
        9 + Math.random() * 6
      )
      flower.castShadow = true
      this.group.add(flower)
    }

    // Flower stems (small green cylinders)
    for (let i = 0; i < 20; i++) {
      const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 4)
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50, flatShading: true })
      const stem = new THREE.Mesh(stemGeo, stemMat)
      stem.position.set(
        -14 + Math.random() * 12,
        0.07,
        9 + Math.random() * 6
      )
      this.group.add(stem)
    }
  }

  _createRocks() {
    const rockMat = new THREE.MeshStandardMaterial({
      color: COLORS.rock,
      flatShading: true,
      roughness: 0.95,
    })

    const rockPositions = [
      { x: 20, z: 10, s: 0.5 },
      { x: -18, z: -8, s: 0.7 },
      { x: 22, z: -15, s: 0.4 },
      { x: -20, z: 12, s: 0.6 },
    ]

    for (const rp of rockPositions) {
      const geo = new THREE.DodecahedronGeometry(rp.s, 0)
      // Randomize vertices slightly
      const pos = geo.attributes.position
      for (let i = 0; i < pos.count; i++) {
        pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 0.15)
        pos.setY(i, pos.getY(i) + (Math.random() - 0.5) * 0.15)
        pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * 0.15)
      }
      geo.computeVertexNormals()

      const rock = new THREE.Mesh(geo, rockMat)
      rock.position.set(rp.x, rp.s * 0.4, rp.z)
      rock.rotation.set(Math.random(), Math.random(), Math.random())
      rock.castShadow = true
      this.group.add(rock)
    }
  }

  _createSignPost() {
    const woodMat = new THREE.MeshStandardMaterial({
      color: COLORS.treeTrunk,
      flatShading: true,
      roughness: 0.9,
    })

    // Post
    const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 6)
    const post = new THREE.Mesh(postGeo, woodMat)
    post.position.set(-2, 0.75, 5)
    post.castShadow = true
    this.group.add(post)

    // Sign board
    const boardGeo = new THREE.BoxGeometry(1.5, 0.6, 0.08)
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0xf5e6c8,
      flatShading: true,
      roughness: 0.8,
    })
    const board = new THREE.Mesh(boardGeo, boardMat)
    board.position.set(-2, 1.3, 5)
    board.castShadow = true
    this.group.add(board)

    // Sign text
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#f5e6c8'
    ctx.fillRect(0, 0, 256, 128)
    ctx.fillStyle = '#333333'
    ctx.font = '24px "Press Start 2P", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('CLAWD TOWN', 128, 64)

    const texture = new THREE.CanvasTexture(canvas)
    const signMat = new THREE.SpriteMaterial({ map: texture, transparent: true })
    const sign = new THREE.Sprite(signMat)
    sign.position.set(-2, 1.3, 5.1)
    sign.scale.set(1.5, 0.75, 1)
    this.group.add(sign)
  }
}
