import * as THREE from 'three'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import { createClient } from '@supabase/supabase-js'

const STORAGE_KEY = 'clawd-world-editor-layout'

// Supabase config
const SUPABASE_URL = 'https://kuvftworrlcnqpavgkcg.supabase.co'
const SUPABASE_KEY = 'sb_publishable_IrAlGjUbMTGRofgRVAJ4ZA_FdU5rjma'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const EDITOR_MODEL_NAMES = [
  // Characters
  'alien', 'astronaut', 'astronautPlayer',
  // Structures
  'hangarLargeA', 'hangarLargeB', 'hangarRoundA', 'hangarRoundB', 'hangarRoundGlass',
  'hangarSmallA', 'hangarSmallB',
  'structure', 'structureClosed', 'structureDetailed', 'structureDiagonal',
  'gateComplex', 'gateSimple', 'chimney', 'chimneyDetailed',
  // Corridors
  'corridor', 'corridorCorner', 'corridorCornerRound', 'corridorCornerRoundWindow',
  'corridorCross', 'corridorDetailed', 'corridorEnd', 'corridorOpen',
  'corridorRoof', 'corridorSplit', 'corridorWall', 'corridorWallCorner',
  'corridorWindow', 'corridorWindowClosed',
  // Rocket parts
  'rocketBaseA', 'rocketBaseB', 'rocketFinsA', 'rocketFinsB',
  'rocketFuelA', 'rocketFuelB', 'rocketSidesA', 'rocketSidesB',
  'rocketTopA', 'rocketTopB',
  // Crafts
  'craftCargoA', 'craftCargoB', 'craftMiner', 'craftRacer',
  'craftSpeederA', 'craftSpeederB', 'craftSpeederC', 'craftSpeederD',
  // Rocks & terrain
  'rock', 'rockLargeA', 'rockLargeB', 'rocksSmallA', 'rocksSmallB',
  'rockCrystals', 'rockCrystalsLargeA', 'rockCrystalsLargeB',
  'crater', 'craterLarge', 'meteor', 'meteorDetailed', 'meteorHalf', 'bones',
  // Terrain pieces
  'terrain', 'terrainRamp', 'terrainRampLarge', 'terrainRampLargeDetailed',
  'terrainRoadCorner', 'terrainRoadCross', 'terrainRoadEnd',
  'terrainRoadSplit', 'terrainRoadStraight',
  'terrainSide', 'terrainSideCliff', 'terrainSideCorner',
  'terrainSideCornerInner', 'terrainSideEnd',
  // Props & machines
  'barrel', 'barrels', 'barrelsRail',
  'machineBarrel', 'machineBarrelLarge',
  'machineGenerator', 'machineGeneratorLarge', 'machineWireless', 'machineWirelessCable',
  'satelliteDish', 'satelliteDishDetailed', 'satelliteDishLarge',
  'rover', 'turretSingle', 'turretDouble', 'weaponGun', 'weaponRifle',
  // Rails
  'rail', 'railCorner', 'railEnd', 'railMiddle',
  // Pipes
  'pipeCorner', 'pipeCornerDiagonal', 'pipeCornerRound', 'pipeCornerRoundLarge',
  'pipeCross', 'pipeEnd', 'pipeEntrance', 'pipeOpen',
  'pipeRampLarge', 'pipeRampSmall', 'pipeRing', 'pipeRingHigh',
  'pipeRingHighEnd', 'pipeRingSupport', 'pipeSplit', 'pipeStraight',
  'pipeSupportHigh', 'pipeSupportLow',
  // Platforms
  'platformCenter', 'platformCorner', 'platformCornerOpen', 'platformCornerRound',
  'platformEnd', 'platformHigh', 'platformLarge', 'platformLong',
  'platformLow', 'platformSide', 'platformSmall', 'platformSmallDiagonal', 'platformStraight',
  // Monorail
  'monorailTrackCornerLarge', 'monorailTrackCornerSmall',
  'monorailTrackSlope', 'monorailTrackStraight',
  'monorailTrackSupport', 'monorailTrackSupportCorner',
  'monorailTrainBox', 'monorailTrainCargo', 'monorailTrainEnd',
  'monorailTrainFlat', 'monorailTrainFront', 'monorailTrainPassenger',
  // Interior / desk
  'deskChair', 'deskChairArms', 'deskChairStool',
  'deskComputer', 'deskComputerCorner', 'deskComputerScreen',
  // Stairs & supports
  'stairs', 'stairsCorner', 'stairsShort', 'supportsHigh', 'supportsLow',
]

