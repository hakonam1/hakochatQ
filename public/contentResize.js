document.addEventListener('DOMContentLoaded', function() {
  var splitter = document.getElementById('splitter2');
  var firstContainer = document.querySelector('.first-container');
  var secondContainer = document.querySelector('.second-container');
  var isDragging = false;

  // ドラッグ開始時のイベントリスナー
  splitter.addEventListener('mousedown', function(e) {
    isDragging = true;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    e.preventDefault();
  });

  // マウス移動時のイベントリスナー
  function onMouseMove(e) {
    if (!isDragging) {
      return;
    }
    var splitterPosition = e.clientY;
    var firstContainerHeight = splitterPosition - firstContainer.offsetTop;
    var secondContainerHeight = window.innerHeight - splitterPosition;
    firstContainer.style.height = firstContainerHeight + 'px';
    secondContainer.style.height = secondContainerHeight + 'px';
  }

  // ドラッグ終了時のイベントリスナー
  function onMouseUp() {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }
});
