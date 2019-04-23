const geoDistance = (point1, point2) => {
    console.log(point1);
    console.log(point2);
    const R = 6371e3; // metres
    const φ1 = toRadians(point1.lat);
    const φ2 = toRadians(point2.lat);
    const Δφ = toRadians(point2.lat - point1.lat);
    const Δλ = toRadians(point2.lng - point1.lng);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c;
    return d;
};

const toRadians = value => {
    /** Converts numeric degrees to radians */
    return value * (Math.PI / 180);
};

const toDegrees = value => {
    return value / (Math.PI / 180);
};

export {
    geoDistance
};