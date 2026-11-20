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
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, matchMedia('(pointer:coarse)').matches ? 1.45 : 1.8))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.shadowMap.autoUpdate = false
renderer.shadowMap.needsUpdate = true
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.04
document.body.prepend(renderer.domElement)

const scene = new THREE.Scene()
scene.background = new THREE.Color('#b9d0df')
scene.fog = new THREE.FogExp2('#b9d0df', 0.007)
const camera = new THREE.PerspectiveCamera(65, 1, 0.08, 260)
const skyLight = new THREE.HemisphereLight('#d9ebff', '#b2a287', 2.1)
scene.add(skyLight)
const sun = new THREE.DirectionalLight('#fff0db', 2.4)
sun.position.set(-27, 42, 24)
sun.castShadow = true
Object.assign(sun.shadow.camera, { left: -67, right: 64, top: 44, bottom: -44, near: 1, far: 150 })
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
const grass = surface('#6d8257', 34, 90)
const asphalt = surface('#687176', 35)
const redPaverEdge = surface('#a6756d', 18, 8)
asphalt.bumpMap = asphalt.map
asphalt.bumpScale = 0.008
const paving = surface('#c5aaa0')
const pavingSize = 256
const pavingPixels = new Uint8Array(pavingSize * pavingSize * 4)
for (let y = 0; y < pavingSize; y++) {
  for (let x = 0; x < pavingSize; x++) {
    const cellX = x >> 4
    const cellY = y >> 4
    const diagonal = (cellX + cellY) % 4
    const horizontal = diagonal < 2
    const tileX = horizontal && diagonal === 1 ? cellX - 1 : cellX
    const tileY = !horizontal && diagonal === 3 ? cellY - 1 : cellY
    const offsetX = x - tileX * 16
    const offsetY = y - tileY * 16
    const grout = offsetX === 0 || offsetY === 0 ||
      offsetX === (horizontal ? 31 : 15) || offsetY === (horizontal ? 15 : 31)
    const shade = grout ? 107 : 207 + ((tileX*17 + tileY*31) & 23) + ((x*5+y*7) & 7)
    pavingPixels.set([shade, shade, shade, 255], (y*pavingSize+x)*4)
  }
}
const pavingMap = new THREE.DataTexture(pavingPixels, pavingSize, pavingSize)
pavingMap.wrapS = pavingMap.wrapT = THREE.RepeatWrapping
pavingMap.magFilter = THREE.LinearFilter
pavingMap.minFilter = THREE.LinearMipmapLinearFilter
pavingMap.generateMipmaps = true
pavingMap.anisotropy = 4
pavingMap.needsUpdate = true
paving.map = pavingMap
const curb = surface('#b5b0a2')
const frames = surface('#d2cbbd')
const glass = surface('#34444b')
const bark = surface('#564438')
const leaves = ['#536736', '#60743d', '#6b7f48'].map(color => surface(color))
const walls = ['#bfb7a0', '#d3c9b4', '#a58069', '#c8b7a0'].map(color => surface(color))
// Procedural ceramic roof tiles: staggered courses, subdued grout and individually varying tiles.
// This is a real texture within the 3D scene, not a wallpaper added to screenshots.
function roofCeramics(color, repeatX = 3.2, repeatY = 2.1) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0.0 })
  const n = 256, data = new Uint8Array(n*n*4)
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const course = Math.floor(y/16)
    const offset = (course % 2) * 16
    const col = Math.floor((x+offset)/32)
    const sx = (x+offset)%32
    const sy = y%16
    const bevel = Math.min(sx,31-sx,sy,15-sy)
    const seam = bevel === 0
    const variation = ((col*37+course*19+col*course*7)%21)-10
    const grain = ((x*43+y*71+(x*y)%17)%13)-6
    const shade = seam ? 130 : Math.max(140,Math.min(254,215+variation+grain + (bevel === 1 ? -16 : 0)))
    const at=(y*n+x)*4
    data.set([shade,shade,shade,255],at)
  }
  const tex = new THREE.DataTexture(data,n,n)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeatX,repeatY)
  tex.magFilter=THREE.LinearFilter
  tex.minFilter=THREE.LinearMipmapLinearFilter
  tex.generateMipmaps=true
  tex.anisotropy=4
  tex.needsUpdate=true
  mat.map=tex
  mat.bumpMap=tex
  mat.bumpScale=0.016
  return mat
}
const roofEight = roofCeramics('#474541', 2.2, 2.7)
const roofGarage = roofCeramics('#414244', 3.8, 1.4)
roofGarage.side = THREE.DoubleSide
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
function strip(material, left, right, leftY, rightY = leftY, path = points) {
  const positions = [], uv = [], indices = []
  path.forEach(({ p, nx, nz }, i) => {
    positions.push(p.x + nx * left, leftY, p.z + nz * left,
      p.x + nx * right, rightY, p.z + nz * right)
    if (material === asphalt) {
      uv.push((p.x + nx * left) / 2, (p.z + nz * left) / 2,
        (p.x + nx * right) / 2, (p.z + nz * right) / 2)
    } else {
      uv.push(left / 2, i / 2, right / 2, i / 2)
    }
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
const acrossDriveway = points.filter(point => {
  const x = edgePoint(point, -5.1).x
  return x >= -35.6 && x <= -19.7
})
strip(paving, -5.1, -3.25, 0.12)
strip(curb, -3.25, -3.1, 0.12)
strip(curb, -3.1, -3.1, 0.12, 0)
const west = points.findLastIndex(({ p }) => p.x <= -62)
const east = points.findIndex(({ p }) => p.x >= -53)
for (const segment of [points.slice(0, west + 1), points.slice(east)]) {
  strip(paving, 3.25, 5.1, 0.12, 0.12, segment)
  strip(curb, 3.1, 3.25, 0.12, 0.12, segment)
  strip(curb, 3.1, 3.1, 0, 0.12, segment)
}

function edgePoint({ p, nx, nz }, offset) {
  return new THREE.Vector2(p.x + nx * offset, p.z + nz * offset)
}
function patch(material, outline, height) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(
    outline.flatMap(point => [point.x, height, point.y]), 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(
    outline.flatMap(point => [point.x / 2, point.y / 2]), 2))
  geometry.setIndex(THREE.ShapeUtils.triangulateShape(outline, []).flatMap(([a, b, c]) => [a, c, b]))
  geometry.computeVertexNormals()
  mesh(scene, geometry, material, 0, 0, 0, false)
}

// Share the main road edge with the junction surface. Both roads are at grade.
const junction = Array.from({ length: 25 }, (_, i) => ({
  p: new THREE.Vector3(-59.2 - 0.20 * i, 0, 11.4 + i),
  nx: 1 / Math.hypot(1, 0.20),
  nz: 0.20 / Math.hypot(1, 0.20),
}))
const mouth = junction[0]
patch(asphalt, [
  ...points.slice(west, east + 1).map(point => edgePoint(point, 3.1)),
  edgePoint(mouth, 2.75),
  edgePoint(mouth, -2.75),
], 0.005) // Raise overlapping mouth a few mm to prevent coplanar z-fighting
strip(asphalt, -2.75, 2.75, 0, 0, junction)
for (const side of [-1, 1]) {
  const main = points[side < 0 ? west : east]
  const roadEdge = edgePoint(main, 3.1)
  const branchEdge = edgePoint(mouth, side * 2.75)
  patch(paving, [edgePoint(main, 3.25), edgePoint(main, 5.1),
    edgePoint(mouth, side * 4.05), edgePoint(mouth, side * 2.9)], 0.12)
  patch(curb, [roadEdge, edgePoint(main, 3.25),
    edgePoint(mouth, side * 2.9), branchEdge], 0.12)
  strip(curb, 0, 0, 0, 0.12,
    [roadEdge, branchEdge].map(point => ({
      p: new THREE.Vector3(point.x, 0, point.y), nx: 0, nz: 0,
    })))
  strip(paving, side * 2.9, side * 4.05, 0.12, 0.12, junction)
  strip(curb, side * 2.75, side * 2.9, 0.12, 0.12, junction)
  strip(curb, side * 2.75, side * 2.75, 0, 0.12, junction)
}

// The photographed sidewalks use individual paving courses with a pale curb.
// Narrow edge strips reduce the overly uniform appearance at the road edge.
const pavingEdge = surface('#c6b9a6', 20)
strip(pavingEdge, -3.30, -3.265, 0.126)
const eastSide = points.slice(east)
const westSide = points.slice(0,west+1)
for(const segment of [westSide,eastSide]) strip(pavingEdge, 3.265, 3.30, 0.126, 0.126, segment)
// IMG_2940–2949: red herringbone edge courses alongside both public sidewalks.
strip(redPaverEdge, -3.72, -3.42, 0.129)
for(const section of [westSide,eastSide]) strip(redPaverEdge, 3.42, 3.72, 0.129, 0.129, section)
for(const side of [-1,1]) strip(redPaverEdge, side<0?-3.36:3.02, side<0?-3.02:3.36, 0.129, 0.129, junction)


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
  [-75,-10,11,9,4,1,-0.09],
  [-26,-22,12,13,5.2,0,0.09],[-13,-25,12,10,4.3,2,0.08],

  [77,-7,12,10,4.1,3,-0.17],
  [-72,24,11,9,4.5,2,0.15],
  
  
  [69,26,13,9,5.1,0,-0.15],[85,28,11,10,4.3,3,-0.15]
]
for (const [x,z,w,d,h,type,angle] of neighbours) house(x,z,w,d,h,type,angle,z < 0 ? 1 : -1)

const crown = new THREE.SphereGeometry(1, 11, 9)
// Distort the vertices to break the recognizable identical-sphere silhouette.
{
  const attribute = crown.attributes.position
  for (let i=0;i<attribute.count;i++) {
    const x=attribute.getX(i), y=attribute.getY(i), z=attribute.getZ(i)
    const deformation=1+0.10*Math.sin(x*6.1+y*3.8)+0.08*Math.cos(z*7.7+x*5.3)
    attribute.setXYZ(i,x*deformation,y*deformation,z*deformation)
  }
  crown.computeVertexNormals()
}
const trunk = new THREE.CylinderGeometry(0.105, 0.21, 3.4, 8)
for (const [x,z] of [[-33,-17],[-31,-21],[-23,-27],[-16,-34],[-8,-28],
  [36,-21],[56,-17],[68,-16],[-14,24],
  [18,25],[21,21],[24,24],[26,15],[30,18],[46,18],[59,22],[80,22],[-79,17],[94,24],[-81,-7]]) {
  mesh(scene, trunk, bark, x, 1.56, z)
  for (let i = 0; i < 13; i++) {
    const phi = random()*Math.PI*2
    const radius = (i<4 ? 0.38 : 1.25) + random()*0.53
    const ball = mesh(scene, crown, leaves[i % 3],
      x + Math.cos(phi)*radius, 4.0 + random()*1.22 + (i<4?0.45:0),
      z + Math.sin(phi)*radius)
    ball.scale.set(0.67 + random()*0.48, 0.66 + random()*0.49, 0.64 + random()*0.52)
    ball.rotation.set(random(),random()*Math.PI,random())
  }
}

// Buildings and paths matched across the supplied street-level views.
const cream = surface('#d5d0c5', 24)
const timber = surface('#3e3430')
const brick = surface('#815042', 35)
const slate = surface('#333034')
const garageDoor = surface('#777474')
const silver = surface('#747c7e')
const red = surface('#a43530')
const white = surface('#e1ded6')

function pavedArea(group, x, z, width, depth) {
  const geometry = new THREE.BufferGeometry().copy(new THREE.PlaneGeometry(width, depth))
  geometry.rotateX(-Math.PI / 2)
  const uv = geometry.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i)*width/2, uv.getY(i)*depth/2)
  mesh(group, geometry, paving, x, 0.002, z, false)
}
function frontage(x, z, front, angle = 0) {
  const group = new THREE.Group()
  group.position.set(x, 0.12, z)
  group.rotation.y = angle + (front < 0 ? Math.PI : 0)
  scene.add(group)
  return group
}
function solid(group, mat, x, y, z, w, h, d) {
  const foundation = y === 0 ? 0.19 : 0
  const object = box(group, mat, x, y + (h-foundation) / 2, z, w, h+foundation, d)
  obstacles.push({ group, minX: x-w/2, maxX: x+w/2, minZ: z-d/2, maxZ: z+d/2 })
  return object
}
function beam(group, mat, x1, y1, x2, y2, z, thickness, depth = thickness) {
  const piece = box(group, mat, (x1+x2)/2, (y1+y2)/2, z,
    Math.hypot(x2-x1,y2-y1), thickness, depth)
  piece.rotation.z = Math.atan2(y2-y1,x2-x1)
}
function gable(group, wall, roof, x, z, w, d, h, r) {
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute([
    x-w/2,h,z+d/2, x+w/2,h,z+d/2, x,h+r,z+d/2,
    x-w/2,h,z-d/2, x+w/2,h,z-d/2, x,h+r,z-d/2
  ], 3))
  geo.setIndex([0,1,2,3,5,4])
  geo.computeVertexNormals()
  mesh(group, geo, wall, 0, 0, 0)
  const angle = Math.atan2(r,w/2)
  for (const sign of [-1,1]) {
    const slope = box(group, roof, x+sign*w/4, h+r/2+0.07, z,
      Math.hypot(w/2,r)+0.28, 0.14, d+0.42)
    slope.rotation.z = -sign*angle
  }
}
function pane(group, x, y, z, w, h, fill = glass) {
  box(group, frames, x, y, z, w+0.13, h+0.13, 0.09)
  box(group, fill, x, y, z+0.057, w, h, 0.026)
  box(group, frames, x, y-h/2-0.075, z+0.07, w+0.22, 0.045, 0.16)
}

