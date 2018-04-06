poolData = {};

Module.register("MMM-ScreenLogic",{
	defaults: {
		showPoolTemp: true,
		showSpaTemp: true,
		showPH: true,
		showOrp: true,
		showSaltLevel: true,
		showSaturation: true,
		colored: true,
		coldTemp: 84,
		hotTemp: 90,
		columns: 3,
		contentClass: "light"
	},

	start: function() {
		this.sendSocketNotification('SCREENLOGIC_CONFIG', this.config);
		this.sendSocketNotification('SCREENLOGIC_UPDATE');
	},

	getStyles: function() {
		return ["screenlogic.css"];
	},

	getDom: function() {
		if (!poolData.status) {
			var wrapper = document.createElement("div");
			wrapper.innerHTML = 'Loading...';
			wrapper.className += "dimmed light small";

			return wrapper;
		} else {
			var table = document.createElement('table');
			table.className = "small";
			if (this.config.colored) {
				table.className += " colored";
			}

			var contents = [];

			if (this.config.showPoolTemp) {
				var className = "";
				if (poolData.status.currentTemp[0] <= this.config.coldTemp) {
					className += " cold-temp";
				} else if (poolData.status.currentTemp[0] >= this.config.hotTemp) {
					className += " hot-temp";
				}

				contents.push({
					header: "Pool temp",
					data: poolData.status.currentTemp[0] + "&deg;" + (!isPoolActive(poolData.status) ? " (last)" : ""),
					class: this.config.contentClass + className
				});
			}
			if (this.config.showSpaTemp) {
				var className = "";
				if (poolData.status.currentTemp[1] <= this.config.coldTemp) {
					className = " cold-temp";
				} else if (poolData.status.currentTemp[1] >= this.config.hotTemp) {
					className = " hot-temp";
				}

				contents.push({
					header: "Spa temp",
					data: poolData.status.currentTemp[1] + "&deg;" + (!isSpaActive(poolData.status) ? " (last)" : ""),
					class: this.config.contentClass + className
				});
			}
			if (this.config.showPH) {
				contents.push({
					header: "pH",
					data: poolData.status.pH,
					class: this.config.contentClass
				});
			}
			if (this.config.showOrp) {
				contents.push({
					header: "ORP",
					data: poolData.status.orp,
					class: this.config.contentClass
				});
			}
			if (this.config.showSaltLevel) {
				contents.push({
					header: "Salt PPM",
					data: poolData.status.saltPPM,
					class: this.config.contentClass
				});
			}
			if (this.config.showSaturation) {
				contents.push({
					header: "Saturation",
					data: poolData.status.saturation,
					class: this.config.contentClass
				});
			}

			var headerRow = null;
			var contentRow = null;

			var cols = -1;
			for (var item in contents) {
				cols++;
				if (cols % this.config.columns === 0) {
					var headerRow = document.createElement('tr');
					var contentRow = document.createElement('tr');
					table.appendChild(headerRow);
					table.appendChild(contentRow);
				}

				var headerCell = document.createElement('th');
				headerCell.innerHTML = contents[item].header;
				headerRow.appendChild(headerCell);

				var contentCell = document.createElement('td');
				contentCell.innerHTML = contents[item].data;
				contentCell.className = contents[item].class;
				contentRow.appendChild(contentCell);
			}

			return table;
		}
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === 'SCREENLOGIC_RESULT') {
			poolData = payload;
			this.updateDom();
		}
	}
});

const SPA_CIRCUIT_ID = 500;
const POOL_CIRCUIT_ID = 505;

function isPoolActive(status) {
	for (var i = 0; i < status.circuitArray.length; i++) {
		if (status.circuitArray[i].id === POOL_CIRCUIT_ID) {
			return status.circuitArray[i].state === 1;
		}
	}
}

function hasSpa(status) {
	for (var i = 0; i < status.circuitArray.length; i++) {
		if (status.circuitArray[i].id === SPA_CIRCUIT_ID) {
			return true;
		}
	}

	return false;
}

function isSpaActive(status) {
	for (var i = 0; i < status.circuitArray.length; i++) {
		if (status.circuitArray[i].id === SPA_CIRCUIT_ID) {
			return status.circuitArray[i].state === 1;
		}
	}
}