// Default scale: 2.0 for most models (matching scene proportions with astronaut at 1.4)
const DEFAULT_SCALE = 2.0
const DEFAULT_SCALES = {
  // Buildings — larger
  hangarLargeA: 3.5, hangarLargeB: 3.5,
  hangarRoundA: 2.5, hangarRoundB: 2.5, hangarRoundGlass: 2.5,
  hangarSmallA: 2.5, hangarSmallB: 2.5,
  structure: 2.5, structureClosed: 2.5, structureDetailed: 2.5, structureDiagonal: 2.5,
  gateComplex: 2.5, gateSimple: 2.5,
  // Rockets
  rocketBaseA: 2.5, rocketBaseB: 2.5, rocketFinsA: 2.5, rocketFinsB: 2.5,
  rocketFuelA: 2.5, rocketFuelB: 2.5, rocketSidesA: 2.5, rocketSidesB: 2.5,
  rocketTopA: 2.5, rocketTopB: 2.5,
  // Crafts
  craftCargoA: 2.5, craftCargoB: 2.5, craftMiner: 2.5, craftRacer: 2.5,
  craftSpeederA: 2.5, craftSpeederB: 2.5, craftSpeederC: 2.5, craftSpeederD: 2.5,
  // Satellites
  satelliteDish: 2.0, satelliteDishDetailed: 2.5, satelliteDishLarge: 2.5,
  // Rover
  rover: 2.5,
  // Characters — match player scale
  alien: 1.4, astronaut: 1.4, astronautPlayer: 1.4,
  // Interior
  deskChair: 1.4, deskChairArms: 1.4, deskChairStool: 1.4,
  deskComputer: 1.4, deskComputerCorner: 1.4, deskComputerScreen: 1.4,
}

export default class Editor {
  constructor(experience) {
    this.experience = experience
    this.scene = experience.scene
    this.camera = experience.camera
    this.resources = experience.resources
    this.canvas = experience.canvas
    this.input = experience.input

    this.active = false
    this.placedModels = []    // array of THREE.Group wrappers
    this.selected = null      // currently selected group
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    // Transform controls
    this.transformControls = new TransformControls(
      this.camera.instance,
      this.canvas
    )
    this.transformControls.addEventListener('dragging-changed', (e) => {
      // Disable orbit when dragging transform
      this.camera.orbitControls.enabled = !e.value
      // Auto-save when user finishes dragging
      if (!e.value && this.selected) this._autoSave()
    })
    this.scene.add(this.transformControls.getHelper())

    // Selection highlight material color
    this._originalMaterials = new Map()

    // Auto-save debounce
    this._saveTimeout = null
    this._cloudSynced = false

    // Build the UI panel (hidden by default)
    this._buildUI()

    // Key listeners
    this._onKeyDown = this._onKeyDown.bind(this)
    this._onPointerDown = this._onPointerDown.bind(this)
    window.addEventListener('keydown', this._onKeyDown)
    this.canvas.addEventListener('pointerdown', this._onPointerDown)
  }

  // ─── Toggle ───────────────────────────────────────────────────────

  toggle() {
    this.active = !this.active

    if (this.active) {
      this._enterEditorMode()
    } else {
      this._exitEditorMode()
    }
  }

  _enterEditorMode() {
    // Enable orbit camera
    this.camera.orbitMode = true
    this.camera.orbitControls.enabled = true
    this.camera.orbitControls.target.copy(this.camera.smoothLookAt)

    // Lock player input
    this.input.locked = true

    // Show panel
    this.panel.style.display = 'flex'
    console.log('[Editor] ON  — Tab to exit')
  }

  _exitEditorMode() {
    // Deselect
    this._deselect()

    // Disable orbit camera
    this.camera.orbitMode = false
    this.camera.orbitControls.enabled = false

    // Unlock player input
    this.input.locked = false

    // Hide panel
    this.panel.style.display = 'none'
    console.log('[Editor] OFF')
  }