const kiosk = frontage(-48, 18.8, -1, 0.04)
const kioskPlaster = surface('#d1cabe', 27, 6)
kioskPlaster.bumpMap = kioskPlaster.map
kioskPlaster.bumpScale = 0.034
const kioskWood = surface('#332a23', 30, 5)
kioskWood.bumpMap = kioskWood.map
kioskWood.bumpScale = 0.016
const tileMaterial = new THREE.MeshStandardMaterial({
  color: '#62584e', roughness: 0.83, side: THREE.DoubleSide, vertexColors: true
})
solid(kiosk, kioskPlaster, 0, 0, 0, 12.2, 3.38, 7.6)

function kioskTiles(w, d, rise) {
  const positions = [], shades = [], indices = []
  const rows = Math.ceil(Math.hypot(d,rise)/0.30)
  const columns = Math.ceil(w/0.25)
  for (const side of [-1,1]) {
    for (let row=0;row<rows;row++) for (let col=0;col<columns;col++) {
      const base=positions.length/3
      const shade=0.74+((row*29+col*47+row*col*13)%27)*0.009
      for (const [offset,lip] of [[0,0.021],[1.12,0]]) {
        const t=Math.min(1,(row+offset)/rows)
        for(const [u,relief] of [[0.025,0.012],[0.27,0.062],[0.57,0.066],[0.98,0.013]]) {
          positions.push(-0.35+w*((col+u)/columns-0.5),3.37+t*rise+relief+lip,side*d*(1-t))
          shades.push(shade,shade,shade)
        }
      }
      for(let edge=0;edge<3;edge++) {
        const n=base+edge
        indices.push(n,n+1,n+4,n+1,n+5,n+4)
      }
    }
  }
  const geo=new THREE.BufferGeometry()
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3))
  geo.setAttribute('color',new THREE.Float32BufferAttribute(shades,3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  mesh(kiosk,geo,tileMaterial,0,0,0)
}
for (const side of [-1,1]) {
  const roof = box(kiosk, slate, -0.35, 4.63, side*1.92, 12.75, 0.13, 4.69)
  roof.rotation.x = side*0.57
}
kioskTiles(12.72,3.89,2.50)
const ridgeTile = new THREE.CylinderGeometry(0.095,0.095,12.82,12)
mesh(kiosk,ridgeTile,slate,-0.35,5.88,0).rotation.z=Math.PI/2
for(const x of [-6.66,6.01]) for(const z of [-3.9,3.9]) {
  box(kiosk,kioskWood,x,3.35,z,0.13,0.20,0.16)
}
solid(kiosk, kioskPlaster, -1.65, 3.06, 2.48, 4.85, 2.23, 2.94)
gable(kiosk, kioskPlaster, slate, -1.65, 2.48, 4.85, 2.94, 5.29, 2.48)
// The forecourt follows the outside edge of the public sidewalk and wraps its corner.
const kioskWalk = points.slice(east).filter(({ p }) => p.x <= -40)
patch(paving, [
  edgePoint(mouth, 4.05),
  ...kioskWalk.map(point => edgePoint(point, 5.1)),
  new THREE.Vector2(kioskWalk.at(-1).p.x - 0.9, 17.25),
  new THREE.Vector2(-55.9, 17.25),
], 0.12)
const faceZ = 3.94
// Photographed white plaster front: incorrect ornamental dark timber removed.
pane(kiosk,-1.65,7.04,faceZ,0.40,0.53)
const signInk = surface('#202733')
const signFace = surface('#d9ceac')
const shopLight = new THREE.MeshStandardMaterial({ color:'#efe8cb', emissive:'#fff6d9', emissiveIntensity:0.75 })
const shutter = surface('#655f54')
const frosted = new THREE.MeshPhysicalMaterial({ color:'#bbc3bb', roughness:0.31, metalness:0.06, transparent:true, opacity:0.53, depthWrite:false, clearcoat:0.36 })
solid(kiosk, kioskPlaster, 5.52, 0, 3.26, 2.79, 3.19, 2.73)
box(kiosk, slate, 5.52, 3.31, 3.28, 2.97, 0.20, 2.92)
box(kiosk, shutter, 6.934, 1.27, 3.15, 0.055, 2.38, 1.91)
for (let col=0; col<19; col++) box(kiosk, timber, 6.97, 1.27, 2.23+col*0.103, 0.02, 2.37, 0.035)

// IMG_2940 / IMG_2944: broad pale metal security rolling gate on kiosk facade.
const gateMetal=surface('#bfc4c0',10)
const gateSlats=surface('#858b89')
box(kiosk,frames,-3.53,1.30,4.018,3.45,2.49,0.11)
box(kiosk,gateMetal,-3.53,1.30,4.077,3.34,2.41,0.04)
for(let n=0;n<31;n++) box(kiosk,gateSlats,-5.14+n*0.107,1.30,4.105,0.014,2.37,0.015)
box(kiosk,gateSlats,-3.53,1.30,4.119,0.027,2.35,0.017)
box(kiosk,gateSlats,-3.53,0.22,4.116,3.34,0.025,0.017)
box(kiosk,gateSlats,-3.53,2.45,4.116,3.34,0.025,0.017)
// Existing tiny inset door remains behind the gate as an earlier fallback.
box(kiosk,frames,-1.61,1.16,3.85,1.18,2.23,0.12)
box(kiosk,cream,-1.61,1.18,3.928,0.97,2.07,0.067)
for (const y of [0.58,0.91,1.23,1.55,1.89]) {
  box(kiosk,glass,-1.53,y,3.967,0.24+Math.abs(y-1.22)*0.19,0.23,0.016)
}
box(kiosk,silver,-1.94,1.15,3.98,0.05,0.22,0.038)
box(kiosk,curb,-1.61,0.08,4.05,1.43,0.14,0.51)
box(kiosk,garageDoor,-0.60,1.24,3.92,0.68,0.72,0.18)
box(kiosk,frames,-4.9,2.52,3.88,2.5,0.44,0.17)
for (const x of [-5.68,-4.9,-4.12]) box(kiosk,glass,x,2.52,3.98,0.69,0.31,0.04)

const displayBacking = new THREE.MeshStandardMaterial({color:'#57504a',emissive:'#786650',emissiveIntensity:0.14})
pane(kiosk,1.30,1.66,3.88,2.05,1.36,displayBacking)
const packages = ['#8c292c','#29445b','#85542c','#5f7552','#b8a684','#b67237','#8d766c','#d1c9a9'].map(c=>surface(c))
for (let row=0; row<9; row++) {
  for (let col=0; col<21; col++) {
    const w=0.053+((col*7+row*3)%4)*0.008
    const h=0.065+((col*3+row*5)%5)*0.012
    const x=0.35+col*0.095
    const y=1.045+row*0.148+h/2
    const label=packages[(col*13+row*11+col*row)%packages.length]
    box(kiosk,label,x,y,3.96,w,h,0.028)
    if ((col+row)%3===0) box(kiosk,white,x,y+0.014,3.978,w*0.74,0.019,0.009)
  }
  box(kiosk,displayBacking,1.30,1.035+row*0.148,3.956,1.99,0.013,0.035)
}
box(kiosk,frames,1.32,1.66,3.99,0.066,1.40,0.047)
box(kiosk,frames,1.31,0.93,4.05,2.27,0.098,0.35)
for (const x of [0.81,1.5,2.14]) {
  box(kiosk,x===0.81?silver:red,x,0.45,3.88,0.52,0.77,0.09)
  box(kiosk,garageDoor,x,0.45,3.938,0.42,0.65,0.026)
}
const shopGlass = new THREE.MeshPhysicalMaterial({
  color:'#d9e6eb', roughness:0.16, transparent:true, opacity:0.12,
  depthWrite:false, clearcoat:0.6
})
const displayGlazing = box(kiosk,shopGlass,1.30,1.66,4.001,2.04,1.36,0.008)
displayGlazing.castShadow=false
for (const x of [3.55,4.27]) {
  box(kiosk,slate,x,1.07,3.91,0.59,0.90,0.22)
  box(kiosk,x<4?silver:red,x,1.08,4.031,0.46,0.73,0.032)
  box(kiosk,glass,x,1.28,4.055,0.35,0.27,0.018)
}
for (let panel=0;panel<4;panel++) {
  const z=4.00+panel*0.265
  const y=2.78-panel*0.075-(panel>1?0.03:0)
  box(kiosk,frosted,1.22,y,z,3.52,0.028,0.292).rotation.x=0.27
  for(let i=0;i<9;i++) box(kiosk,frames,-0.52+i*0.435,y+0.026,z,0.035,0.04,0.294).rotation.x=0.27
}
box(kiosk,shopLight,1.31,2.43,4.03,1.85,0.105,0.16)

// The sign wraps around the corner. Letter strokes are solid geometry.
const glyphs = [
  [[0,0,0,1],[0,0.48,0.63,1],[0,0.52,0.63,0]],
  [[0.30,0,0.30,1]],
  [[0.12,0,0.51,0],[0.51,0,0.63,0.12],[0.63,0.12,0.63,0.88],[0.63,0.88,0.51,1],[0.51,1,0.12,1],[0.12,1,0,0.88],[0,0.88,0,0.12],[0,0.12,0.12,0]],
  [[0.03,0,0.53,0],[0.53,0,0.63,0.10],[0.63,0.10,0.63,0.39],[0.63,0.39,0.53,0.5],[0.53,0.5,0.10,0.5],[0.10,0.5,0,0.6],[0,0.6,0,0.89],[0,0.89,0.1,1],[0.1,1,0.6,1]]
]
function shopSign(x,y,z,angle,scale,background) {
  const sign = new THREE.Group()
  sign.position.set(x,y,z)
  sign.rotation.y=angle
  sign.scale.setScalar(scale)
  kiosk.add(sign)
  box(sign,timber,0,0,0,2.78,0.77,0.21)
  box(sign,background,0,0,0.11,2.52,0.59,0.024)
  for(const [n,g] of [0,1,2,3,0].entries()) {
    for (const [ax,ay,bx,by] of glyphs[g]) {
      const offset=-1.05+n*0.45
      beam(sign,signInk,offset+ax*0.47,-0.225+ay*0.45,
        offset+bx*0.47,-0.225+by*0.45,0.128,0.064,0.015)
    }
  }
}
// Solid timber gallery and large street-facing sign; all live WebGL geometry.
const balconyWood=[surface('#413733',15),surface('#54453e',19),surface('#493c37',18)]
box(kiosk,kioskWood,-1.0,3.51,4.30,10.0,0.14,1.02)
for(let n=0;n<58;n++) box(kiosk,balconyWood[n%3],-5.75+n*0.165,4.04,4.78,0.158,1.17,0.072)
box(kiosk,kioskWood,-1.0,4.65,4.82,10.0,0.085,0.12)
const signCanvas=document.createElement('canvas')
signCanvas.width=1024; signCanvas.height=256
const ctx=signCanvas.getContext('2d')
ctx.fillStyle='#f6f5ef';ctx.fillRect(0,0,1024,256)
ctx.fillStyle='#2c2e66';ctx.font='bold 205px Arial,sans-serif'
ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('KIOSK',512,141)
const kioskSignTexture=new THREE.CanvasTexture(signCanvas)
kioskSignTexture.colorSpace=THREE.SRGBColorSpace
box(kiosk,new THREE.MeshStandardMaterial({map:kioskSignTexture,roughness:0.87}),-3.17,4.05,4.844,4.2,0.89,0.04)
box(kiosk,signFace,-0.17,4.05,4.847,0.75,0.89,0.03)
shopSign(5.59,3.65,4.68,0,1,signFace)
shopSign(6.99,3.65,3.31,Math.PI/2,0.96,signFace)
shopSign(5.85,2.95,4.78,0,0.47,shopLight)
box(kiosk,red,-0.15,0.34,4.22,0.30,0.68,0.30)
box(kiosk,slate,-0.15,0.70,4.22,0.30,0.095,0.30)

// Left-hand boundary as seen from the sidewalk, with arched timber panels.
const fenceWood = ['#4f4942','#514b43','#62574b','#534d45'].map(color => surface(color, 32))
for (let panel = 0; panel < 4; panel++) {
  const x = -7.5 - panel*1.79
  for (let row = 0; row < 8; row++) {
    box(kiosk,fenceWood[(panel+row)%4],x,0.115+row*0.143,4.63,1.73,0.133,0.062)
  }
  box(kiosk,timber,x+0.88,0.68,4.63,0.086,1.36,0.105)
  for (let strip=0; strip<7; strip++) {
    const u=-0.82+strip*0.24
    const v=u+0.24
    const arch=t=>1.18+0.36*(1-(t/0.88)**2)
    beam(kiosk,timber,x+u,arch(u),x+v,arch(v),4.63,0.051,0.068)
    const end = Math.min(u+0.30,0.85)
    beam(kiosk,fenceWood[2],x+u,1.13,x+end,arch(end),4.64,0.036)
    beam(kiosk,fenceWood[1],x-u,1.13,x-end,arch(end),4.64,0.036)
  }
}
obstacles.push({group:kiosk,minX:-13.76,maxX:-6.54,minZ:4.56,maxZ:4.71})

// A generic white delivery van, parked with its rear toward the street.
const van = new THREE.Group()
van.position.set(-4.57,0,5.60)
van.rotation.y=1.38
kiosk.add(van)
const vanPaint = new THREE.MeshStandardMaterial({color:'#d0d2d0',roughness:0.39})
const rubber=surface('#242326')
const body=new THREE.BufferGeometry()
const profile=[[-3.64,0.34,0.86,0.97],[-3.53,0.34,1.11,0.96],[-2.88,0.33,1.18,0.99],[-2.37,0.34,2.30,1.01],[-2.20,0.34,2.47,1.02],[0.57,0.34,2.47,1.02],[0.68,0.34,2.34,0.97]]
const verts=[]
for(const [z,bottom,top,w] of profile) {
  verts.push(-w+0.10,bottom,z,w-0.10,bottom,z,w,bottom+0.15,z,w,top-0.12,z,w-0.12,top,z,-w+0.12,top,z,-w,top-0.12,z,-w,bottom+0.15,z)
}
const faces=[]
for(let ring=0;ring<profile.length-1;ring++) for(let n=0;n<8;n++) {
  const a=ring*8+n,b=ring*8+(n+1)%8
  faces.push(a,b,a+8,b,b+8,a+8)
}
for(let n=1;n<7;n++) faces.push(0,n+1,n,48,48+n,49+n)
body.setAttribute('position',new THREE.Float32BufferAttribute(verts,3))
body.setIndex(faces)
body.computeVertexNormals()
vanPaint.side=THREE.DoubleSide
mesh(van,body,vanPaint,0,0,0)
const tire=new THREE.CylinderGeometry(0.34,0.34,0.17,14)
const hub=new THREE.CylinderGeometry(0.18,0.18,0.024,12)
for(const x of [-1.005,1.005]) for(const z of [-2.72,-0.26]) {
  mesh(van,tire,rubber,x,0.34,z).rotation.z=Math.PI/2
  mesh(van,hub,silver,x+Math.sign(x)*0.09,0.34,z).rotation.z=Math.PI/2
}
box(van,rubber,0,0.49,0.71,1.98,0.20,0.19)
box(van,slate,0,1.49,0.704,0.017,1.82,0.021)
box(van,slate,0.12,1.35,0.725,0.12,0.037,0.026)
for(const x of [-0.86,0.86]) box(van,red,x,0.92,0.712,0.105,0.56,0.048)
obstacles.push({group:van,minX:-1.08,maxX:1.08,minZ:-3.65,maxZ:0.80})

const lightBox = new THREE.MeshStandardMaterial({color:'#fce5a0',emissive:'#ffc65d',emissiveIntensity:0.7})
box(kiosk,timber,6.97,1.90,4.43,0.15,1.66,0.34)
box(kiosk,lightBox,7.055,1.90,4.43,0.027,1.57,0.26)
box(kiosk,silver,6.76,2.73,4.62,0.10,0.66,0.10).rotation.z=-0.39
const gutterMetal = new THREE.MeshStandardMaterial({color:'#777571',roughness:0.47,metalness:0.44})
const gutter = new THREE.CylinderGeometry(0.066,0.066,7.5,12)
mesh(kiosk,gutter,gutterMetal,0.77,3.38,3.99).rotation.z=Math.PI/2
for(let bracket=0;bracket<13;bracket++) box(kiosk,gutterMetal,-2.8+bracket*0.59,3.35,3.99,0.025,0.15,0.16)
const drain = new THREE.CylinderGeometry(0.042,0.042,2.51,12)
mesh(kiosk,drain,gutterMetal,6.83,1.28,4.62)
box(kiosk,silver,-2.90,2.81,4.02,0.068,1.07,0.068)

const nightLights = []
function nightLamp(parent, x, y, z, color, power, reach) {
  const light = new THREE.PointLight(color, power, reach, 2)
  light.position.set(x,y,z)
  light.intensity=0
  parent.add(light)
  nightLights.push({light,power})
}
nightLamp(kiosk,1.31,2.39,4.43,'#fff0d7',124,13)
nightLamp(kiosk,6.35,3.01,4.87,'#ffb458',41,9)
nightLamp(kiosk,7.18,4.92,5.29,'#ffaf46',170,18)
box(kiosk,silver,7.18,2.53,5.68,0.105,5.06,0.105)
box(kiosk,silver,7.18,5.04,5.42,0.095,0.095,0.57)
box(kiosk,lightBox,7.18,4.99,5.13,0.24,0.08,0.46)

const blueWood = surface('#6d91a5', 20)
const fadedCladding = surface('#a8adae', 21)
const porchGlass = surface('#696f6d', 20)
const eight = frontage(-31, 16.8, -1, -0.12)
solid(eight,fadedCladding,0,0,0,8.6,4.25,6.9)
const eightRoofDepth = 7.26
for (const side of [-1, 1]) {
  const slope = box(eight,roofEight,0,5.38,side*eightRoofDepth/4,8.95,0.14,
    Math.hypot(eightRoofDepth/2,2.26))
  slope.rotation.x = side*Math.atan2(2.26,eightRoofDepth/2)
}
gable(eight,blueWood,roofEight,1.60,2.1,5.36,2.93,4.25,2.50)
for (let y=0.18;y<6.75;y+=0.27) {
  const width = y<4.25 ? 8.57 : 5.36*(1-(y-4.25)/2.5)
  box(eight,y<4.25?fadedCladding:blueWood,y<4.25?0:1.60,y,y<4.25?3.46:3.574,width,0.018,0.026)
}
pane(eight,2.23,3.55,3.50,0.82,0.82)
solid(eight,blueWood,-0.54,0,4.05,1.88,2.35,1.30)
gable(eight,blueWood,roofs[1],-0.54,4.05,2.13,1.49,2.35,0.56)
box(eight,frames,-0.54,1.12,4.72,1.13,2.13,0.08)
box(eight,blueWood,-0.54,1.10,4.766,1.02,2.04,0.035)
pane(eight,-0.54,1.63,4.79,0.90,0.78,porchGlass)
for (const x of [-0.82,-0.54,-0.26]) {
  box(eight,frames,x,1.63,4.88,0.033,0.78,0.022)
  box(eight,frames,x,2.52,4.799,0.031,x===-0.54?0.34:0.23,0.022)
}
box(eight,frames,-0.54,1.63,4.88,0.92,0.035,0.022)
box(eight,silver,-0.12,1.08,4.812,0.037,0.16,0.048)
box(eight,curb,-0.54,0.04,4.94,1.43,0.08,0.36)
const porchSide = new THREE.Group()
porchSide.position.x = 0.407
porchSide.rotation.y = Math.PI/2
eight.add(porchSide)
pane(porchSide,-3.99,1.65,0,0.64,0.80,porchGlass)
// Reference 00:37:10: timber boundary with horizontal grey planks and
// diagonal open lattice below. V20's RED BRICK WALL + BALL HEDGE were incorrect.
const weatheredFence = [surface('#877d6b',21),surface('#9a907d',18),
  surface('#746e61',14),surface('#aaa092',15)]
const fenceLineStart=4.21, fenceLineEnd=9.06, fenceDepth=3.78
for (let panel=0;panel<3;panel++) {
  const a=fenceLineStart+panel*1.62
  const b=Math.min(fenceLineEnd,a+1.62)
  const mid=(a+b)/2, span=b-a
  box(eight,timber,a,0.84,fenceDepth,0.085,1.68,0.10)
  box(eight,timber,b,0.84,fenceDepth,0.085,1.68,0.10)
  // Lower criss-cross lattice, leaving real visible gaps.
  for(let j=0;j<7;j++) {
    const x0=a+0.04+j*span/7
    const x1=x0+span/7
    beam(eight,weatheredFence[(j+panel)%4],x0,0.10,x1,0.75,fenceDepth,0.048,0.058)
    beam(eight,weatheredFence[(j+panel+2)%4],x0,0.75,x1,0.10,fenceDepth+0.01,0.048,0.058)
  }
  for(let r=0;r<6;r++) {
    const height=0.84+r*0.139
    box(eight,weatheredFence[(r+panel)%4],mid,height,fenceDepth,span-0.06,0.121,0.049)
  }
  box(eight,weatheredFence[2],mid,1.70,fenceDepth,span,0.037,0.11)
}
// Smaller, staggered native-looking shrubs BEHIND the fence, never mounted
// on top of a brick wall and never protruding into the public sidewalk.
const ivy = [surface('#3f563c'),surface('#607346'),surface('#778355')]
for(let i=0;i<34;i++) {
  const x=4.0+(i%11)*0.45+(random()-0.5)*0.22
  const z=2.68+(Math.floor(i/11))*0.37+(random()-0.5)*0.16
  const height=0.77+random()*0.65
  const shrub=mesh(eight,crown,ivy[i%3],x,1.10+height*0.30,z,false)
  shrub.scale.set(0.28+random()*0.20,height*0.55,0.29+random()*0.18)
}
// Low unobtrusive under-eave gutter and downpipe.
box(eight,silver,0,4.26,3.51,8.95,0.070,0.074)
box(eight,silver,-4.30,2.17,3.49,0.067,4.15,0.065)
obstacles.push({group:eight,minX:fenceLineStart,maxX:fenceLineEnd,minZ:3.70,maxZ:3.84})
for (let i=0;i<20;i++) {
  const picket=box(eight,timber,-4.1+i*0.16,0.40,4.17,0.059,0.99,0.052)
  picket.rotation.z=i%2===0?0.56:-0.56
}

const ten = frontage(-14, 11.8, -1, -0.22)
solid(ten,cream,0,0,0,10.4,2.75,5.7)
box(ten,slate,0,2.41,2.87,10.53,0.51,0.12)
box(ten,garageDoor,0,2.86,2.91,10.60,0.39,0.18)
for (const [x,w,h] of [[0.8,2.3,1.25],[3.75,2.44,1.96]]) {
  box(ten,frames,x,h/2+0.12,2.88,w,h,0.10)
  for(let i=0;i<Math.floor(h/0.11);i++) box(ten,garageDoor,x,0.20+i*0.11,2.94,w-0.08,0.018,0.024)
}
pavedArea(ten,0,4.07,10.7,2.6)

for (const [x,z,w,h] of [[-53,-3.2,9.6,4.8],[-42,-0.6,9.1,4.1]]) {
  const g = frontage(x,z,1,0.12)
  solid(g,white,0,0,0,w,h,7.0)
  gable(g,white,slate,0,0,w,7,h,2.85)
  for (const wx of [-2.0,1.9]) pane(g,wx,h-0.18,3.54,1.05,1.10)
  const fenceDepth = x === -53 ? 3.84 : 4.98
  for (let i=0;i<5;i++) {
    const cx=-w/2+0.95+i*1.77
    for(let row=0;row<9;row++) box(g,row%3===0?garageDoor:frames,cx,0.14+row*0.144,fenceDepth,1.70,0.135,0.075)
    box(g,timber,cx-0.88,0.72,fenceDepth,0.075,1.44,0.12)
  }
}
const seven = frontage(-27,-11.0,1,0.17)
const charcoalClinker = surface('#525152', 24)
solid(seven,charcoalClinker,0,0,0,15.7,5.25,8.6)
const mortar = surface('#454446')
for (let y=2.48; y<5.23; y+=0.093) {
  box(seven,mortar,0,y,4.304,15.69,0.009,0.012,false)
}
solid(seven,white,0,5.25,-0.42,11.3,2.48,7.5)
const sevenRoof = new THREE.BufferGeometry()
sevenRoof.setAttribute('position',new THREE.Float32BufferAttribute([
  -5.95,7.72,-4.44, 5.95,7.72,-4.44, 5.95,7.72,3.6, -5.95,7.72,3.6,
  -3.28,9.23,-0.42, 3.28,9.23,-0.42,
],3))
sevenRoof.setAttribute('uv',new THREE.Float32BufferAttribute([
  0,0, 1,0, 1,1, 0,1, 0.22,0.5, 0.78,0.5
],2))
sevenRoof.setIndex([0,1,5,0,5,4,3,5,2,3,4,5,0,4,3,1,2,5])
sevenRoof.computeVertexNormals()
mesh(seven,sevenRoof,roofGarage,0,0,0)
for (const [x,width] of [[-6.3,1.13],[-4.2,0.64],[-2.3,1.30],[0,1.45],
  [2.3,1.30],[4.2,0.64],[6.3,1.30]]) {
  pane(seven,x,4.12,4.35,width,1.32)
  box(seven,frames,x,4.86,4.43,width+0.18,0.095,0.14)
  if (width > 1.2) box(seven,frames,x,4.12,4.437,0.043,1.32,0.038)
}
for (const x of [-4.4,-2.2,0,2.2,4.4]) {
  pane(seven,x,6.44,3.36,x===0?1.5:0.67,1.78)
  box(seven,frames,x,6.32,3.45,x===0?1.5:0.67,0.051,0.06)
}
box(seven,frames,0,6.73,3.451,0.053,0.63,0.05)
box(seven,frames,0,1.98,4.35,1.22,2.25,0.10)
box(seven,glass,0,1.98,4.414,1.06,2.07,0.05)
box(seven,curb,0,0.39,4.98,1.72,0.78,1.32)
for (let i=0;i<5;i++) {
  const height = 0.15*(i+1)
  box(seven,curb,0,height/2,7.33-i*0.37,1.72,height,0.371)
}
box(seven,curb,0,0.375,5.73,1.72,0.75,0.20)
const landingGrille = surface('#343b3d')
for (let i=0;i<19;i++) box(seven,landingGrille,-0.78+i*0.087,1.26,5.34,0.023,0.96,0.04)
for (const y of [0.82,1.06,1.31,1.56,1.72]) {
  box(seven,landingGrille,0,y,5.37,1.65,0.029,0.027)
}
for (const x of [-0.89,0.89]) {
  box(seven,white,x,0.87,6.58,0.14,1.74,2.90)
  box(seven,curb,x,1.77,6.58,0.20,0.06,2.93)
}

const garageGraphite = surface('#414b52', 18)
const garageFrame = surface('#313b3f', 12)
const garageJoint = surface('#394247', 8)
for (const x of [-4.45,4.45]) {
  solid(seven,charcoalClinker,x,0,6.78,6.97,2.28,4.4)
  for (let y=0.08;y<2.28;y+=0.095) box(seven,mortar,x,y,8.984,6.95,0.010,0.016,false)
  for (const side of [-1,1]) {
    const roof=box(seven,roofGarage,x,2.48,6.78+side*1.14,7.17,0.13,2.40)
    roof.rotation.x=side*0.15
  }
  box(seven,gutterMetal,x,2.29,9.16,7.18,0.093,0.10)
  const garageBays = x < 0 ? [{dx:-1.68,w:2.98},{dx:1.68,w:2.98}]
    : [{dx:0,w:4.22}]
  for (const {dx,w} of garageBays) {
    box(seven,garageFrame,x+dx,1.08,9.001,w+0.11,2.11,0.12)
    box(seven,garageGraphite,x+dx,1.07,9.073,w,1.96,0.08)
    for(let i=1;i<7;i++) box(seven,garageJoint,x+dx,0.12+i*0.277,9.119,w-0.06,0.013,0.014)
  }
}
// The open carport extends from the left garage pair.
// Interlocking ceramic tile shading is supplied by roofGarage, without
// the old wide sheet-metal ribs from V20.
const center=-9.44
box(seven,roofGarage,center,2.43,6.88,3.19,0.15,4.64).rotation.x=0.045
box(seven,gutterMetal,center,2.35,9.21,3.17,0.09,0.10)
for(const z of [4.74,9.04]) box(seven,timber,-10.94,1.17,z,0.135,2.34,0.135)
box(seven,garageDoor,center,-0.087,6.91,3.15,0.17,4.53,false)
box(seven,white,center,1.16,4.70,3.08,2.32,0.12)

// Tie the driveway to the outside edge of the curved public sidewalk.
const garageDriveway = acrossDriveway.map(point => edgePoint(point, -5.1))
const garageApproach = [-8.15, 8.15].map(x => {
  const corner = seven.localToWorld(new THREE.Vector3(x, 0, 8.96))
  return new THREE.Vector2(corner.x, corner.z)
})
const drivewayPavers = surface('#585452')
drivewayPavers.map = pavingMap
drivewayPavers.roughness = 0.91
const drivewayOutline = [...garageDriveway, ...garageApproach.reverse()]
patch(drivewayPavers, drivewayOutline, 0.12)
for (const [a, b] of [
  [drivewayOutline[0], drivewayOutline.at(-1)],
  [drivewayOutline[garageDriveway.length - 1], drivewayOutline[garageDriveway.length]],
]) {
  strip(drivewayPavers, 0, 0, -0.071, 0.12, [a, b].map(point => ({
    p: new THREE.Vector3(point.x, 0, point.y), nx: 0, nz: 0,
  })))
}

// Street frontage of house 7, positioned behind the public sidewalk.
strip(slate,-5.16,-5.105,0.122,0.122,acrossDriveway)
const inspectionRim = new THREE.CylinderGeometry(0.30,0.30,0.019,24)
const inspectionLid = new THREE.CylinderGeometry(0.245,0.245,0.018,24)
for (const [x,z] of [[6.78,10.0],[7.89,9.85]]) {
  mesh(seven,inspectionRim,slate,x,0.010,z,false)
  mesh(seven,inspectionLid,curb,x,0.015,z,false)
}
const binEdge = edgePoint(acrossDriveway[1], -5.85)
const bins = frontage(binEdge.x, binEdge.y, 1, 0.15)
box(bins,drivewayPavers,0,-0.101,0,2.15,0.19,0.96,false)
const binBody = surface('#252828')
const binLid = surface('#b6a148')
for (const x of [-0.46,0.39]) {
  box(bins,binBody,x,0.46,0,0.77,0.87,0.70)
  box(bins,binLid,x,0.92,0,0.83,0.10,0.76)
  box(bins,frames,x,0.61,0.358,0.26,0.09,0.015)
}
box(bins,curb,0.94,0.46,0,0.15,0.92,0.89)
box(bins,curb,-0.96,0.46,-0.13,0.16,0.92,0.78)
box(bins,slate,-1.24,0.93,0.05,0.44,0.66,0.16)
for (const y of [0.73,0.92,1.11]) box(bins,silver,-1.24,y,0.139,0.34,0.026,0.014)

const brickHome = frontage(24,-9.8,1,-0.12)
solid(brickHome,brick,0,0,0,10.1,3.8,8.8)
for(const side of [-1,1]) {
  box(brickHome,slate,0,5.38,side*2.2,10.52,0.15,5.56).rotation.x=side*0.62
  const end = new THREE.BufferGeometry()
  end.setAttribute('position',new THREE.Float32BufferAttribute([side*5.04,3.8,-4.4,side*5.04,3.8,4.4,side*5.04,6.96,0],3))
  end.setIndex(side>0?[0,2,1]:[0,1,2])
  end.computeVertexNormals()
  mesh(brickHome,end,brick,0,0,0)
}
for (const x of [-1.55,1.65]) box(brickHome,timber,x,6.95,0.10,0.45,0.95,0.5)
solid(brickHome,brick,0.2,4.03,2.78,3.03,1.45,1.74)
box(brickHome,slate,0.2,5.49,2.77,3.2,0.13,1.97)
pane(brickHome,0.2,4.82,3.69,1.66,0.94)
for (const x of [0.65,3.40]) pane(brickHome,x,1.95,4.44,1.54,1.22,garageDoor)
solid(brickHome,brick,-3.13,0,4.89,3.72,2.85,1.29)
box(brickHome,slate,-3.13,2.9,4.91,3.96,0.16,1.55)
for(const x of [-4.26,-3.13,-2.0]) pane(brickHome,x,2.10,5.57,0.94,1.08)

const greenGate = surface('#385549', 23)
const brickOutbuilding = frontage(-65, -2.6, 1, 0.10)
solid(brickOutbuilding, brick, 0, 0, 0, 7.1, 2.6, 5.8)
gable(brickOutbuilding, brick, slate, 0, 0, 7.1, 5.8, 2.6, 2.12)
// IMG_2949: large green round-arched gate, two small green access doors.
const photoBrick = surface('#855248',30)
const mainArchX=-1.13, mainArchR=1.38
box(brickOutbuilding,greenGate,mainArchX,1.14,2.952,mainArchR*2,2.28,0.11)
const archPoints=[]
for(let j=0;j<=32;j++) {
 const t=j*Math.PI/32
 archPoints.push([mainArchX+mainArchR*Math.cos(t),2.28+mainArchR*Math.sin(t)])
}
const archPoly=[]
for(let j=0;j<32;j++) archPoly.push(mainArchX,2.28,3.018,...archPoints[j],3.018,...archPoints[j+1],3.018)
const archGeom=new THREE.BufferGeometry()
archGeom.setAttribute('position',new THREE.Float32BufferAttribute(archPoly,3))
archGeom.computeVertexNormals()
mesh(brickOutbuilding,archGeom,greenGate,0,0,0)
for(let j=0;j<=20;j++) {
 const t=j*Math.PI/20
 const x=mainArchX+(mainArchR+0.075)*Math.cos(t)
 const y=2.28+(mainArchR+0.075)*Math.sin(t)
 const v=box(brickOutbuilding,photoBrick,x,y,3.050,0.225,0.13,0.14)
 v.rotation.z=t-Math.PI/2
}
for(let j=0;j<18;j++) box(brickOutbuilding,timber,mainArchX-1.29+j*0.15,1.15,3.024,0.012,2.24,0.014)
for(const [x,w,h] of [[1.28,0.81,1.26],[2.36,0.78,1.26]]) {
 box(brickOutbuilding,greenGate,x,h/2,2.97,w,h,0.11)
 for(let j=0;j<5;j++) box(brickOutbuilding,timber,x-w/2+0.08+j*0.15,h/2,3.031,0.014,h-0.06,0.015)
 box(brickOutbuilding,photoBrick,x,h+0.075,2.995,w+0.16,0.15,0.15)
}
pavedArea(brickOutbuilding, 0, 4.03, 7.2, 2.27)
// Low weathered concrete frontage wall (IMG_2949), no solid pale barrier.
const lowConcrete=surface('#82847d',26)
for(const [x,w] of [[-2.50,1.76],[2.42,1.64]]) {
  solid(brickOutbuilding,lowConcrete,x,0,5.14,w,0.73,0.23)
  box(brickOutbuilding,curb,x,0.79,5.14,w+0.08,0.09,0.27)
}
for(const x of [-3.44,-1.54,1.54,3.34]) {
  box(brickOutbuilding,lowConcrete,x,0.45,5.12,0.26,0.90,0.34)
  box(brickOutbuilding,curb,x,0.92,5.12,0.31,0.075,0.37)
}

const terracotta = surface('#965645', 36, 4)
const yellowPlaster = surface('#bba477', 22)
for (const [building, wall, roof, width, depth, height, rise] of [
  [frontage(36, 17, -1, -0.14), yellowPlaster, slate, 9.8, 8.4, 4.64, 2.6],
  [frontage(52, 20, -1, -0.15), terracotta, slate, 9.4, 8.3, 4.55, 2.85],
  [frontage(47, -5.3, 1, -0.12), cream, roofs[1], 10.5, 8.5, 4.35, 2.45],
  [frontage(63, -3.4, 1, -0.17), brick, slate, 9.6, 8.4, 4.5, 2.77],
]) {
  solid(building, wall, 0, 0, 0, width, height, depth)
  gable(building, wall, roof, 0, 0, width, depth, height, rise)
  for (const x of [-2.65, 2.23]) {
    pane(building, x, 1.81, depth / 2 + 0.03, 1.21, 1.28)
    pane(building, x, 3.68, depth / 2 + 0.03, 1.04, 1.03)
  }
  box(building, garageDoor, 0, 1.10, depth / 2 + 0.029, 0.99, 2.18, 0.09)
  pane(building, 0, height + rise * 0.49, depth / 2 + 0.03, 0.58, 0.74)
  pavedArea(building, -3.05, depth / 2 + 1.2, 3.35, 2.42)
  solid(building, brick, 1.6, 0, depth / 2 + 2.13, 5.3, 0.44, 0.27)
  box(building, curb, 1.6, 0.47, depth / 2 + 2.13, 5.35, 0.075, 0.34)
  for (let x = -0.90; x < 4.16; x += 0.43) {
    const hedge = mesh(building, crown, leaves[1], x, 0.76, depth / 2 + 1.86)
    hedge.scale.set(0.47, 0.64, 0.40)
  }
}

const passageX = 14.9
const passage = frontage(passageX,-16.1,1,0.03)
pavedArea(passage,0,0.33,2.42,23.81)
for (const x of [-0.71,0.71]) {
  box(passage,white,x,0.46,11.45,0.10,0.92,0.10)
  for (const y of [0.26,0.56,0.84]) box(passage,red,x,y,11.45,0.105,0.13,0.105)
  obstacles.push({group:passage,minX:x-0.06,maxX:x+0.06,minZ:11.39,maxZ:11.51})
}
for (const x of [-1.65,1.65]) for (let i=0;i<17;i++) {
  const bush=mesh(passage,crown,leaves[i%3],x+(random()-0.5)*0.4,0.38,-10+i*1.22)
  bush.scale.set(0.57,0.37+random()*0.26,0.83)
}
for (const [x,z,side] of [[-66,17,1],[-47,15.7,1],[-24,11.8,1],[14,-8,-1],[14,-22,-1],[20,6.1,1],[40,-1.8,-1],[62,15.4,1]]) {
  box(scene,silver,x,2.45,z,0.115,4.9,0.115)
  box(scene,silver,x,4.89,z-side*0.36,0.125,0.13,0.76)
  box(scene,slate,x,4.85,z-side*0.80,0.29,0.17,0.53)
  box(scene,lightBox,x,4.747,z-side*0.81,0.25,0.05,0.44)
  nightLamp(scene,x,4.72,z-side*0.81,'#ffb14c',145,20)
}
const cover = new THREE.CylinderGeometry(0.32,0.32,0.023,28)
const ironRing=surface('#484848',18), insetLid=surface('#77746d',19)
for(const [x,z] of [[-51,8.6],[-48.4,9.6],[-20,4.75],[14,0.9],[26,1.23],[-62.3,8.3]]) {
 mesh(scene,cover,ironRing,x,0.012,z,false)
 mesh(scene,new THREE.CylinderGeometry(0.252,0.252,0.021,28),insetLid,x,0.029,z,false)
}
const drainCover=surface('#373c3b')
for(const [x,z] of [[-60.8,10.2],[-56.7,9.1]]) {
 box(scene,drainCover,x,0.013,z,0.48,0.026,0.28,false)
 for(let j=0;j<6;j++) box(scene,curb,x-0.17+j*0.068,0.034,z,0.016,0.01,0.26,false)
}

// The second pin is across the road, slightly east of the first house.
const villa = new THREE.Group()
villa.position.set(8.5, 0.04, 16.8)
villa.rotation.y = Math.PI - 0.105
scene.add(villa)

const villaWall = surface('#e5dacc', 28)
const villaTrim = surface('#e4dccb')
const villaRoof = surface('#302d2b')
const villaStone = surface('#a99f89', 80)
const villaIron = surface('#292825')
const courtyard = surface('#80796d', 75)
const windowGlass = surface('#444e58')
const curtain = surface('#948984')

function villaBox(mat, x, y, z, width, height, depth) {
  return box(villa, mat, x, y, z, width, height, depth)
}
function roofTiles(x, z, w, d, eave, rise, ridge) {
  const corners = [
    [-w / 2, eave, -d / 2], [w / 2, eave, -d / 2],
    [w / 2, eave, d / 2], [-w / 2, eave, d / 2]
  ].map(point => new THREE.Vector3(...point))
  const left = new THREE.Vector3(-ridge / 2, eave + rise, 0)
  const right = new THREE.Vector3(ridge / 2, eave + rise, 0)
  const slopes = [
    [corners[0], corners[1], left, right], [corners[1], corners[2], right, right],
    [corners[2], corners[3], right, left], [corners[3], corners[0], left, left]
  ]
  const positions = [], indices = []
  for (const [e0, e1, r0, r1] of slopes) {
    const rows = Math.ceil(e0.distanceTo(r0) / 0.31)
    for (let row = 0; row < rows; row++) {
      const low = row / rows
      const high = Math.min(1, (row + 1.18) / rows)
      const a = e0.clone().lerp(r0, low)
      const b = e1.clone().lerp(r1, low)
      const c = e0.clone().lerp(r0, high)
      const d = e1.clone().lerp(r1, high)
      const columns = Math.max(1, Math.round(a.distanceTo(b) / 0.28))
      for (let col = 0; col < columns; col++) {
        const base = positions.length / 3
        for (const [from, to, upper] of [[a,b,false],[c,d,true]]) {
          for (const [across, relief] of [[0.025,0.043],[0.31,0.088],[0.58,0.082],[0.975,0.032]]) {
            const point = from.clone().lerp(to, (col + across) / columns)
            positions.push(point.x, point.y + relief + (upper ? 0 : 0.024), point.z)
          }
        }
        for (let i = 0; i < 3; i++) {
          const n = base + i
          indices.push(n, n + 1, n + 4, n + 1, n + 5, n + 4)
        }
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  const tile = new THREE.MeshStandardMaterial({ color: '#383432', roughness: 0.62, side: THREE.DoubleSide })
  mesh(villa, geometry, tile, x, 0, z)

  function ridgeCap(a, b) {
    const delta = new THREE.Vector3().subVectors(b, a)
    const count = Math.ceil(delta.length() / 0.34)
    for (let i = 0; i < count; i++) {
      const p = a.clone().lerp(b, (i + 0.5) / count)
      const cap = villaBox(tile, x + p.x, p.y + 0.072, z + p.z, 0.18, 0.115, delta.length() / count + 0.018)
      cap.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), delta.clone().normalize())
    }
  }
  ridgeCap(left, right)
  corners.forEach((corner, i) => ridgeCap(corner, i === 0 || i === 3 ? left : right))
}

function hipRoof(x, z, w, d, eave, rise, ridge) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -w/2,eave,-d/2, w/2,eave,-d/2, w/2,eave,d/2, -w/2,eave,d/2,
    -ridge/2,eave+rise,0, ridge/2,eave+rise,0
  ], 3))
  geometry.setIndex([0,4,1,1,4,5,1,5,2,2,5,3,3,5,4,3,4,0])
  geometry.computeVertexNormals()
  villaRoof.side = THREE.DoubleSide
  mesh(villa, geometry, villaRoof, x, 0, z)
  villaBox(villaTrim, x, eave - 0.12, z, w, 0.18, d)
  villaBox(villaIron, x, eave + 0.015, z + d/2, w, 0.095, 0.11)
  roofTiles(x, z, w, d, eave, rise, ridge)
}
const mainWidth = 12.7
const front = 4.7
villaBox(villaWall, 0, 2.88, 0, mainWidth, 5.76, 9.4)
villaBox(villaStone, 0, 0.26, 0, mainWidth + 0.05, 0.47, 9.46)
hipRoof(0, 0, 13.3, 10, 5.86, 3.40, 6.6)
for (const x of [2.48, 2.85]) {
  villaBox(villaIron, x, 9.26, -0.25, 0.12, 0.42, 0.12)
  villaBox(villaRoof, x, 9.48, -0.25, 0.17, 0.065, 0.16)
}

