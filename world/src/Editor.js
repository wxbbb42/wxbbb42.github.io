import * as THREE from 'three'
import { TransformControls } from 'three/addons/controls/TransformControls.js'

const STORAGE_KEY = 'clawd-world-editor-layout'

const EDITOR_MODEL_NAMES = [
  'hangarLargeA', 'hangarRoundGlass', 'hangarSmallA', 'structureDetailed',
  'rocketBaseA', 'rocketFinsA', 'rocketFuelA', 'rocketSidesA', 'rocketTopA',
  'rockLargeA', 'rockLargeB', 'rocksSmallA', 'rocksSmallB',
  'rockCrystals', 'rockCrystalsLargeA', 'crater', 'craterLarge', 'meteorHalf',
  'satelliteDishLarge', 'machineGenerator', 'machineWireless',
  'barrel', 'barrels', 'rover', 'turretSingle', 'rail', 'bones',
  'deskComputer', 'deskChairArms', 'astronaut', 'astronautPlayer',
]

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
    })
    this.scene.add(this.transformControls.getHelper())

    // Selection highlight material color
    this._originalMaterials = new Map()

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

  saveLayout() {
    const layout = { models: [] }
    for (const g of this.placedModels) {
      const p = g.position
      const r = g.rotation
      const s = g.scale
      layout.models.push({
        name: g.userData.modelName,
        position: [+p.x.toFixed(3), +p.y.toFixed(3), +p.z.toFixed(3)],
        rotation: [+r.x.toFixed(4), +r.y.toFixed(4), +r.z.toFixed(4)],
        scale:    [+s.x.toFixed(3), +s.y.toFixed(3), +s.z.toFixed(3)],
      })
    }
    const json = JSON.stringify(layout, null, 2)
    localStorage.setItem(STORAGE_KEY, json)
    console.log('[Editor] Layout saved', json)
    return layout
  }

  loadLayout() {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      console.log('[Editor] No saved layout found')
      return false
    }
    try {
      const layout = JSON.parse(raw)
      this._applyLayout(layout)
      console.log(`[Editor] Loaded ${layout.models.length} models`)
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

    this.panel.appendChild(btnRow)

    // Hint
    const hint = document.createElement('div')
    hint.style.cssText = `
      padding: 4px 14px 8px; font-size: 10px; color: #666;
      border-bottom: 1px solid rgba(68,255,170,0.15); flex-shrink: 0;
    `
    hint.textContent = 'W=move E=rot R=scale | Del=remove'
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
      btn.textContent = name
      btn.title = name
      btn.style.cssText = `
        padding: 6px 4px; border: 1px solid rgba(255,255,255,0.12);
        background: rgba(255,255,255,0.04); color: #ccc; cursor: pointer;
        font-family: monospace; font-size: 10px; border-radius: 3px;
        text-overflow: ellipsis; overflow: hidden; white-space: nowrap;
      `
      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(68,255,170,0.15)'
        btn.style.borderColor = 'rgba(68,255,170,0.4)'
      })
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(255,255,255,0.04)'
        btn.style.borderColor = 'rgba(255,255,255,0.12)'
      })
      btn.addEventListener('click', () => {
        const group = this.placeModel(name, [0, 0, 0], [0, 0, 0], [1, 1, 1])
        if (group) {
          this._select(group)
          console.log(`[Editor] Placed "${name}" at origin`)
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

  // Called every frame to keep info panel fresh while dragging
  update() {
    if (this.active && this.selected) {
      this._updateInfoPanel()
    }
  }
}
