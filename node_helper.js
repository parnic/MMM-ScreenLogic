var NodeHelper = require('node_helper');

module.exports = NodeHelper.create({
	start: function() {
		this.setTimer(30 * 60 * 1000);
	},

	doUpdate: function() {
		var self = this;
		getPoolData(this.config, function(poolData) {
			self.sendSocketNotification('SCREENLOGIC_RESULT', poolData);
		});
	},

	setCircuit: function(circuitState) {
		var self = this;
		setCircuitState(circuitState, function(done) {
			self.sendSocketNotification('SCREENLOGIC_CIRCUIT_DONE', circuitState);
		});
	},

	setTimer: function(updateInterval) {
		var update = true;
		update = typeof this.updateInterval === 'undefined' || this.updateInterval != updateInterval;
		this.updateInterval = updateInterval;

		if (update) {
			if (typeof this.timer !== 'undefined') {
				clearInterval(this.timer);
			}

			var self = this;
			self.timer = setInterval(function() {
				self.doUpdate()
			}, self.updateInterval);
		}
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === 'SCREENLOGIC_CONFIG') {
			this.config = payload;
			this.setTimer(this.config.updateInterval);
		}
		if (notification === 'SCREENLOGIC_UPDATE') {
			this.doUpdate();
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
var foundUnit;

function getPoolData(config, cb) {
	if (!foundUnit && typeof config !== 'undefined' && config.serverAddress && config.serverPort) {
		foundUnit = new ScreenLogic.UnitConnection(config.serverPort, config.serverAddress);
	}

	if (foundUnit) {
		populateSystemData(cb);
	} else {
		findServer(cb);
	}
}

function findServer(cb) {
	var finder = new ScreenLogic.FindUnits();
	finder.on('serverFound', function(server) {
		finder.close();

		foundUnit = new ScreenLogic.UnitConnection(server);
		populateSystemData(cb);
	});

	finder.search();
}

function populateSystemData(cb) {
	var poolData = {};

	if (!foundUnit) {
		cb(poolData);
		return;
	}

	foundUnit.once('loggedIn', function() {
		foundUnit.getControllerConfig();
	}).once('controllerConfig', function(config) {
		poolData.controllerConfig = config;
		poolData.degStr = config.degC ? 'C' : 'F';
		foundUnit.getPoolStatus();
	}).once('poolStatus', function(status) {
		poolData.status = status;

		foundUnit.close();
		cb(poolData);
	});

	foundUnit.connect();
}

function setCircuitState(circuitState, cb) {
	if (!foundUnit) {
		cb();
		return;
	}

	foundUnit.once('loggedIn', function() {
		foundUnit.setCircuitState(0, circuitState.id, circuitState.state);
	}).once('circuitStateChanged', function() {
		foundUnit.close();
		cb(true);
	});

	foundUnit.connect();
}