for (const x of [-6.06, 6.06]) {
  for (let course = 0; course < 11; course++) {
    villaBox(villaTrim, x, 0.51 + course * 0.49, front + 0.04, 0.59, 0.464, 0.13)
  }
}
function villaWindow(x, y, z, shade) {
  villaBox(villaTrim, x, y, z, 1.36, 1.69, 0.10)
  villaBox(villaIron, x, y, z + 0.053, 1.15, 1.48, 0.04)
  villaBox(windowGlass, x, y, z + 0.077, 1.02, 1.35, 0.025)
  villaBox(villaTrim, x, y - 0.87, z + 0.071, 1.50, 0.085, 0.29)
  if (shade) {
    for (let i = 0; i < 8; i++) {
      villaBox(curtain, x - 0.43 + i * 0.108, y + 0.30, z + 0.093, 0.064, 0.64, 0.012)
    }
  }
}
for (const x of [-4.05, 0, 4.02]) villaWindow(x, 4.38, front + 0.03, true)
for (const x of [-4.05, 4.02]) villaWindow(x, 1.65, front + 0.03, false)

villaBox(villaWall, -7.15, 2.52, -0.65, 2.2, 5.04, 6.6)
hipRoof(-7.15, -0.65, 2.9, 7.15, 5.11, 0.88, 1.1)
villaWindow(-7.28, 3.82, 2.68, false)
for (let i = 0; i < 6; i++) villaBox(villaIron, -7.73 + i * 0.18, 3.24, 2.9, 0.026, 0.48, 0.026)
villaBox(villaIron, -7.28, 3.49, 2.9, 1.05, 0.042, 0.045)

