// Haversine formula to calculate the distance between two GPS coordinates in meters
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius of Earth in meters
  const toRad = (value) => (value * Math.PI) / 180;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10; // Rounded to 1 decimal place
}

module.exports = {
  calculateDistanceMeters
};
