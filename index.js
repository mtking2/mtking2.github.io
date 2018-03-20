var DancingDots = require('dancing-dots')
var delaunay = require('delaunay-fast')

// var headerEl = document.body
var headerEl = document.getElementById('header')
var canvasEl = document.getElementById('headerCanvas')
var ctx = canvasEl.getContext('2d')
var triangles

var headerSizes = headerEl.getBoundingClientRect()
const originalRatio = Math.round(headerSizes.width / headerSizes.height * 100)

var dancingDotsIntance = new DancingDots({
  getOnlyInts: false,
  dotCount: 30,
  speed: 0.02,
  height: 100,
  width: originalRatio
})

function updateTriangles() {
  var headerSizes = headerEl.getBoundingClientRect()
  var dotsBase = [
    [0, 0],
    [0, headerSizes.height],
    [headerSizes.width, 0],
    [headerSizes.width, headerSizes.height],
    [headerSizes.width / 2, 0],
    [headerSizes.width / 2, headerSizes.height]
  ]
  var dots = dotsBase.concat(
    dancingDotsIntance.getCoordsAndUpdate().map(function(dot) {
      return [dot.x / originalRatio * headerSizes.width, dot.y / 100 * headerSizes.height]
    })
  )
  triangles = delaunay.triangulate(dots)
}

function draw() {
  var headerSizes = headerEl.getBoundingClientRect()
  var dotsBase = [
    [0, 0],
    [0, headerSizes.height],
    [headerSizes.width, 0],
    [headerSizes.width, headerSizes.height],
    [headerSizes.width / 2, 0],
    [headerSizes.width / 2, headerSizes.height]
  ]
  var dots = dotsBase.concat(
    dancingDotsIntance.getCoordsAndUpdate().map(function(dot) {
      return [dot.x / originalRatio * headerSizes.width, dot.y / 100 * headerSizes.height]
    })
  )

  canvasEl.width = headerSizes.width
  canvasEl.height = headerSizes.height

  for (var i = triangles.length; i; ) {
    ctx.beginPath()
    ctx.strokeStyle = '#333'
    --i
    ctx.moveTo(dots[triangles[i]][0], dots[triangles[i]][1])
    --i
    ctx.lineTo(dots[triangles[i]][0], dots[triangles[i]][1])
    --i
    ctx.lineTo(dots[triangles[i]][0], dots[triangles[i]][1])
    ctx.closePath()
    ctx.stroke()
  }

  dots.forEach(function(dot, dotIndex) {
    drawCircle(dot[0], dot[1])
  })

  function drawCircle(x, y, intensity) {
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, 2 * Math.PI, false)
    ctx.fillStyle = '#333'
    ctx.fill()
  }

  window.requestAnimationFrame(draw)
}

updateTriangles()
window.setInterval(updateTriangles, 8192)
window.requestAnimationFrame(draw)