villaBox(villaTrim, 0, 0.10, 5.62, 5.50, 0.18, 2.00)
villaBox(villaStone, 0, 0.26, 5.60, 5.21, 0.15, 1.88)
villaBox(villaTrim, 0, 2.97, 5.55, 5.03, 0.23, 1.95)
villaBox(villaTrim, 0, 3.16, 5.55, 5.40, 0.17, 2.19)
villaBox(villaTrim, 0, 3.32, 5.55, 5.67, 0.15, 2.31)
const shaft = new THREE.CylinderGeometry(0.145, 0.19, 2.38, 24)
for (const x of [-1.91, 1.91]) {
  villaBox(villaTrim, x, 0.37, 6.29, 0.48, 0.12, 0.48)
  mesh(villa, shaft, villaTrim, x, 1.59, 6.29)
  for (let flute = 0; flute < 14; flute++) {
    const a = flute * Math.PI / 7
    villaBox(villaTrim, x + Math.cos(a)*0.155, 1.59, 6.29 + Math.sin(a)*0.155, 0.024, 2.23, 0.024)
  }
  villaBox(villaTrim, x, 2.79, 6.29, 0.43, 0.13, 0.43)
}
villaBox(villaIron, 0, 1.45, front + 0.06, 2.41, 2.46, 0.11)
villaBox(villaTrim, 0, 1.45, front + 0.13, 1.17, 2.42, 0.12)
for (const x of [-0.91, 0.91]) villaBox(windowGlass, x, 1.45, front + 0.13, 0.43, 2.25, 0.04)
villaBox(villaIron, 0.41, 1.43, front + 0.214, 0.036, 0.41, 0.045)
villaBox(courtyard, 0, -0.016, 7.11, 16.0, 0.11, 4.8)
// Street-facing wall behind the first two iron fence bays.
const sideWall = surface('#e0d5c1', 24)
villaBox(sideWall, -7.49, 1.09, 9.22, 6.82, 2.18, 0.30)
villaBox(villaStone, -7.49, 0.17, 9.23, 6.87, 0.28, 0.35)
villaBox(villaTrim, -7.49, 2.19, 9.22, 6.97, 0.10, 0.43)
villaBox(sideWall, -4.23, 1.02, 8.35, 0.28, 2.04, 1.67)
villaBox(villaTrim, -4.23, 2.05, 8.35, 0.39, 0.09, 1.77)
obstacles.push({ group: villa, minX: -10.97, maxX: -4.01, minZ: 9.03, maxZ: 9.43 })
obstacles.push({ group: villa, minX: -4.44, maxX: -4.03, minZ: 7.46, maxZ: 9.26 })

