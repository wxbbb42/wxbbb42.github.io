export function lerp(a, b, t) {
  return a + (b - a) * t
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function distance2D(x1, z1, x2, z2) {
  const dx = x1 - x2
  const dz = z1 - z2
  return Math.sqrt(dx * dx + dz * dz)
}

/**
 * Fix Quaternius character skin: override dark Skin material with a human skin tone.
 */
export function fixCharacterSkin(model, skinColor) {
  model.traverse((child) => {
    if (child.isMesh && child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material]
      for (const mat of mats) {
        if (mat.name === 'Skin') {
          mat.color.setHex(skinColor)
        }
      }
    }
  })
}
