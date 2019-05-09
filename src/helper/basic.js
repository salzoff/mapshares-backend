import _partialRight from 'lodash/partialRight';

const extractValuesByFunction = (baseObj, fn) => {
    return Object.keys(baseObj).reduce((result, key) => {
        if (fn(baseObj[key])) {
            result[key] = baseObj[key];
        }
        return result;
    }, {});
};

const extractPlainValuesAndArrays = _partialRight(extractValuesByFunction, value => {
    return (['string', 'boolean', 'number'].includes(typeof value))
        || (value instanceof Array && value.every(entry => ['string', 'boolean', 'number'].includes(typeof entry)));
});

const calculateApproximateNumber = (value, step) => {
    return (Math.floor(value / step) + 1) * step;
}

export {
    calculateApproximateNumber,
    extractPlainValuesAndArrays
};