  // ─── Key handling ─────────────────────────────────────────────────

  _onKeyDown(e) {
    if (e.code === 'Tab') {
      e.preventDefault()
      this.toggle()
      return
    }

    if (!this.active) return

    // Transform mode shortcuts
    if (e.code === 'KeyW' && this.selected) {
      this.transformControls.setMode('translate')
    }
    if (e.code === 'KeyE' && this.selected) {
      this.transformControls.setMode('rotate')
    }
    if (e.code === 'KeyR' && this.selected) {
      this.transformControls.setMode('scale')
    }

    // Delete selected
    if ((e.code === 'Delete' || e.code === 'Backspace') && this.selected) {
      e.preventDefault()
      this._deleteSelected()
    }
  }

  // ─── Pointer / Raycasting ─────────────────────────────────────────

  _onPointerDown(e) {
    if (!this.active) return

    // Ignore if clicking on transform gizmo
    if (this.transformControls.dragging) return

    // Don't raycast if clicking on UI panel
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    this.mouse.x = (x / rect.width) * 2 - 1
    this.mouse.y = -(y / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera.instance)

    // Collect all meshes from placed models
    const meshes = []
    for (const group of this.placedModels) {
      group.traverse((child) => {
        if (child.isMesh) meshes.push(child)
      })
    }

    const intersects = this.raycaster.intersectObjects(meshes, false)
    if (intersects.length > 0) {
      // Walk up to find the editor group wrapper
      let obj = intersects[0].object
      while (obj && !obj.userData._editorModel) {
        obj = obj.parent
      }
      if (obj) {
        this._select(obj)
        return
      }
    }

    // Clicked nothing — deselect
    this._deselect()
  }

  // ─── Selection ────────────────────────────────────────────────────

  _select(group) {
    if (this.selected === group) return

    // Remove previous highlight
    this._removeHighlight()

    this.selected = group
    this.transformControls.attach(group)

    // Highlight meshes
    group.traverse((child) => {
      if (child.isMesh) {
        this._originalMaterials.set(child, child.material)
        child.material = child.material.clone()
        child.material.emissive = new THREE.Color(0x44ffaa)
        child.material.emissiveIntensity = 0.3
      }
    })

    this._updateInfoPanel()
  }

  _deselect() {
    this._removeHighlight()
    this.selected = null
    this.transformControls.detach()
    this._updateInfoPanel()
  }

  _removeHighlight() {
    if (!this.selected) return
    this.selected.traverse((child) => {
      if (child.isMesh && this._originalMaterials.has(child)) {
        child.material.dispose()
        child.material = this._originalMaterials.get(child)
      }
    })
    this._originalMaterials.clear()
  }

  _deleteSelected() {
    if (!this.selected) return
    const group = this.selected
    this._deselect()
    this.scene.remove(group)
    const idx = this.placedModels.indexOf(group)
    if (idx !== -1) this.placedModels.splice(idx, 1)
    console.log('[Editor] Deleted model')
    this._autoSave()
  }

  recenterSelectedPivot() {
    if (!this.selected) return false

    const group = this.selected
    const worldBoxBefore = new THREE.Box3().setFromObject(group)
    if (worldBoxBefore.isEmpty()) return false

    const worldCenterBefore = worldBoxBefore.getCenter(new THREE.Vector3())
    const localCenter = group.worldToLocal(worldCenterBefore.clone())

    if (localCenter.lengthSq() < 1e-10) return false

    // Move children so the group's origin becomes the visual center.
    for (const child of group.children) {
      child.position.sub(localCenter)
    }

    // Compensate group translation so the model stays in place in world space.
    const worldBoxAfter = new THREE.Box3().setFromObject(group)
    const worldCenterAfter = worldBoxAfter.getCenter(new THREE.Vector3())
    group.position.add(worldCenterBefore.sub(worldCenterAfter))

    this.transformControls.attach(group)
    this._updateInfoPanel()
    console.log('[Editor] Recentered selected model pivot')
    return true
  }

  // ─── Place a model ────────────────────────────────────────────────

