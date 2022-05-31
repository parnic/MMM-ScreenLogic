var NodeHelper = require('node_helper');

module.exports = NodeHelper.create({
    setCircuit: function(circuitState) {
        setCircuitState(circuitState, (poolStatus) => {
            this.sendSocketNotification('SCREENLOGIC_CIRCUIT_DONE', {circuitState: circuitState, status: poolStatus});
        });
    },

    setHeatpoint: function(heatpoint) {
        setHeatpointState(heatpoint, (poolStatus) => {
            this.sendSocketNotification('SCREENLOGIC_HEATPOINT_DONE', {heatpoint: heatpoint, status: poolStatus});
        });
    },

    setHeatstate: function(heatstate) {
        setHeatstateState(heatstate, (poolStatus) => {
            this.sendSocketNotification('SCREENLOGIC_HEATSTATE_DONE', {heatstate: heatstate, status: poolStatus});
        });
    },

    setLightcmd: function(lightCmd) {
        setLights(lightCmd, (poolStatus) => {
            this.sendSocketNotification('SCREENLOGIC_LIGHTCMD_DONE', {lightCmd: lightCmd, status: poolStatus});
        });
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === 'SCREENLOGIC_CONFIG') {
            if (!this.config) {
                this.config = payload;
                connect((status) => { this.sendSocketNotification('SCREENLOGIC_RESULT', status); });
            } else if (poolData.status) {
                this.sendSocketNotification('SCREENLOGIC_RESULT', poolData);
            }
            // if we don't have a status yet, assume the initial connection is still in progress and this socket notification will be delivered when setup is done
        }
        if (notification === 'SCREENLOGIC_CIRCUIT') {
            this.setCircuit(payload);
        }
        if (notification === 'SCREENLOGIC_HEATPOINT') {
            this.setHeatpoint(payload);
        }
        if (notification === 'SCREENLOGIC_HEATSTATE') {
            this.setHeatstate(payload);
        }
        if (notification === 'SCREENLOGIC_LIGHTCMD') {
            this.setLightcmd(payload);
        }
    }
});

const ScreenLogic = require('node-screenlogic');
const Log = require('logger');
const reconnectDelayMs = 10 * 1000;
const unitFinderTimeoutMs = 5 * 1000;
var foundUnit;
var poolData = {};
var refreshTimer;
var unitFinderRetry;
var unitReconnectTimer;

function connect(cb) {
    if (!foundUnit && typeof config !== 'undefined' && config.serverAddress && config.serverPort) {
        Log.info(`[MMM-ScreenLogic] connecting directly to configured unit at ${config.serverAddress}:${config.serverPort}`);
        foundUnit = new ScreenLogic.UnitConnection(config.serverPort, config.serverAddress);
    }

    if (foundUnit) {
        setupUnit(cb);
    } else {
        findServer(cb);
    }
}

function findServer(cb) {
    Log.info('[MMM-ScreenLogic] starting search for local units');
    var finder = new ScreenLogic.FindUnits();
    finder.on('serverFound', (server) => {
        finder.close();
        Log.info(`[MMM-ScreenLogic] local unit found at ${server.address}:${server.port}`);

        foundUnit = new ScreenLogic.UnitConnection(server);
        setupUnit(cb);

        clearInterval(unitFinderRetry);
        unitFinderRetry = null;
    }).on('error', (e) => {
        Log.error(`[MMM-ScreenLogic] error trying to find a server. scheduling a retry in ${reconnectDelayMs / 1000} seconds`);
        Log.error(e);
        resetFoundUnit();
        setTimeout(() => { findServer(cb); }, reconnectDelayMs);
    });

    finder.search();
    unitFinderRetry = setInterval(() => {
        Log.info(`[MMM-SceenLogic] didn't find any units within ${unitFinderTimeoutMs / 1000} seconds, trying again...`);
        finder.search();
    }, unitFinderTimeoutMs);
}

function resetFoundUnit() {
    foundUnit = null;
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
    if (unitFinderRetry) {
        clearInterval(unitFinderRetry);
        unitFinderRetry = null;
    }
    if (unitReconnectTimer) {
        clearTimeout(unitReconnectTimer);
        unitReconnectTimer = null;
    }
}

function setupUnit(cb) {
    Log.info('[MMM-ScreenLogic] initial connection to unit...');

    foundUnit.on('error', (e) => {
        Log.error(`[MMM-ScreenLogic] error in unit connection. restarting the connection process in ${reconnectDelayMs / 1000} seconds`);
        Log.error(e);

        resetFoundUnit();
        unitReconnectTimer = setTimeout(() => { connect(cb); }, reconnectDelayMs);
    }).on('close', () => {
        Log.error(`[MMM-ScreenLogic] unit connection closed unexpectedly. restarting the connection process in ${reconnectDelayMs / 1000} seconds`);

        resetFoundUnit();
        unitReconnectTimer = setTimeout(() => { connect(cb); }, reconnectDelayMs);
    }).once('loggedIn', () => {
        Log.info('[MMM-ScreenLogic] logged into unit. getting basic configuration...');
        foundUnit.getControllerConfig();
    }).once('controllerConfig', (config) => {
        Log.info('[MMM-ScreenLogic] configuration received. adding client...');
        poolData.controllerConfig = config;
        poolData.degStr = config.degC ? 'C' : 'F';
        foundUnit.addClient(1234);
    }).once('addClient', () => {
        Log.info('[MMM-ScreenLogic] client added successfully and listening for changes');
        foundUnit.getPoolStatus();
        // connection seems to time out every 10 minutes without some sort of request made
        refreshTimer = setInterval(() => { foundUnit.pingServer(); }, 1 * 60 * 1000);
    }).on('poolStatus', (status) => {
        Log.info('[MMM-ScreenLogic] received pool status update');
        poolData.status = status;
        cb(poolData);
    });

    foundUnit.connect();
}

function setCircuitState(circuitState, cb) {
    if (!foundUnit) {
        cb();
        return;
    }

    Log.info(`[MMM-ScreenLogic] setting circuit ${circuitState.id} to ${circuitState.state}`);
    foundUnit.setCircuitState(0, circuitState.id, circuitState.state);
    foundUnit.getPoolStatus();
}

function setHeatpointState(heatpoint, cb) {
    if (!foundUnit) {
        cb();
        return;
    }

    Log.info(`[MMM-ScreenLogic] setting heatpoint for body ${heatpoint.body} to ${heatpoint.temperature} deg`);
    foundUnit.setSetPoint(0, heatpoint.body, heatpoint.temperature);
    foundUnit.getPoolStatus();
}

function setHeatstateState(heatstate, cb) {
    if (!foundUnit) {
        cb();
        return;
    }

    Log.info(`[MMM-ScreenLogic] setting heat state for body ${heatstate.body} to ${heatstate.state}`);
    foundUnit.setHeatMode(0, heatstate.body, heatstate.state);
    foundUnit.getPoolStatus();
}

function setLights(lightCmd, cb) {
    if (!foundUnit) {
        cb();
        return;
    }

    Log.info(`[MMM-ScreenLogic] sending light command ${lightCmd}`);
    foundUnit.sendLightCommand(0, lightCmd);
    foundUnit.getPoolStatus();
}
