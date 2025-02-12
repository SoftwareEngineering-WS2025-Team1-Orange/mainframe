const JSBigInt = require('./biginteger.js');

var config = {
    //apiUrl: "https://api.mymonero.com:8443/",
    coinUnitPlaces: 12,
    txMinConfirms: 10,
    coinSymbol: 'XMR',
    openAliasPrefix: "xmr",
    coinName: 'Monero',
    coinUriPrefix: 'monero:',
    addressPrefix: 18,
    integratedAddressPrefix: 19,
    feePerKB: new JSBigInt('10000000000'),
    dustThreshold: new JSBigInt('1000000'),
    txChargeRatio: 0.5,
    defaultMixin: 3,
    //txChargeAddress: '49VNLa9K5ecJo13bwKYt5HCmA8GkgLwpyFjgGKG6qmp8dqoXww8TKPU2PJaLfAAtoZGgtHfJ1nYY8G2YaewycB4f72yFT6u',
    idleTimeout: 10,
    idleWarningDuration: 20,
    maxBlockNumber: 500000000,
    avgBlockTime: 60,
    debugMode: false
};

module.exports = config;