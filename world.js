import * as THREE from 'three'
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js'

const status = document.querySelector('#status')
let renderer
try {
  renderer = new THREE.WebGLRenderer({ antialias: true })
} catch (error) {
  status.textContent = 'WebGL konnte nicht gestartet werden.'
  throw error
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.shadowMap.autoUpdate = false
renderer.shadowMap.needsUpdate = true
renderer.toneMapping = THREE.ACESFilmicToneMapping
document.body.prepend(renderer.domElement)

const scene = new THREE.Scene()
scene.background = new THREE.Color('#b9d0df')
scene.fog = new THREE.FogExp2('#b9d0df', 0.007)
const camera = new THREE.PerspectiveCamera(65, 1, 0.08, 260)
scene.add(new THREE.HemisphereLight('#d9ebff', '#b2a287', 2.1))
const sun = new THREE.DirectionalLight('#fff0db', 2.4)
sun.position.set(-27, 42, 24)
sun.castShadow = true
Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 31, bottom: -31, near: 1, far: 110 })
sun.shadow.mapSize.set(2048, 2048)
sun.shadow.normalBias = 0.027
scene.add(sun, sun.target)

let seed = 1873
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
  return seed / 4294967296
}
function surface(color, variation = 0, repeat = 1) {
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.94 })
  if (!variation) return material
  const size = 128
  const data = new Uint8Array(size * size * 4)
  for (let i = 0; i < data.length; i += 4) {
    const value = Math.round(255 - random() * variation)
    data.set([value, value, value, 255], i)
  }
  const map = new THREE.DataTexture(data, size, size)
  map.wrapS = map.wrapT = THREE.RepeatWrapping
  map.repeat.setScalar(repeat)
  map.magFilter = THREE.LinearFilter
  map.minFilter = THREE.LinearMipmapLinearFilter
  map.generateMipmaps = true
  map.needsUpdate = true
  material.map = map
  return material
}
const grass = surface('#687c49', 85, 90)
const asphalt = surface('#666567', 76)
const paving = surface('#aaa498', 60)
const curb = surface('#b5b0a2')
const frames = surface('#d2cbbd')
const glass = surface('#34444b')
const bark = surface('#564438')
const leaves = ['#536736', '#60743d', '#6b7f48'].map(color => surface(color))
const walls = ['#bfb7a0', '#d3c9b4', '#a58069', '#c8b7a0'].map(color => surface(color))
const roofs = ['#514d49', '#704439', '#8b5743'].map(color => surface(color))
const unitBox = new THREE.BoxGeometry()
function mesh(parent, geometry, material, x, y, z, shadow = true) {
  const object = new THREE.Mesh(geometry, material)
  object.position.set(x, y, z)
  object.castShadow = shadow
  object.receiveShadow = true
  parent.add(object)
  return object
}
function box(parent, material, x, y, z, w, h, d, shadow = true) {
  const object = mesh(parent, unitBox, material, x, y, z, shadow)
  object.scale.set(w, h, d)
  return object
}
box(scene, grass, 0, -0.25, 0, 260, 0.36, 140, false)

// Local metres. Road shape traced approximately from the supplied aerial view.
const centerline = new THREE.CatmullRomCurve3(
  [[-110, 4], [-76, 4], [-58, 5], [-43, 10], [-32, 9], [-20, 4],
    [-9, 0.8], [0, 0], [15, 1.2], [32, 3.6], [51, 7], [72, 11], [110, 17]]
    .map(([x, z]) => new THREE.Vector3(x, 0, z))
)
centerline.arcLengthDivisions = 1000
centerline.updateArcLengths()
const length = centerline.getLength()
const midpoint = centerline.getLengths().findIndex((_, index) => centerline.getPoint(index / 1000).x >= 0)
const start = (centerline.getLengths()[midpoint] - 100) / length
const points = Array.from({ length: 201 }, (_, i) => {
  const u = start + i / length
  const p = centerline.getPointAt(u)
  const t = centerline.getTangentAt(u)
  return { p, nx: -t.z, nz: t.x }
})
function strip(material, left, right, leftY, rightY = leftY) {
  const positions = [], uv = [], indices = []
  points.forEach(({ p, nx, nz }, i) => {
    positions.push(p.x + nx * left, leftY, p.z + nz * left,
      p.x + nx * right, rightY, p.z + nz * right)
    uv.push(left / 2, i / 2, right / 2, i / 2)
    const v = i * 2
    if (i) indices.push(v - 2, v - 1, v, v - 1, v + 1, v)
  })
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  material.side = THREE.DoubleSide
  mesh(scene, geometry, material, 0, 0, 0, false)
}
strip(asphalt, -3.1, 3.1, 0)
strip(paving, -5.1, -3.25, 0.12)
strip(paving, 3.25, 5.1, 0.12)
strip(curb, -3.25, -3.1, 0.12)
strip(curb, 3.1, 3.25, 0.12)
strip(curb, -3.1, -3.1, 0.12, 0)
strip(curb, 3.1, 3.1, 0, 0.12)