const fenceZ = 10.0
const posts = [-10.8, -7.4, -4.05, -0.9, 0.64, 5.3, 8.75, 11.5]
const finial = new THREE.ConeGeometry(0.067, 0.22, 4)
for (const x of posts) {
  villaBox(villaStone, x, 0.88, fenceZ, 0.47, 1.76, 0.48)
  villaBox(villaStone, x, 1.80, fenceZ, 0.56, 0.10, 0.57)
  for (let course = 1; course <= 11; course++) {
    villaBox(courtyard, x, course * 0.146, fenceZ + 0.241, 0.468, 0.015, 0.01)
  }
}
for (let i = 1; i < posts.length; i++) {
  const left = posts[i - 1] + 0.238
  const right = posts[i] - 0.238
  const span = right - left
  const x = (left + right) / 2
  const gate = i === 4 || i === 5
  if (!gate) villaBox(villaStone, x, 0.17, fenceZ, span, 0.34, 0.31)
  for (const y of [gate ? 0.18 : 0.40, 0.74, 1.40]) {
    villaBox(villaIron, x, y, fenceZ, span, 0.041, 0.056)
  }
  const bars = Math.ceil(span / 0.21)
  for (let j = 0; j < bars; j++) {
    const px = left + (j + 0.5) * span / bars
    villaBox(villaIron, px, 0.92, fenceZ, 0.027, 1.45, 0.027)
    mesh(villa, finial, villaIron, px, 1.71, fenceZ)
  }
}
for (const [x,h] of [[-5.6,1.08],[-4.4,0.59],[-3.4,0.44],[3.55,0.56],[4.88,1.03],[5.91,0.53]]) {
  const bush = mesh(villa, crown, leaves[1], x, h * 0.46, 5.02)
  bush.scale.set(0.45, h * 0.63, 0.41)
}
obstacles.push({ group: villa, minX: -11.1, maxX: 11.8, minZ: 9.72, maxZ: 10.29 })
obstacles.push({ group: villa, minX: -6.35, maxX: 6.35, minZ: -4.7, maxZ: 4.7 })

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
  status.textContent = 'V22 · Fotoabgleich · 200 m'
  document.body.dataset.ready = 'true'
}).catch(error => {
  console.error(error)
  status.textContent = 'Das Originalhaus konnte nicht geladen werden.'
})

