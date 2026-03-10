import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export default class Resources {
  constructor() {
    this.items = {}
    this.loadingManager = new THREE.LoadingManager()
    this.textureLoader = new THREE.TextureLoader(this.loadingManager)

    this.onProgressCallback = null
    this.totalAssets = 0
    this.loadedAssets = 0

    this.loadingManager.onProgress = (url, loaded, total) => {
      const progress = loaded / total
      if (this.onProgressCallback) this.onProgressCallback(progress)
    }
  }

  onProgress(cb) { this.onProgressCallback = cb }

  async loadAll() {
    const assets = [
      // Buildings
      { name: 'buildingLab',    type: 'gltf', path: './models/buildings/building-a.glb' },
      { name: 'buildingHouse1', type: 'gltf', path: './models/buildings/building-d.glb' },
      { name: 'buildingHouse2', type: 'gltf', path: './models/buildings/building-g.glb' },
      { name: 'colormap',       type: 'texture', path: './models/buildings/colormap.png' },
      // Props
      { name: 'desk',           type: 'gltf', path: './models/props/desk_computer.glb' },
      { name: 'chair',          type: 'gltf', path: './models/props/desk_chairArms.glb' },
      // Characters — each gets its own loader to avoid cache/clone issues
      { name: 'player',         type: 'gltf', path: './models/characters/player.glb' },
      { name: 'professor',      type: 'gltf', path: './models/characters/professor.glb' },
      { name: 'agentClaw',      type: 'gltf', path: './models/characters/agent_claw.glb' },
      { name: 'agentCoin',      type: 'gltf', path: './models/characters/agent_coin.glb' },
      { name: 'agentNeo',       type: 'gltf', path: './models/characters/agent_neo.glb' },
    ]

    this.totalAssets = assets.length
    this.loadedAssets = 0

    const promises = assets.map((asset) => {
      return new Promise((resolve) => {
        if (asset.type === 'gltf') {
          // Create a fresh loader per asset to avoid internal cache conflicts
          const loader = new GLTFLoader()
          loader.load(
            asset.path,
            (gltf) => {
              this.items[asset.name] = gltf
              this.loadedAssets++
              this._reportProgress()
              resolve()
            },
            undefined,
            (err) => {
              console.warn(`Failed to load ${asset.path}:`, err)
              this.loadedAssets++
              this._reportProgress()
              resolve()
            }
          )
        } else if (asset.type === 'texture') {
          this.textureLoader.load(
            asset.path,
            (texture) => {
              this.items[asset.name] = texture
              this.loadedAssets++
              this._reportProgress()
              resolve()
            },
            undefined,
            (err) => {
              console.warn(`Failed to load ${asset.path}:`, err)
              this.loadedAssets++
              this._reportProgress()
              resolve()
            }
          )
        }
      })
    })

    await Promise.all(promises)
  }

  _reportProgress() {
    if (this.onProgressCallback) {
      this.onProgressCallback(this.loadedAssets / this.totalAssets)
    }
  }
}
