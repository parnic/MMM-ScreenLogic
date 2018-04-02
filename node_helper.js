var NodeHelper = require('node_helper');

module.exports = NodeHelper.create({
	start: function() {
		var self = this;
		setInterval(function() {
			self.doUpdate()
		}, 30 * 60 * 1000);
	},

	doUpdate: function() {
		var self = this;
		getPoolData(this.config, function(poolData) {
			self.sendSocketNotification('SCREENLOGIC_RESULT', poolData);
		});
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === 'SCREENLOGIC_CONFIG') {
			this.config = payload;
		}
		if (notification === 'SCREENLOGIC_UPDATE') {
			this.doUpdate();
		}
	}
});

const ScreenLogic = require('node-screenlogic');

function getPoolData(config, cb) {
	if (typeof config === 'undefined' || !config.serverAddress || !config.serverPort) {
		findServer(cb);
	} else {
		populateSystemData(new ScreenLogic.UnitConnection(config.serverPort, config.serverAddress), cb);
	}
}

function findServer(cb) {
	var finder = new ScreenLogic.FindUnits();
	finder.on('serverFound', function(server) {
		finder.close();
		populateSystemData(new ScreenLogic.UnitConnection(server), cb);
	});

	finder.search();
}

function populateSystemData(unit, cb) {
	var poolData = {};

	unit.on('loggedIn', function() {
		unit.getControllerConfig();
	}).on('controllerConfig', function(config) {
		poolData.degStr = config.degC ? 'C' : 'F';
		unit.getPoolStatus();
	}).on('poolStatus', function(status) {
		poolData.status = status;

		unit.close();
		cb(poolData);
	});

	unit.connect();
}
