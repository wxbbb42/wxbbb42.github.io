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
      // ── Characters ──
      { name: 'alien',             type: 'gltf', path: './models/space/alien.glb' },
      { name: 'astronaut',         type: 'gltf', path: './models/space/astronautA.glb' },
      { name: 'astronautPlayer',   type: 'gltf', path: './models/space/astronautB.glb' },
      { name: 'player',            type: 'gltf', path: './models/characters/player.glb' },
      { name: 'agentClaw',         type: 'gltf', path: './models/characters/agent_claw.glb' },
      { name: 'agentCoin',         type: 'gltf', path: './models/characters/agent_coin.glb' },
      { name: 'agentNeo',          type: 'gltf', path: './models/characters/agent_neo.glb' },

      // ── Structures ──
      { name: 'hangarLargeA',      type: 'gltf', path: './models/space/hangar_largeA.glb' },
      { name: 'hangarLargeB',      type: 'gltf', path: './models/space/hangar_largeB.glb' },
      { name: 'hangarRoundA',      type: 'gltf', path: './models/space/hangar_roundA.glb' },
      { name: 'hangarRoundB',      type: 'gltf', path: './models/space/hangar_roundB.glb' },
      { name: 'hangarRoundGlass',  type: 'gltf', path: './models/space/hangar_roundGlass.glb' },
      { name: 'hangarSmallA',      type: 'gltf', path: './models/space/hangar_smallA.glb' },
      { name: 'hangarSmallB',      type: 'gltf', path: './models/space/hangar_smallB.glb' },
      { name: 'structure',         type: 'gltf', path: './models/space/structure.glb' },
      { name: 'structureClosed',   type: 'gltf', path: './models/space/structure_closed.glb' },
      { name: 'structureDetailed', type: 'gltf', path: './models/space/structure_detailed.glb' },
      { name: 'structureDiagonal', type: 'gltf', path: './models/space/structure_diagonal.glb' },
      { name: 'gateComplex',       type: 'gltf', path: './models/space/gate_complex.glb' },
      { name: 'gateSimple',        type: 'gltf', path: './models/space/gate_simple.glb' },
      { name: 'chimney',           type: 'gltf', path: './models/space/chimney.glb' },
      { name: 'chimneyDetailed',   type: 'gltf', path: './models/space/chimney_detailed.glb' },

      // ── Corridors ──
      { name: 'corridor',                  type: 'gltf', path: './models/space/corridor.glb' },
      { name: 'corridorCorner',            type: 'gltf', path: './models/space/corridor_corner.glb' },
      { name: 'corridorCornerRound',       type: 'gltf', path: './models/space/corridor_cornerRound.glb' },
      { name: 'corridorCornerRoundWindow', type: 'gltf', path: './models/space/corridor_cornerRoundWindow.glb' },
      { name: 'corridorCross',             type: 'gltf', path: './models/space/corridor_cross.glb' },
      { name: 'corridorDetailed',          type: 'gltf', path: './models/space/corridor_detailed.glb' },
      { name: 'corridorEnd',               type: 'gltf', path: './models/space/corridor_end.glb' },
      { name: 'corridorOpen',              type: 'gltf', path: './models/space/corridor_open.glb' },
      { name: 'corridorRoof',              type: 'gltf', path: './models/space/corridor_roof.glb' },
      { name: 'corridorSplit',             type: 'gltf', path: './models/space/corridor_split.glb' },
      { name: 'corridorWall',              type: 'gltf', path: './models/space/corridor_wall.glb' },
      { name: 'corridorWallCorner',        type: 'gltf', path: './models/space/corridor_wallCorner.glb' },
      { name: 'corridorWindow',            type: 'gltf', path: './models/space/corridor_window.glb' },
      { name: 'corridorWindowClosed',      type: 'gltf', path: './models/space/corridor_windowClosed.glb' },

      // ── Rocket parts ──
      { name: 'rocketBaseA',   type: 'gltf', path: './models/space/rocket_baseA.glb' },
      { name: 'rocketBaseB',   type: 'gltf', path: './models/space/rocket_baseB.glb' },
      { name: 'rocketFinsA',   type: 'gltf', path: './models/space/rocket_finsA.glb' },
      { name: 'rocketFinsB',   type: 'gltf', path: './models/space/rocket_finsB.glb' },
      { name: 'rocketFuelA',   type: 'gltf', path: './models/space/rocket_fuelA.glb' },
      { name: 'rocketFuelB',   type: 'gltf', path: './models/space/rocket_fuelB.glb' },
      { name: 'rocketSidesA',  type: 'gltf', path: './models/space/rocket_sidesA.glb' },
      { name: 'rocketSidesB',  type: 'gltf', path: './models/space/rocket_sidesB.glb' },
      { name: 'rocketTopA',    type: 'gltf', path: './models/space/rocket_topA.glb' },
      { name: 'rocketTopB',    type: 'gltf', path: './models/space/rocket_topB.glb' },

      // ── Crafts ──
      { name: 'craftCargoA',   type: 'gltf', path: './models/space/craft_cargoA.glb' },
      { name: 'craftCargoB',   type: 'gltf', path: './models/space/craft_cargoB.glb' },
      { name: 'craftMiner',    type: 'gltf', path: './models/space/craft_miner.glb' },
      { name: 'craftRacer',    type: 'gltf', path: './models/space/craft_racer.glb' },
      { name: 'craftSpeederA', type: 'gltf', path: './models/space/craft_speederA.glb' },
      { name: 'craftSpeederB', type: 'gltf', path: './models/space/craft_speederB.glb' },
      { name: 'craftSpeederC', type: 'gltf', path: './models/space/craft_speederC.glb' },
      { name: 'craftSpeederD', type: 'gltf', path: './models/space/craft_speederD.glb' },

      // ── Rocks & terrain ──
      { name: 'rock',               type: 'gltf', path: './models/space/rock.glb' },
      { name: 'rockLargeA',         type: 'gltf', path: './models/space/rock_largeA.glb' },
      { name: 'rockLargeB',         type: 'gltf', path: './models/space/rock_largeB.glb' },
      { name: 'rocksSmallA',        type: 'gltf', path: './models/space/rocks_smallA.glb' },
      { name: 'rocksSmallB',        type: 'gltf', path: './models/space/rocks_smallB.glb' },
      { name: 'rockCrystals',       type: 'gltf', path: './models/space/rock_crystals.glb' },
      { name: 'rockCrystalsLargeA', type: 'gltf', path: './models/space/rock_crystalsLargeA.glb' },
      { name: 'rockCrystalsLargeB', type: 'gltf', path: './models/space/rock_crystalsLargeB.glb' },
      { name: 'crater',             type: 'gltf', path: './models/space/crater.glb' },
      { name: 'craterLarge',        type: 'gltf', path: './models/space/craterLarge.glb' },
      { name: 'meteor',             type: 'gltf', path: './models/space/meteor.glb' },
      { name: 'meteorDetailed',     type: 'gltf', path: './models/space/meteor_detailed.glb' },
      { name: 'meteorHalf',         type: 'gltf', path: './models/space/meteor_half.glb' },
      { name: 'bones',              type: 'gltf', path: './models/space/bones.glb' },

      // ── Terrain pieces ──
      { name: 'terrain',                  type: 'gltf', path: './models/space/terrain.glb' },
      { name: 'terrainRamp',              type: 'gltf', path: './models/space/terrain_ramp.glb' },
      { name: 'terrainRampLarge',         type: 'gltf', path: './models/space/terrain_rampLarge.glb' },
      { name: 'terrainRampLargeDetailed', type: 'gltf', path: './models/space/terrain_rampLarge_detailed.glb' },
      { name: 'terrainRoadCorner',        type: 'gltf', path: './models/space/terrain_roadCorner.glb' },
      { name: 'terrainRoadCross',         type: 'gltf', path: './models/space/terrain_roadCross.glb' },
      { name: 'terrainRoadEnd',           type: 'gltf', path: './models/space/terrain_roadEnd.glb' },
      { name: 'terrainRoadSplit',         type: 'gltf', path: './models/space/terrain_roadSplit.glb' },
      { name: 'terrainRoadStraight',      type: 'gltf', path: './models/space/terrain_roadStraight.glb' },
      { name: 'terrainSide',              type: 'gltf', path: './models/space/terrain_side.glb' },
      { name: 'terrainSideCliff',         type: 'gltf', path: './models/space/terrain_sideCliff.glb' },
      { name: 'terrainSideCorner',        type: 'gltf', path: './models/space/terrain_sideCorner.glb' },
      { name: 'terrainSideCornerInner',   type: 'gltf', path: './models/space/terrain_sideCornerInner.glb' },
      { name: 'terrainSideEnd',           type: 'gltf', path: './models/space/terrain_sideEnd.glb' },

      // ── Props & machines ──
      { name: 'barrel',              type: 'gltf', path: './models/space/barrel.glb' },
      { name: 'barrels',             type: 'gltf', path: './models/space/barrels.glb' },
      { name: 'barrelsRail',         type: 'gltf', path: './models/space/barrels_rail.glb' },
      { name: 'machineBarrel',       type: 'gltf', path: './models/space/machine_barrel.glb' },
      { name: 'machineBarrelLarge',  type: 'gltf', path: './models/space/machine_barrelLarge.glb' },
      { name: 'machineGenerator',    type: 'gltf', path: './models/space/machine_generator.glb' },
      { name: 'machineGeneratorLarge', type: 'gltf', path: './models/space/machine_generatorLarge.glb' },
      { name: 'machineWireless',     type: 'gltf', path: './models/space/machine_wireless.glb' },
      { name: 'machineWirelessCable', type: 'gltf', path: './models/space/machine_wirelessCable.glb' },
      { name: 'satelliteDish',       type: 'gltf', path: './models/space/satelliteDish.glb' },
      { name: 'satelliteDishDetailed', type: 'gltf', path: './models/space/satelliteDish_detailed.glb' },
      { name: 'satelliteDishLarge',  type: 'gltf', path: './models/space/satelliteDish_large.glb' },
      { name: 'rover',              type: 'gltf', path: './models/space/rover.glb' },
      { name: 'turretSingle',       type: 'gltf', path: './models/space/turret_single.glb' },
      { name: 'turretDouble',       type: 'gltf', path: './models/space/turret_double.glb' },
      { name: 'weaponGun',          type: 'gltf', path: './models/space/weapon_gun.glb' },
      { name: 'weaponRifle',        type: 'gltf', path: './models/space/weapon_rifle.glb' },

      // ── Rails ──
      { name: 'rail',        type: 'gltf', path: './models/space/rail.glb' },
      { name: 'railCorner',  type: 'gltf', path: './models/space/rail_corner.glb' },
      { name: 'railEnd',     type: 'gltf', path: './models/space/rail_end.glb' },
      { name: 'railMiddle',  type: 'gltf', path: './models/space/rail_middle.glb' },

      // ── Pipes ──
      { name: 'pipeCorner',           type: 'gltf', path: './models/space/pipe_corner.glb' },
      { name: 'pipeCornerDiagonal',   type: 'gltf', path: './models/space/pipe_cornerDiagonal.glb' },
      { name: 'pipeCornerRound',      type: 'gltf', path: './models/space/pipe_cornerRound.glb' },
      { name: 'pipeCornerRoundLarge', type: 'gltf', path: './models/space/pipe_cornerRoundLarge.glb' },
      { name: 'pipeCross',            type: 'gltf', path: './models/space/pipe_cross.glb' },
      { name: 'pipeEnd',              type: 'gltf', path: './models/space/pipe_end.glb' },
      { name: 'pipeEntrance',         type: 'gltf', path: './models/space/pipe_entrance.glb' },
      { name: 'pipeOpen',             type: 'gltf', path: './models/space/pipe_open.glb' },
      { name: 'pipeRampLarge',        type: 'gltf', path: './models/space/pipe_rampLarge.glb' },
      { name: 'pipeRampSmall',        type: 'gltf', path: './models/space/pipe_rampSmall.glb' },
      { name: 'pipeRing',             type: 'gltf', path: './models/space/pipe_ring.glb' },
      { name: 'pipeRingHigh',         type: 'gltf', path: './models/space/pipe_ringHigh.glb' },
      { name: 'pipeRingHighEnd',      type: 'gltf', path: './models/space/pipe_ringHighEnd.glb' },
      { name: 'pipeRingSupport',      type: 'gltf', path: './models/space/pipe_ringSupport.glb' },
      { name: 'pipeSplit',            type: 'gltf', path: './models/space/pipe_split.glb' },
      { name: 'pipeStraight',         type: 'gltf', path: './models/space/pipe_straight.glb' },
      { name: 'pipeSupportHigh',      type: 'gltf', path: './models/space/pipe_supportHigh.glb' },
      { name: 'pipeSupportLow',       type: 'gltf', path: './models/space/pipe_supportLow.glb' },

      // ── Platforms ──
      { name: 'platformCenter',        type: 'gltf', path: './models/space/platform_center.glb' },
      { name: 'platformCorner',        type: 'gltf', path: './models/space/platform_corner.glb' },
      { name: 'platformCornerOpen',    type: 'gltf', path: './models/space/platform_cornerOpen.glb' },
      { name: 'platformCornerRound',   type: 'gltf', path: './models/space/platform_cornerRound.glb' },
      { name: 'platformEnd',           type: 'gltf', path: './models/space/platform_end.glb' },
      { name: 'platformHigh',          type: 'gltf', path: './models/space/platform_high.glb' },
      { name: 'platformLarge',         type: 'gltf', path: './models/space/platform_large.glb' },
      { name: 'platformLong',          type: 'gltf', path: './models/space/platform_long.glb' },
      { name: 'platformLow',           type: 'gltf', path: './models/space/platform_low.glb' },
      { name: 'platformSide',          type: 'gltf', path: './models/space/platform_side.glb' },
      { name: 'platformSmall',         type: 'gltf', path: './models/space/platform_small.glb' },
      { name: 'platformSmallDiagonal', type: 'gltf', path: './models/space/platform_smallDiagonal.glb' },
      { name: 'platformStraight',      type: 'gltf', path: './models/space/platform_straight.glb' },

      // ── Monorail ──
      { name: 'monorailTrackCornerLarge',  type: 'gltf', path: './models/space/monorail_trackCornerLarge.glb' },
      { name: 'monorailTrackCornerSmall',  type: 'gltf', path: './models/space/monorail_trackCornerSmall.glb' },
      { name: 'monorailTrackSlope',        type: 'gltf', path: './models/space/monorail_trackSlope.glb' },
      { name: 'monorailTrackStraight',     type: 'gltf', path: './models/space/monorail_trackStraight.glb' },
      { name: 'monorailTrackSupport',      type: 'gltf', path: './models/space/monorail_trackSupport.glb' },
      { name: 'monorailTrackSupportCorner', type: 'gltf', path: './models/space/monorail_trackSupportCorner.glb' },
      { name: 'monorailTrainBox',          type: 'gltf', path: './models/space/monorail_trainBox.glb' },
      { name: 'monorailTrainCargo',        type: 'gltf', path: './models/space/monorail_trainCargo.glb' },
      { name: 'monorailTrainEnd',          type: 'gltf', path: './models/space/monorail_trainEnd.glb' },
      { name: 'monorailTrainFlat',         type: 'gltf', path: './models/space/monorail_trainFlat.glb' },
      { name: 'monorailTrainFront',        type: 'gltf', path: './models/space/monorail_trainFront.glb' },
      { name: 'monorailTrainPassenger',    type: 'gltf', path: './models/space/monorail_trainPassenger.glb' },

      // ── Interior / desk ──
      { name: 'deskChair',          type: 'gltf', path: './models/space/desk_chair.glb' },
      { name: 'deskChairArms',      type: 'gltf', path: './models/space/desk_chairArms.glb' },
      { name: 'deskChairStool',     type: 'gltf', path: './models/space/desk_chairStool.glb' },
      { name: 'deskComputer',       type: 'gltf', path: './models/space/desk_computer.glb' },
      { name: 'deskComputerCorner', type: 'gltf', path: './models/space/desk_computerCorner.glb' },
      { name: 'deskComputerScreen', type: 'gltf', path: './models/space/desk_computerScreen.glb' },

      // ── Stairs & supports ──
      { name: 'stairs',        type: 'gltf', path: './models/space/stairs.glb' },
      { name: 'stairsCorner',  type: 'gltf', path: './models/space/stairs_corner.glb' },
      { name: 'stairsShort',   type: 'gltf', path: './models/space/stairs_short.glb' },
      { name: 'supportsHigh',  type: 'gltf', path: './models/space/supports_high.glb' },
      { name: 'supportsLow',   type: 'gltf', path: './models/space/supports_low.glb' },
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
