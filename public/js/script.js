
async function search() {
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;
    
    const res = await fetch('/api/search?from=' + from + '&to=' + to);
    const data = await res.json();
    
    let html = '<h2>Results (' + data.count + ' buses)</h2>';
    data.buses.forEach(bus => {
        html += '<div class="bus-card">' +
                '<h3>' + bus.number + '</h3>' +
                '<p>Route: ' + bus.route + '</p>' +
                '<p>Status: ' + bus.status + '</p>' +
                '</div>';
    });
    
    document.getElementById('results').innerHTML = html;
}