const obstacles = []
function house(x, z, width, depth, height, type, angle, front) {
  const group = new THREE.Group()
  group.position.set(x, -0.04, z)
  group.rotation.y = angle
  scene.add(group)
  obstacles.push({ group, minX: -width / 2, maxX: width / 2, minZ: -depth / 2, maxZ: depth / 2 })
  const wall = walls[type % walls.length]
  const roof = roofs[type % roofs.length]
  box(group, wall, 0, height / 2, 0, width, height, depth)
  const rise = Math.min(3.2, depth * 0.39)
  const w = width / 2 + 0.22
  const d = depth / 2 + 0.23
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -w,height,-d, w,height,-d, w,height,d, -w,height,d, -w,height+rise,0, w,height+rise,0
  ], 3))
  geometry.setIndex([0,4,1,1,4,5,3,2,4,2,5,4,0,3,4,1,5,2])
  geometry.computeVertexNormals()
  roof.side = THREE.DoubleSide
  mesh(group, geometry, roof, 0, 0, 0)
  const columns = Math.max(2, Math.floor(width / 2.8))
  const floors = height > 4.4 ? 2 : 1
  for (let i = 0; i < columns; i++) {
    for (let level = 0; level < floors; level++) {
      const windowX = -width / 2 + width * (i + 0.5) / columns
      const y = 1.65 + level * 2.4
      const face = front * depth / 2
      const door = i === 0 && !level
      box(group, frames, windowX, door ? 1.08 : y, face, 1.04, door ? 2.15 : 1.26, 0.16)
      box(group, glass, windowX, door ? 1.08 : y, face + front * 0.09, 0.84, door ? 1.93 : 1.05, 0.04)
      if (!door) box(group, frames, windowX, y - 0.64, face + front * 0.13, 1.13, 0.07, 0.29)
    }
  }
}

// Neighbouring massing approximated from the aerial reference, with representative facades.
const neighbours = [
  [-67,-9,14,9,4,1,-0.09],[-51,-10,11,8,4.5,2,0.04],[-36,-13,11,9,4.3,3,0.4],
  [-26,-22,12,13,5.2,0,0.09],[-13,-25,12,10,4.3,2,0.08],[20,-12,10,8,4.8,3,-0.1],
  [33,-10,12,8,4.1,1,-0.11],[46,-11,11,9,5.1,0,-0.1],[62,-8,12,8,4.8,2,-0.17],
  [77,-7,12,10,4.1,3,-0.17],
  [-61,21,12,9,4.5,2,0.15],[-45,21,12,8,4,0,0.2],[-32,18,9,9,4.4,3,0.17],
  [-22,16,10,10,4.4,1,-0.23],[-7,16,9,10,4.7,2,-0.2],[8,18,11,9,5.1,0,-0.2],
  [21,19,9,10,4.4,3,-0.18],[36,20,13,9,4.5,2,-0.18],[52,22,11,10,4.5,1,-0.15],
  [69,26,13,9,5.1,0,-0.15],[85,28,11,10,4.3,3,-0.15]
]
for (const [x,z,w,d,h,type,angle] of neighbours) house(x,z,w,d,h,type,angle,z < 0 ? 1 : -1)

const crown = new THREE.IcosahedronGeometry(1, 2)
const trunk = new THREE.CylinderGeometry(0.105, 0.21, 3.4, 8)
for (const [x,z] of [[-33,-17],[-31,-21],[-23,-27],[-16,-34],[-8,-28],[14,-11],[15,-20],
  [25,-20],[36,-21],[56,-17],[68,-16],[-56,15],[-40,21],[-24,22],[-14,24],[0,23],
  [14,22],[26,15],[30,18],[46,18],[59,22],[80,22],[-79,17],[94,24],[-81,-7]]) {
  mesh(scene, trunk, bark, x, 1.56, z)
  for (let i = 0; i < 6; i++) {
    const ball = mesh(scene, crown, leaves[i % 3],
      x + (random() - 0.5) * 3.1, 3.2 + random() * 2.2, z + (random() - 0.5) * 3.1)
    ball.scale.set(1.35 + random(), 1.5 + random(), 1.25 + random())
    ball.rotation.y = random() * Math.PI
  }
}

