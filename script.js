// FitFlow Test JavaScript File
document.getElementById('test-btn').addEventListener('click', function() {
    const output = document.getElementById('output');
    const timestamp = new Date().toLocaleTimeString();
    output.textContent = `JavaScript is fully operational! Click recorded at ${timestamp}.`;
});