  placeModel(name, pos, rot, scl) {
    const gltf = this.resources.items[name]
    if (!gltf) {
      console.warn(`[Editor] Model "${name}" not found in resources`)
      return null
    }

    const clone = gltf.scene.clone()
    clone.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true
        c.receiveShadow = true
      }
    })

    // Normalize authoring pivots so the editor gizmo sits at model center.
    const box = new THREE.Box3().setFromObject(clone)
    if (!box.isEmpty()) {
      const center = box.getCenter(new THREE.Vector3())
      clone.position.sub(center)
    }

    const group = new THREE.Group()
    group.userData._editorModel = true
    group.userData.modelName = name
    group.add(clone)

    if (pos) group.position.set(pos[0], pos[1], pos[2])
    if (rot) group.rotation.set(rot[0], rot[1], rot[2])
    if (scl) group.scale.set(scl[0], scl[1], scl[2])

    this.scene.add(group)
    this.placedModels.push(group)
    return group
  }

  // ─── Save / Load / Clear ──────────────────────────────────────────

  _getLayoutData() {
    const layout = { models: [] }
    for (const g of this.placedModels) {
      const p = g.position
      const r = g.rotation
      const s = g.scale
      layout.models.push({
        name: g.userData.modelName,
        position: [+p.x.toFixed(3), +p.y.toFixed(3), +p.z.toFixed(3)],
        rotation: [+r.x.toFixed(4), +r.y.toFixed(4), +r.z.toFixed(4)],
        scale: [+s.x.toFixed(3), +s.y.toFixed(3), +s.z.toFixed(3)],
      })
    }
    return layout
  }

  saveLayout() {
    const layout = this._getLayoutData()
    const json = JSON.stringify(layout, null, 2)
    localStorage.setItem(STORAGE_KEY, json)
    this._saveToCloud(layout)
    console.log('[Editor] Layout saved')
    return layout
  }

  async _saveToCloud(layout) {
    try {
      const { error } = await supabase
        .from('world_layout')
        .update({ layout, updated_at: new Date().toISOString() })
        .eq('id', 1)
      if (error) throw error
      this._cloudSynced = true
      console.log('[Editor] Cloud save OK')
    } catch (err) {
      this._cloudSynced = false
      console.warn('[Editor] Cloud save failed, localStorage still has it', err)
    }
  }

  _autoSave() {
    clearTimeout(this._saveTimeout)
    this._saveTimeout = setTimeout(() => this.saveLayout(), 800)
  }

  async loadLayout() {
    // Try cloud first
    try {
      const { data, error } = await supabase
        .from('world_layout')
        .select('layout')
        .eq('id', 1)
        .single()
      if (!error && data && data.layout && data.layout.models && data.layout.models.length > 0) {
        this._applyLayout(data.layout)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.layout))
        this._cloudSynced = true
        console.log(`[Editor] Loaded ${data.layout.models.length} models from cloud`)
        return true
      }
    } catch (err) {
      console.warn('[Editor] Cloud load failed, trying localStorage', err)
    }

    // Fall back to localStorage
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      console.log('[Editor] No saved layout found')
      return false
    }
    try {
      const layout = JSON.parse(raw)
      this._applyLayout(layout)
      console.log(`[Editor] Loaded ${layout.models.length} models from localStorage`)
      return true
    } catch (err) {
      console.warn('[Editor] Failed to parse saved layout', err)
      return false
    }
  }

  _applyLayout(layout) {
    // Remove existing placed models
    this.clearAll()

    for (const entry of layout.models) {
      this.placeModel(
        entry.name,
        entry.position,
        entry.rotation,
        entry.scale
      )
    }
  }

  clearAll() {
    this._deselect()
    for (const g of this.placedModels) {
      this.scene.remove(g)
    }
    this.placedModels = []
    console.log('[Editor] Cleared all models')
  }

  hasSavedLayout() {
    return !!localStorage.getItem(STORAGE_KEY)
  }

  async hasSavedLayoutAsync() {
    // Check cloud first
    try {
      const { data, error } = await supabase
        .from('world_layout')
        .select('layout')
        .eq('id', 1)
        .single()
      if (!error && data && data.layout && data.layout.models && data.layout.models.length > 0) {
        return true
      }
    } catch (_) { /* fall through */ }
    return !!localStorage.getItem(STORAGE_KEY)
  }

  // ─── UI Panel ─────────────────────────────────────────────────────

  _buildUI() {
    // Container
    this.panel = document.createElement('div')
    this.panel.id = 'editor-panel'
    this.panel.style.cssText = `
      position: fixed; top: 0; left: 0; bottom: 0;
      width: 260px; background: rgba(10,10,15,0.88);
      color: #ddd; font-family: monospace; font-size: 12px;
      display: none; flex-direction: column; z-index: 9999;
      border-right: 1px solid rgba(68,255,170,0.25);
      user-select: none; overflow: hidden;
    `

    // Header
    const header = document.createElement('div')
    header.style.cssText = `
      padding: 12px 14px; font-size: 14px; font-weight: bold;
      color: #44ffaa; border-bottom: 1px solid rgba(68,255,170,0.2);
      flex-shrink: 0;
    `
    header.textContent = 'CLAWD EDITOR'
    this.panel.appendChild(header)

    // Info panel (selected model)
    this.infoDiv = document.createElement('div')
    this.infoDiv.style.cssText = `
      padding: 8px 14px; font-size: 11px; line-height: 1.5;
      border-bottom: 1px solid rgba(68,255,170,0.15);
      min-height: 60px; flex-shrink: 0; color: #aaa;
    `
    this.infoDiv.innerHTML = '<em>No selection</em>'
    this.panel.appendChild(this.infoDiv)

    // Buttons row
    const btnRow = document.createElement('div')
    btnRow.style.cssText = `
      display: flex; gap: 4px; padding: 8px 14px; flex-shrink: 0;
      flex-wrap: wrap;
    `
    const btnStyle = `
      flex: 1; min-width: 70px; padding: 6px 4px; border: 1px solid rgba(68,255,170,0.3);
      background: rgba(68,255,170,0.08); color: #44ffaa; cursor: pointer;
      font-family: monospace; font-size: 11px; border-radius: 3px;
    `

    const saveBtn = document.createElement('button')
    saveBtn.textContent = 'Save'
    saveBtn.style.cssText = btnStyle
    saveBtn.onclick = () => this.saveLayout()
    btnRow.appendChild(saveBtn)

    const loadBtn = document.createElement('button')
    loadBtn.textContent = 'Load'
    loadBtn.style.cssText = btnStyle
    loadBtn.onclick = () => this.loadLayout()
    btnRow.appendChild(loadBtn)

    const clearBtn = document.createElement('button')
    clearBtn.textContent = 'Clear'
    clearBtn.style.cssText = btnStyle
    clearBtn.onclick = () => {
      if (confirm('Clear all placed models?')) this.clearAll()
    }
    btnRow.appendChild(clearBtn)

    const recenterBtn = document.createElement('button')
    recenterBtn.textContent = 'Recenter'
    recenterBtn.style.cssText = btnStyle
    recenterBtn.onclick = () => {
      if (!this.recenterSelectedPivot()) {
        console.log('[Editor] Select a model first to recenter its pivot')
      }
    }
    btnRow.appendChild(recenterBtn)

    this.panel.appendChild(btnRow)

    // Hint
    const hint = document.createElement('div')
    hint.style.cssText = `
      padding: 4px 14px 8px; font-size: 10px; color: #666;
      border-bottom: 1px solid rgba(68,255,170,0.15); flex-shrink: 0;
    `
    hint.textContent = 'W=move E=rot R=scale | Del=remove | Recenter=pivot'
    this.panel.appendChild(hint)

    // Model grid label
    const gridLabel = document.createElement('div')
    gridLabel.style.cssText = `
      padding: 8px 14px 4px; font-size: 11px; color: #44ffaa;
      flex-shrink: 0;
    `
    gridLabel.textContent = 'MODELS'
    this.panel.appendChild(gridLabel)

    // Model grid (scrollable)
    const grid = document.createElement('div')
    grid.style.cssText = `
      flex: 1; overflow-y: auto; padding: 4px 10px 14px;
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 4px; align-content: start;
    `

    for (const name of EDITOR_MODEL_NAMES) {
      const btn = document.createElement('button')
      btn.title = name
      btn.style.cssText = `
        padding: 4px; border: 1px solid rgba(255,255,255,0.12);
        background: rgba(255,255,255,0.04); color: #ccc; cursor: pointer;
        font-family: monospace; font-size: 9px; border-radius: 3px;
        display: flex; flex-direction: column; align-items: center;
        gap: 2px; min-height: 90px; justify-content: center;
      `

      // Thumbnail canvas
      const thumbCanvas = document.createElement('canvas')
      thumbCanvas.width = 100
      thumbCanvas.height = 70
      thumbCanvas.style.cssText = 'width: 100%; height: 64px; border-radius: 2px;'
      btn.appendChild(thumbCanvas)

      // Label
      const label = document.createElement('span')
      label.textContent = name
      label.style.cssText = 'text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 100%;'
      btn.appendChild(label)

      // Render thumbnail once resources are available
      this._renderThumbnail(name, thumbCanvas)

      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(68,255,170,0.15)'
        btn.style.borderColor = 'rgba(68,255,170,0.4)'
      })
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(255,255,255,0.04)'
        btn.style.borderColor = 'rgba(255,255,255,0.12)'
      })
      btn.addEventListener('click', () => {
        const s = DEFAULT_SCALES[name] || DEFAULT_SCALE
        const group = this.placeModel(name, [0, 0, 0], [0, 0, 0], [s, s, s])
        if (group) {
          this._select(group)
          console.log(`[Editor] Placed "${name}" at origin, scale ${s}`)
          this._autoSave()
        }
      })
      grid.appendChild(btn)
    }

    this.panel.appendChild(grid)

    document.body.appendChild(this.panel)
  }

  _updateInfoPanel() {
    if (!this.selected) {
      this.infoDiv.innerHTML = '<em>No selection</em>'
      return
    }
    const g = this.selected
    const p = g.position
    const r = g.rotation
    const s = g.scale
    this.infoDiv.innerHTML = `
      <div style="color:#44ffaa;font-weight:bold;margin-bottom:2px">${g.userData.modelName}</div>
      <div>pos: ${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}</div>
      <div>rot: ${r.x.toFixed(2)}, ${r.y.toFixed(2)}, ${r.z.toFixed(2)}</div>
      <div>scl: ${s.x.toFixed(2)}, ${s.y.toFixed(2)}, ${s.z.toFixed(2)}</div>
    `
  }

  // ─── Thumbnail rendering ──────────────────────────────────────────

  _renderThumbnail(name, canvas) {
    const gltf = this.resources.items[name]
    if (!gltf) {
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#222'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#666'
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('no model', canvas.width / 2, canvas.height / 2 + 4)
      return
    }

    // Use the main renderer to avoid WebGL context limits
    const renderer = this.experience.renderer.instance
    const w = canvas.width
    const h = canvas.height

    // Build a mini scene
    const thumbScene = new THREE.Scene()
    thumbScene.background = new THREE.Color(0x111118)
    const thumbCam = new THREE.PerspectiveCamera(40, w / h, 0.01, 100)

    thumbScene.add(new THREE.AmbientLight(0xffffff, 0.8))
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight.position.set(2, 3, 4)
    thumbScene.add(dirLight)

    const model = gltf.scene.clone()
    thumbScene.add(model)

    // Fit camera to bounding box
    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const dist = maxDim / (2 * Math.tan((thumbCam.fov * Math.PI) / 360)) * 1.4
    thumbCam.position.set(center.x + dist * 0.6, center.y + dist * 0.4, center.z + dist)
    thumbCam.lookAt(center)

    // Save renderer state, render thumbnail, restore
    const prevRenderTarget = renderer.getRenderTarget()
    const prevSize = renderer.getSize(new THREE.Vector2())
    const prevScissorTest = renderer.getScissorTest()

    renderer.setSize(w, h, false)
    renderer.setScissorTest(false)
    renderer.render(thumbScene, thumbCam)

    // Copy pixels to the button's canvas
    const ctx = canvas.getContext('2d')
    ctx.drawImage(renderer.domElement, 0, 0, w, h)

    // Restore renderer
    renderer.setSize(prevSize.x, prevSize.y, false)
    renderer.setScissorTest(prevScissorTest)
    renderer.setRenderTarget(prevRenderTarget)

    thumbScene.remove(model)
  }

  // Called every frame to keep info panel fresh while dragging
  update() {
    if (this.active && this.selected) {
      this._updateInfoPanel()
    }
  }
}
