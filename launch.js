(function() {
  var $, init, hasWebGL;

  $ = function(_) { return document.getElementById(_); };

  init = function(controlType, quality, hud, godmode) {
    var hexGL, progressbar;
    hexGL = new bkcore.hexgl.HexGL({
      document: document,
      width: window.innerWidth,
      height: window.innerHeight,
      container: $('main'),
      overlay: $('overlay'),
      gameover: $('step-5'),
      quality: quality,
      difficulty: 0,
      hud: hud === 1,
      controlType: controlType,
      godmode: godmode,
      track: 'Cityscape'
    });
    window.hexGL = hexGL;
    progressbar = $('progressbar');
    return hexGL.load({
      onLoad: function() {
        hexGL.init();
        $('step-3').style.display = 'none';
        $('step-4').style.display = 'block';
        return hexGL.start();
      },
      onError: function(s) { return console.error("Error loading " + s + "."); },
      onProgress: function(p, t, n) {
        return progressbar.style.width = "" + (p.loaded / p.total * 100) + "%";
      }
    });
  };

  hasWebGL = function() {
    var canvas, gl = null;
    canvas = document.createElement('canvas');
    try { gl = canvas.getContext("webgl"); } catch(e) {}
    if (!gl) { try { gl = canvas.getContext("experimental-webgl"); } catch(e) {} }
    return gl != null;
  };

  var defaultControls = (('ontouchstart' in window) || navigator.maxTouchPoints > 0) ? 1 : 0;

  if (!hasWebGL()) {
    document.body.innerHTML = '<div style="color:#fff;font-size:24px;text-align:center;margin-top:40vh">WebGL not supported.<br><a style="color:#0af" href="http://get.webgl.org/">Get WebGL</a></div>';
  } else {
    $('step-1').style.display = 'none';
    $('step-3').style.display = 'block';
    init(defaultControls, 3, 1, 0);
  }

  $('step-5').onclick = function() { window.location.reload(); };

}).call(this);
