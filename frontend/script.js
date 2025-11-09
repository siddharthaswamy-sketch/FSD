
//currently not used
// Donut Chart 
const ctx = document.getElementById('fakeFollowersChart');
new Chart(ctx, {
  type: 'doughnut',
  data: {
    labels: ['Fake Followers', 'Real Followers'],
    datasets: [{
      data: [23, 77],
      backgroundColor: ['#8b5cf6', '#dcd7fe'],
      borderWidth: 0
    }]
  },
  options: {
    plugins: {
      legend: { position: 'bottom' }
    }
  }
});