// All viewpoints navigate within the SAME continuous Three.js scene.
let yaw, pitch
const keys = new Set()
const locationSelect = document.querySelector('#location')
function reset() {
  camera.position.set(-10.8, 1.76, 5.0)
  yaw = -0.46
  pitch = 0.08
}
// Buildings are approximated from the supplied photos and aerial reference.
// Use the actual road geometry for a safe opposite-side vantage point.
const landmarks = {
  eight: [-31, 16.8],
  ten: [-14, 11.8],
  seven: [-27, -11.0],
  brickgate: [-65, -2.6],
  brickhome: [24, -9.8],
  gables: [-47, -2.0],
  passage: [14.9, -16.1],
}
function viewLandmark(x, z) {
  let nearest = points[0]
  let best = Infinity
  for (const point of points) {
    const d = (point.p.x - x) ** 2 + (point.p.z - z) ** 2
    if (d < best) { best = d; nearest = point }
  }
  const signed = (x - nearest.p.x) * nearest.nx + (z - nearest.p.z) * nearest.nz
  const offset = (signed >= 0 ? -1 : 1) * 3.75
  const cx = nearest.p.x + nearest.nx * offset
  const cz = nearest.p.z + nearest.nz * offset
  camera.position.set(cx, 1.86, cz)
  const dx = x - cx, dz = z - cz
  yaw = Math.atan2(-dx, -dz)
  pitch = Math.atan2(2.7 - camera.position.y, Math.hypot(dx, dz))
}
function lookTowards(x,z,tx,tz,height=3.9) {
  camera.position.set(x,1.82,z)
  const dx=tx-x,dz=tz-z
  yaw=Math.atan2(-dx,-dz)
  pitch=Math.atan2(height-1.82,Math.hypot(dx,dz))
}
function chooseArea(area) {
  keys.clear()
  switch (area) {
    case 'start': reset(); break
    case 'villa': camera.position.set(8.8, 1.86, -3.8); yaw = Math.PI + 0.025; pitch = 0.15; break
    case 'section': camera.position.set(-63.8, 1.78, 5.3); yaw = -Math.PI / 2 - 0.13; pitch = 0.02; break
    case 'junction': camera.position.set(-57.8, 1.82, 7.6); yaw = 3.06; pitch = 0.08; break
    case 'kiosk': lookTowards(-64,3,-48,15,4.1); break
    case 'eight': lookTowards(-17,2,-34,14,3.5); break
    case 'seven': lookTowards(4,5,-27,-4,4.9); break
    default: if (landmarks[area]) viewLandmark(...landmarks[area]); else reset()
  }
  locationSelect.value = area in landmarks || ['start','villa','section','junction','kiosk'].includes(area) ? area : 'start'
}
chooseArea('start')
document.querySelector('#reset').addEventListener('click', () => chooseArea('start'))
locationSelect.addEventListener('change', () => chooseArea(locationSelect.value))
const movementKeys = ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight']
window.addEventListener('keydown', event => {
  if (!movementKeys.includes(event.code)) return
  event.preventDefault()
  keys.add(event.code)
})
window.addEventListener('keyup', event => keys.delete(event.code))
window.addEventListener('blur', () => keys.clear())
document.addEventListener('visibilitychange', () => { if (document.hidden) keys.clear() })
for (const button of document.querySelectorAll('[data-key]')) {
  button.addEventListener('pointerdown', event => {
    button.setPointerCapture(event.pointerId)
    keys.add(button.dataset.key)
  })
  for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    button.addEventListener(eventName, () => keys.delete(button.dataset.key))
  }
}
const canvas = renderer.domElement
const nightButton=document.querySelector('#night')
let night=false
nightButton.addEventListener('click', () => {
  night=!night
  nightButton.setAttribute('aria-pressed', String(night))
  nightButton.textContent=night?'Tag':'Nacht'
  const background=night?'#272b34':'#b9d0df'
  scene.background.set(background)
  scene.fog.color.set(background)
  skyLight.intensity=night?0.27:2.1
  sun.intensity=night?0.005:2.4
  asphalt.roughness=night?0.68:0.94
  shopLight.emissiveIntensity=night?1.07:0.75
  lightBox.emissiveIntensity=night?2.1:0.7
  for (const { light, power } of nightLights) light.intensity=night?power:0
})
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
  renderer.setSize(innerWidth, innerHeight, false)
  camera.aspect = innerWidth / Math.max(innerHeight, 1)
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
