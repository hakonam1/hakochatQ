document.addEventListener('DOMContentLoaded', function() {
  const menuIcon = document.getElementById('menuIcon');
  const threadListContainer = document.querySelector('.thread-list-container');

  menuIcon.addEventListener('click', function() {
    threadListContainer.classList.toggle('open-thread-list');
  });
});
