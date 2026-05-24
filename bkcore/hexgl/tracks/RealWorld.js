bkcore.hexgl.tracks.RealWorld = {
  name: "RealWorld",
  checkpoints: { list: [0,1,2], start: 0, last: 2 },
  spawn: { x: 0, y: 10, z: 0 },
  spawnRotation: { x: 0, y: 0, z: 0 },

  load: function(opts, quality) {
    this.lib = new bkcore.threejs.Loader(opts);

   
    var terrainGeo = new THREE.PlaneGeometry(10000, 10000, 128, 128);

    applyHeightmap(terrainGeo, 'textures/terrain/heightmap.png');
    terrainGeo.rotateX(-Math.PI / 2);
    var terrainMat = new THREE.MeshLambertMaterial({
      map: new THREE.TextureLoader().load('textures/terrain/grass.jpg')
    });
    var terrain = new THREE.Mesh(terrainGeo, terrainMat);
    opts.scene.add(terrain);


    var roadGeo = new THREE.PlaneGeometry(20, 2000);
    roadGeo.rotateX(-Math.PI / 2);
    var roadMat = new THREE.MeshLambertMaterial({
      map: new THREE.TextureLoader().load('textures/terrain/road.jpg')
    });
    var road = new THREE.Mesh(roadGeo, roadMat);
    road.position.set(0, 0.1, 0);
    opts.scene.add(road);

  
    spawnTrees(opts.scene, 200);

 
    var sky = new THREE.CubeTextureLoader()
      .setPath('textures/skybox/day/')
      .load(['px.jpg','nx.jpg','py.jpg','ny.jpg','pz.jpg','nz.jpg']);
    opts.scene.background = sky;
  }
};

function spawnTrees(scene, count) {
  var geo = new THREE.ConeGeometry(3, 10, 6);
  var mat = new THREE.MeshLambertMaterial({ color: 0x2d6a2d });
  for (var i = 0; i < count; i++) {
    var tree = new THREE.Mesh(geo, mat);
    tree.position.set(
      (Math.random() - 0.5) * 9000,
      5,
      (Math.random() - 0.5) * 9000
    );
    scene.add(tree);
  }
}
