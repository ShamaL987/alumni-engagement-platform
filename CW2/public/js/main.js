document.addEventListener('click', (event) => {
  const dangerButton = event.target.closest('button.danger');
  if (dangerButton && !confirm('Are you sure?')) {
    event.preventDefault();
  }
});
