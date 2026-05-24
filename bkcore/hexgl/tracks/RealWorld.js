/*
 * RealWorld Track for HexGL — definitive version
 * Loads every asset HexGL.js internally requires (hex, HUD images)
 * plus the Feisar ship. Everything else is procedural.
 */

var bkcore = bkcore || {};
bkcore.hexgl = bkcore.hexgl || {};
bkcore.hexgl.tracks = bkcore.hexgl.tracks || {};

bkcore.hexgl.tracks.RealWorld = {

  name: "RealWorld",
  checkpoints: { list: [0,1,2], start: 0, last: 2 },
  spawn:         { x: 0, y: 60, z: 0 },
  spawnRotation: { x: 0, y:  0, z: 0 },
  analyser:   null,
  pixelRatio: 1.0,
  lib:       null,
  materials: {},

  // ── LOAD ────────────────────────────────────────────────────────────────
  // HexGL.js calls lib.get("textures","hex") in initGameComposer()
  // and lib.get("images","hud.bg/speed/shield") in initHUD().
  // Those MUST be in the manifest or the renderer gets null and goes black.
  load: function(opts, quality)
  {
    this.lib = new bkcore.threejs.Loader(opts);

    // quality 3 = VERY HIGH (default in launch.js) → use textures.full/
    var t = (quality > 2) ? 'textures.full' : 'textures';

    this.lib.load({
      textures: {
        // ── Required by initGameComposer() ──────────────────────────────
        'hex'                  : t + '/hud/hex.jpg',
        // ── Ship ────────────────────────────────────────────────────────
        'ship.feisar.diffuse'  : t + '/ships/feisar/diffuse.jpg',
        'ship.feisar.specular' : t + '/ships/feisar/specular.jpg',
        'ship.feisar.normal'   : t + '/ships/feisar/normal.jpg',
        'booster.diffuse'      : t + '/ships/feisar/booster/booster.png',
        'booster.sprite'       : t + '/ships/feisar/booster/boostersprite.jpg'
      },
      // ── Required by initHUD() ────────────────────────────────────────
      images: {
        'hud.bg'     : t + '/hud/hud-bg.png',
        'hud.speed'  : t + '/hud/hud-fg-speed.png',
        'hud.shield' : t + '/hud/hud-fg-shield.png'
      },
      texturesCube: {
        'skybox.dawnclouds' : t + '/skybox/dawnclouds/%1.jpg'
      },
      geometries: {
        'ship.feisar' : 'geometries/ships/feisar/feisar.js',
        'booster'     : 'geometries/booster/booster.js'
      }
    });
  },

  // ── BUILD MATERIALS ─────────────────────────────────────────────────────
  buildMaterials: function(quality)
  {
    if (quality > 2)
    {
      this.materials.ship = bkcore.Utils.createNormalMaterial({
        diffuse  : this.lib.get('textures', 'ship.feisar.diffuse'),
        specular : this.lib.get('textures', 'ship.feisar.specular'),
        normal   : this.lib.get('textures', 'ship.feisar.normal'),
        ambient  : 0x444444, shininess: 42, metal: true, perPixel: false
      });
    }
    else
    {
      this.materials.ship = new THREE.MeshBasicMaterial({
        map: this.lib.get('textures', 'ship.feisar.diffuse'),
        ambient: 0xaaaaaa
      });
    }

    this.materials.booster = new THREE.MeshBasicMaterial({
      map: this.lib.get('textures', 'booster.diffuse'),
      transparent: true
    });
  },

  // ── BUILD SCENES ────────────────────────────────────────────────────────
  buildScenes: function(ctx, quality)
  {
    // Dummy analyser — Gameplay.checkPoint() reads this every frame
    this.analyser = {
      pixels:   { width: 512, height: 512 },
      getPixel: function() { return { r: 0, g: 0, b: 0 }; }
    };

    // ── SKYBOX (separate scene, same pattern as Cityscape) ───────────────
    var sceneCube  = new THREE.Scene();
    var cameraCube = new THREE.PerspectiveCamera(70, ctx.width / ctx.height, 1, 100000);
    sceneCube.add(cameraCube);

    var skyShader = THREE.ShaderUtils.lib['cube'];
    skyShader.uniforms['tCube'].texture = this.lib.get('texturesCube', 'skybox.dawnclouds');
    var skyMesh = new THREE.Mesh(
      new THREE.CubeGeometry(100, 100, 100),
      new THREE.ShaderMaterial({
        fragmentShader: skyShader.fragmentShader,
        vertexShader:   skyShader.vertexShader,
        uniforms:       skyShader.uniforms,
        depthWrite:     false
      })
    );
    skyMesh.flipSided = true;
    sceneCube.add(skyMesh);
    ctx.manager.add('sky', sceneCube, cameraCube);

    // ── MAIN SCENE ───────────────────────────────────────────────────────
    var scene  = new THREE.Scene();
    scene.fog  = new THREE.FogExp2(0x88aacc, 0.00008);
    var camera = new THREE.PerspectiveCamera(70, ctx.width / ctx.height, 1, 60000);
    scene.add(camera);
    scene.add(new THREE.AmbientLight(0xbbbbbb));

    var sun = new THREE.DirectionalLight(0xfff5e0, 1.5);
    sun.position.set(-2000, 3000, 1000);
    sun.lookAt(new THREE.Vector3());
    if (quality > 2) {
      sun.castShadow = true;
      sun.shadowCameraRight  =  3000; sun.shadowCameraLeft   = -3000;
      sun.shadowCameraTop    =  3000; sun.shadowCameraBottom = -3000;
      sun.shadowBias = 0.0001; sun.shadowDarkness = 0.7;
      sun.shadowMapWidth = 2048; sun.shadowMapHeight = 2048;
    }
    scene.add(sun);

    // ── TERRAIN ──────────────────────────────────────────────────────────
    var terrainGeo = new THREE.PlaneGeometry(20000, 20000, 32, 32);
    terrainGeo.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    scene.add(new THREE.Mesh(terrainGeo,
      new THREE.MeshLambertMaterial({ color: 0x3a7d2a, ambient: 0x224422 })));

    // ── ROADS ────────────────────────────────────────────────────────────
    function addRoad(length, rotY) {
      var g = new THREE.PlaneGeometry(30, length);
      g.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
      var road = new THREE.Mesh(g,
        new THREE.MeshLambertMaterial({ color: 0x222222, ambient: 0x111111 }));
      road.rotation.y = rotY; road.position.y = 1;
      scene.add(road);
      for (var d = -length/2; d < length/2; d += 80) {
        var dg = new THREE.PlaneGeometry(1.5, 40);
        dg.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
        var dash = new THREE.Mesh(dg,
          new THREE.MeshLambertMaterial({ color: 0xffffff }));
        dash.rotation.y = rotY;
        dash.position.set(Math.sin(rotY)*d, 1.1, Math.cos(rotY)*d);
        scene.add(dash);
      }
    }
    addRoad(10000, 0);            // N–S
    addRoad(10000, Math.PI / 2);  // E–W

    // ── TREES ────────────────────────────────────────────────────────────
    var trunkMat = new THREE.MeshLambertMaterial({ color: 0x5c3a1e });
    var leafMat  = new THREE.MeshLambertMaterial({ color: 0x2d6a2d });
    var trunkGeo = new THREE.CylinderGeometry(0.6, 1.0, 7, 6);
    var leafGeo  = new THREE.ConeGeometry(5, 12, 7);
    for (var i = 0; i < 250; i++) {
      var tx = (Math.random()-0.5)*16000, tz = (Math.random()-0.5)*16000;
      if (Math.abs(tx) < 50 && Math.abs(tz) < 50) continue;
      var trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(tx, 3.5, tz); scene.add(trunk);
      var leaves = new THREE.Mesh(leafGeo, leafMat);
      leaves.position.set(tx, 13, tz); scene.add(leaves);
    }

    // ── BUILDINGS ────────────────────────────────────────────────────────
    var bColors = [0x888888,0x777777,0x999999,0x666666,0xaaaaaa];
    for (var b = 0; b < 60; b++) {
      var bx = (Math.floor(Math.random()*12)-6)*130;
      var bz = (Math.floor(Math.random()*12)-6)*130;
      if (Math.abs(bx) < 70 || Math.abs(bz) < 70) continue;
      var bh = 30 + Math.random()*150;
      var building = new THREE.Mesh(
        new THREE.BoxGeometry(18+Math.random()*24, bh, 18+Math.random()*24),
        new THREE.MeshLambertMaterial({
          color: bColors[b % bColors.length], ambient: 0x333333 }));
      building.position.set(bx, bh/2, bz);
      scene.add(building);
    }

    // ── STREET LIGHTS ────────────────────────────────────────────────────
    var poleMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var poleGeo = new THREE.CylinderGeometry(0.3, 0.3, 14, 5);
    for (var li = -600; li <= 600; li += 120) {
      [18, -18].forEach(function(side) {
        var pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(side, 7, li); scene.add(pole);
        var light = new THREE.PointLight(0xffdd88, 1.5, 140);
        light.position.set(side, 15, li); scene.add(light);
      });
    }

    // ── ORIGINAL FEISAR SHIP ─────────────────────────────────────────────
    var ship = ctx.createMesh(scene,
      this.lib.get('geometries','ship.feisar'),
      this.spawn.x, this.spawn.y, this.spawn.z,
      this.materials.ship);

    var booster = ctx.createMesh(ship,
      this.lib.get('geometries','booster'),
      0, 0.665, -3.8, this.materials.booster);
    booster.depthWrite = false;

    var boosterSprite = new THREE.Sprite({
      map: this.lib.get('textures','booster.sprite'),
      blending: THREE.AdditiveBlending,
      useScreenCoordinates: false, color: 0xffffff
    });
    boosterSprite.scale.set(0.02, 0.02, 0.02);
    boosterSprite.mergeWith3D = false;
    booster.add(boosterSprite);

    if (quality > 0) {
      var bl = new THREE.PointLight(0x00a2ff, 4.0, 60);
      bl.position.set(0, 0.665, -4);
      ship.add(bl);
    }

    // ── SHIP CONTROLS ────────────────────────────────────────────────────
    var shipControls = new bkcore.hexgl.ShipControls(ctx);
    shipControls.collisionDetection = false;
    shipControls.control(ship);
    ctx.components.shipControls = shipControls;
    ctx.tweakShipControls();

    // ── CAMERA ───────────────────────────────────────────────────────────
    ctx.components.cameraChase = new bkcore.hexgl.CameraChase(
      ctx, camera, shipControls.dummy);

    ctx.manager.add('game', scene, camera);
  }
};
