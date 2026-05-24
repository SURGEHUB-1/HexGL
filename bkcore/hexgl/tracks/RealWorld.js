/*
 * RealWorld Track for HexGL
 * Open-world driving with terrain, roads, trees and lighting
 */

var bkcore = bkcore || {};
bkcore.hexgl = bkcore.hexgl || {};
bkcore.hexgl.tracks = bkcore.hexgl.tracks || {};

bkcore.hexgl.tracks.RealWorld = {

  name: "RealWorld",

  checkpoints: {
    list: [0, 1, 2],
    start: 0,
    last: 2
  },

  spawn: { x: 0, y: 10, z: 0 },
  spawnRotation: { x: 0, y: 0, z: 0 },

  // Required by HexGL - dummy analyser so Gameplay doesn't crash
  analyser: null,
  pixelRatio: 1.0,

  lib: null,
  materials: {},

  // ── Required by HexGL.prototype.init ─────────────────────────────────────
  buildMaterials: function(quality) {
    // No pre-built materials needed; we create them inline in buildScenes
  },

  // ── Required by HexGL.prototype.init ─────────────────────────────────────
  buildScenes: function(ctx, quality) {

    // ── SKYBOX SCENE (HexGL renders this as a separate pass) ──────────────
    var sceneCube = new THREE.Scene();
    var cameraCube = new THREE.PerspectiveCamera(70, ctx.width / ctx.height, 1, 100000);
    sceneCube.add(cameraCube);

    // Solid colour sky fallback (no external cube textures needed)
    sceneCube.background = new THREE.Color(0x87CEEB);
    ctx.manager.add("sky", sceneCube, cameraCube);

    // ── MAIN GAME SCENE ───────────────────────────────────────────────────
    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 2000, 8000);

    var camera = new THREE.PerspectiveCamera(70, ctx.width / ctx.height, 1, 60000);
    scene.add(camera);

    // Ambient light
    scene.add(new THREE.AmbientLight(0xaaaaaa));

    // Sun
    var sun = new THREE.DirectionalLight(0xfff5e0, 1.5);
    sun.position.set(-2000, 3000, 1000);
    sun.lookAt(new THREE.Vector3());
    scene.add(sun);

    // ── TERRAIN ───────────────────────────────────────────────────────────
    var terrainGeo = new THREE.PlaneGeometry(20000, 20000, 64, 64);
    terrainGeo.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    var terrainMat = new THREE.MeshLambertMaterial({ color: 0x3a7d2a });
    var terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.position.y = 0;
    scene.add(terrain);

    // ── ROADS ─────────────────────────────────────────────────────────────
    function makeRoad(width, length, rotY, x, z) {
      var geo = new THREE.PlaneGeometry(width, length);
      geo.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
      var mat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.y = rotY || 0;
      mesh.position.set(x || 0, 0.5, z || 0);
      scene.add(mesh);

      // White centre line
      var lineGeo = new THREE.PlaneGeometry(1, length);
      lineGeo.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
      var lineMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      var line = new THREE.Mesh(lineGeo, lineMat);
      line.rotation.y = rotY || 0;
      line.position.set(x || 0, 0.6, z || 0);
      scene.add(line);
    }

    makeRoad(30, 8000, 0,          0,    0);   // N-S road
    makeRoad(30, 8000, Math.PI/2,  0,    0);   // E-W road

    // ── TREES ─────────────────────────────────────────────────────────────
    var trunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 6, 6);
    var trunkMat = new THREE.MeshLambertMaterial({ color: 0x5c3a1e });
    var leafGeo  = new THREE.ConeGeometry(4, 10, 7);
    var leafMat  = new THREE.MeshLambertMaterial({ color: 0x2d6a2d });

    for (var i = 0; i < 300; i++) {
      var x = (Math.random() - 0.5) * 18000;
      var z = (Math.random() - 0.5) * 18000;
      // Keep trees off the roads
      if (Math.abs(x) < 40 || Math.abs(z) < 40) continue;

      var trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(x, 3, z);
      scene.add(trunk);

      var leaves = new THREE.Mesh(leafGeo, leafMat);
      leaves.position.set(x, 11, z);
      scene.add(leaves);
    }

    // ── BUILDINGS (city block at origin) ─────────────────────────────────
    var buildingColors = [0x888888, 0x999999, 0x777777, 0xaaaaaa];
    for (var b = 0; b < 40; b++) {
      var bx = (Math.floor(Math.random() * 10) - 5) * 120 + (Math.random()-0.5)*40;
      var bz = (Math.floor(Math.random() * 10) - 5) * 120 + (Math.random()-0.5)*40;
      if (Math.abs(bx) < 60 || Math.abs(bz) < 60) continue;
      var bh = 30 + Math.random() * 120;
      var bGeo = new THREE.BoxGeometry(20 + Math.random()*20, bh, 20 + Math.random()*20);
      var bMat = new THREE.MeshLambertMaterial({
        color: buildingColors[Math.floor(Math.random() * buildingColors.length)]
      });
      var building = new THREE.Mesh(bGeo, bMat);
      building.position.set(bx, bh / 2, bz);
      scene.add(building);
    }

    // ── PLAYER CAR (box stand-in until you load a real model) ────────────
    var carBody = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1, 4),
      new THREE.MeshPhongMaterial({ color: 0xff2200 })
    );
    var carRoof = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.7, 2),
      new THREE.MeshPhongMaterial({ color: 0xcc1100 })
    );
    carRoof.position.set(0, 0.85, 0);
    carBody.add(carRoof);
    carBody.position.set(
      this.spawn.x, this.spawn.y, this.spawn.z
    );
    scene.add(carBody);

    // ── SHIP CONTROLS (reuse existing — still needed by Gameplay) ─────────
    // We create a minimal ShipControls with collision disabled
    var shipControls = new bkcore.hexgl.ShipControls(ctx);
    shipControls.collisionDetection = false;   // no pixel-map needed
    shipControls.control(carBody);
    ctx.components.shipControls = shipControls;
    ctx.tweakShipControls();

    // Dummy analyser so Gameplay.checkPoint() doesn't throw
    this.analyser = {
      pixels: { width: 1, height: 1 },
      getPixel: function() { return { r: 0, g: 0, b: 0 }; }
    };

    // ── STREET LIGHTS along N-S road ─────────────────────────────────────
    for (var li = -600; li <= 600; li += 100) {
      var pole = new THREE.PointLight(0xffdd88, 1.2, 120);
      pole.position.set(18, 12, li);
      scene.add(pole);

      var poleGeo = new THREE.CylinderGeometry(0.2, 0.2, 12, 5);
      var poleMesh = new THREE.Mesh(poleGeo,
        new THREE.MeshLambertMaterial({ color: 0x444444 }));
      poleMesh.position.set(18, 6, li);
      scene.add(poleMesh);
    }

    // Register the scene with the manager (same pattern as Cityscape)
    ctx.manager.add("game", scene, camera);

    // Store camera so CameraChase can follow it
    ctx.components.cameraChase = new bkcore.hexgl.CameraChase(
      ctx, camera, shipControls.dummy
    );
  },

  // ── Called by HexGL.prototype.load ───────────────────────────────────────
  load: function(opts, quality) {
    // RealWorld builds everything procedurally — no external assets to load.
    // We must call onLoad so the game proceeds past the loading screen.
    if (opts && typeof opts.onLoad === 'function') {
      opts.onLoad();
    }
  }

};