// Base colors from the Blender source for materials with procedural shading.
const originalColors = {
  'Dach dunkelbraun': [0.065, 0.042, 0.033],
  'Fensterlaibung und Fensterbank': [0.55, 0.49, 0.37],
  'Strukturglas': [0.34, 0.35, 0.31],
  'Dachziegel 0': [0.0584, 0.0376, 0.028],
  'Dachziegel 1': [0.06643, 0.04277, 0.03185],
  'Dachziegel 2': [0.073, 0.047, 0.035],
  'Dachziegel 3': [0.08176, 0.05264, 0.0392],
  'Dachziegel 4': [0.09052, 0.05828, 0.0434],
  'Klinker 0': [0.288, 0.124, 0.0632],
  'Klinker 1': [0.3312, 0.1426, 0.07268],
  'Klinker 2': [0.36, 0.155, 0.079],
  'Klinker 3': [0.3996, 0.17205, 0.08769],
  'Klinker 4': [0.4284, 0.18445, 0.09401],
}
const anchor = new THREE.Group()
anchor.position.set(-11.7, 0, -8.8)
anchor.rotation.y = 0.015
scene.add(anchor)
await new GLTFLoader().loadAsync('./assets/models/Haus-Aussenmodell.glb').then(({ scene: model }) => {
  model.traverse(object => {
    if (!object.isMesh) return
    object.castShadow = object.receiveShadow = true
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials) {
      const rgb = originalColors[material.name]
      if (rgb) material.color.setRGB(...rgb)
    }
  })
  anchor.add(model)
  obstacles.push({ group: anchor, minX: 0, maxX: 23.72, minZ: -7.8, maxZ: 0.12 })
  status.textContent = 'Erster Bauabschnitt · 200 m'
  document.body.dataset.ready = 'true'
}).catch(error => {
  console.error(error)
  status.textContent = 'Das Originalhaus konnte nicht geladen werden.'
})

let yaw, pitch
const keys = new Set()
function reset() {
  camera.position.set(-10.8, 1.76, 5.0)
  yaw = -0.46
  pitch = 0.08
}
reset()
document.querySelector('#reset').addEventListener('click', reset)
const movementKeys = ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight']
window.addEventListener('keydown', event => {
  if (!movementKeys.includes(event.code)) return
  event.preventDefault()
  keys.add(event.code)
})
window.addEventListener('keyup', event => keys.delete(event.code))
window.addEventListener('blur', () => keys.clear())
for (const button of document.querySelectorAll('[data-key]')) {
  button.addEventListener('pointerdown', event => {
    button.setPointerCapture(event.pointerId)
    keys.add(button.dataset.key)
  })
  button.addEventListener('lostpointercapture', () => keys.delete(button.dataset.key))
}
const canvas = renderer.domElement
let lookPointer, lookX, lookY
canvas.addEventListener('pointerdown', event => {
  if (lookPointer !== undefined) return
  lookPointer = event.pointerId
  lookX = event.clientX
  lookY = event.clientY
  canvas.setPointerCapture(lookPointer)
})
canvas.addEventListener('pointermove', event => {
  if (event.pointerId !== lookPointer) return
  yaw -= (event.clientX - lookX) * 0.005
  pitch = THREE.MathUtils.clamp(pitch - (event.clientY - lookY) * 0.004, -1.25, 1.25)
  lookX = event.clientX
  lookY = event.clientY
})
canvas.addEventListener('lostpointercapture', () => { lookPointer = undefined })
function resize() {
  renderer.setSize(innerWidth, innerHeight)
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
}
window.addEventListener('resize', resize)
resize()
scene.updateMatrixWorld(true)
const local = new THREE.Vector3()
function canWalk(x, z) {
  if (x < points[0].p.x || x > points.at(-1).p.x || Math.abs(z) > 32) return false
  return !obstacles.some(({ group, minX, maxX, minZ, maxZ }) => {
    group.worldToLocal(local.set(x, 0, z))
    return local.x > minX - 0.26 && local.x < maxX + 0.26 &&
      local.z > minZ - 0.26 && local.z < maxZ + 0.26
  })
}
const clock = new THREE.Clock()
function axis(positive, positiveArrow, negative, negativeArrow) {
  return Number(keys.has(positive) || keys.has(positiveArrow)) -
    Number(keys.has(negative) || keys.has(negativeArrow))
}
renderer.setAnimationLoop(() => {
  const step = Math.min(clock.getDelta(), 0.045) * 4.2
  const f = axis('KeyW','ArrowUp','KeyS','ArrowDown')
  const s = axis('KeyD','ArrowRight','KeyA','ArrowLeft')
  if (f || s) {
    const speed = step / Math.hypot(f, s)
    const p = camera.position
    const x = p.x + (s * Math.cos(yaw) - f * Math.sin(yaw)) * speed
    const z = p.z + (-f * Math.cos(yaw) - s * Math.sin(yaw)) * speed
    if (canWalk(x, p.z)) p.x = x
    if (canWalk(p.x, z)) p.z = z
    const near = points.reduce((a, b) => Math.abs(b.p.x - p.x) < Math.abs(a.p.x - p.x) ? b : a)
    const edge = Math.abs((p.x - near.p.x) * near.nx + (p.z - near.p.z) * near.nz)
    p.y = THREE.MathUtils.lerp(p.y, edge >= 3.2 && edge <= 5.1 ? 1.86 : 1.74, 0.2)
  }
  camera.rotation.set(pitch, yaw, 0, 'YXZ')
  renderer.render(scene, camera)
})
