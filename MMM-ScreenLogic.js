let poolData = {};
let moduleObj;

Module.register('MMM-ScreenLogic',{
    defaults: {
        showPoolTemp: true,
        showSpaTemp: true,
        showPH: true,
        showOrp: true,
        showSaltLevel: true,
        showSaturation: true,
        showFreezeMode: true,
        showControls: false,
        controls: [],
        colored: true,
        coldTemp: 84,
        hotTemp: 90,
        columns: 3,
        contentClass: 'light',
        updateInterval: 30 * 60 * 1000
    },

    start: function() {
        // this isn't a great solution...is there a better one? needed to do stuff with buttons
        moduleObj = this;
        if (this.config.showControls && (!this.config.controls || this.config.controls.length === 0)) {
            Log.warn('Controls are enabled, but no controls are configured. See README for info on setting up controls.');
            this.config.showControls = false;
        }

        this.sendSocketNotification('SCREENLOGIC_CONFIG', this.config);
        this.sendSocketNotification('SCREENLOGIC_UPDATE');
    },

    getStyles: function() {
        return ['screenlogic.css'];
    },

    getDom: function() {
        if (!poolData.status) {
            let wrapper = document.createElement('div');
            wrapper.innerHTML = 'Loading...';
            wrapper.className += 'dimmed light small';

            return wrapper;
        } else {
            let table = document.createElement('table');
            table.className = 'small';
            if (this.config.colored) {
                table.className += ' colored';
            }

            let contents = [];

            if (this.config.showPoolTemp) {
                let className = '';
                if (poolData.status.currentTemp[0] <= this.config.coldTemp) {
                    className += ' cold-temp';
                } else if (poolData.status.currentTemp[0] >= this.config.hotTemp) {
                    className += ' hot-temp';
                }

                contents.push({
                    header: 'Pool temp',
                    data: poolData.status.currentTemp[0] + '&deg;' + (!isPoolActive(poolData.status) ? ' (last)' : ''),
                    class: this.config.contentClass + className
                });
            }
            if (this.config.showSpaTemp) {
                let className = '';
                if (poolData.status.currentTemp[1] <= this.config.coldTemp) {
                    className = ' cold-temp';
                } else if (poolData.status.currentTemp[1] >= this.config.hotTemp) {
                    className = ' hot-temp';
                }

                contents.push({
                    header: 'Spa temp',
                    data: poolData.status.currentTemp[1] + '&deg;' + (!isSpaActive(poolData.status) ? ' (last)' : ''),
                    class: this.config.contentClass + className
                });
            }
            if (this.config.showPH) {
                contents.push({
                    header: 'pH',
                    data: poolData.status.pH,
                    class: this.config.contentClass
                });
            }
            if (this.config.showOrp) {
                contents.push({
                    header: 'ORP',
                    data: poolData.status.orp,
                    class: this.config.contentClass
                });
            }
            if (this.config.showSaltLevel) {
                contents.push({
                    header: 'Salt PPM',
                    data: poolData.status.saltPPM,
                    class: this.config.contentClass
                });
            }
            if (this.config.showSaturation) {
                contents.push({
                    header: 'Saturation',
                    data: poolData.status.saturation,
                    class: this.config.contentClass
                });
            }
            if (this.config.showControls) {
                for (let control in this.config.controls) {
                    let controlObj = this.config.controls[control];

                    if (controlObj.type === 'circuit') {
                        let name = controlObj.name;
                        for (let circuit in poolData.controllerConfig.bodyArray) {
                            if (poolData.controllerConfig.bodyArray[circuit].circuitId === controlObj.id) {
                                if (!name) {
                                    name = poolData.controllerConfig.bodyArray[circuit].name;
                                }
                            }
                        }

                        let on = false;
                        for (let circuit in poolData.status.circuitArray) {
                            if (poolData.status.circuitArray[circuit].id === controlObj.id) {
                                on = poolData.status.circuitArray[circuit].state !== 0;
                            }
                        }

                        let cls = '';
                        if (this.config.colored) {
                            cls = on ? 'control-on' : 'control-off';
                        }

                        contents.push({
                            data: '<button id="sl-control-' + controlObj.id + '" class="control ' + cls + '" onclick="setCircuit(this)" data-circuit="' +
								controlObj.id + '" data-state="' + (on ? '1' : '0') + '"><div class="content">' +
								name + '</div></button>',
                            class: this.config.contentClass
                        });
                    } else if (controlObj.type === 'heatpoint') {
                        if (controlObj.body < 0 || controlObj.body > poolData.status.setPoint.length) {
                            Log.warn('Invalid body specified for heatpoint');
                            continue;
                        }

                        let temperature = poolData.status.setPoint[controlObj.body];

                        let dataHtml = '<div class="temperature-container">';
                        dataHtml += '<button id="sl-temp-up-'+controlObj.body+'" class="temperature control-off" onclick="setHeatpoint(this, 1)" data-body="'+controlObj.body+'" data-temperature="'+temperature+'"><div class="content">+</div></button>';
                        dataHtml += '<div class="temperature-label">'+controlObj.name+': '+temperature+'&deg;</div>';
                        dataHtml += '<button id="sl-temp-down-'+controlObj.body+'" class="temperature control-off" onclick="setHeatpoint(this, -1)" data-body="'+controlObj.body+'" data-temperature="'+temperature+'"><div class="content">-</div></button>';

                        contents.push({
                            data: dataHtml,
                            class: this.config.contentClass
                        });
                    } else if (controlObj.type === 'heatmode') {
                        if (controlObj.body < 0 || controlObj.body > poolData.status.heatMode.length) {
                            Log.warn('Invalid body specified for heatmode');
                            continue;
                        }

                        let on = poolData.status.heatMode[controlObj.body] !== 0;
                        let mode = typeof controlObj.heatMode === 'number' ? controlObj.heatMode : 3;

                        let cls = '';
                        if (this.config.colored) {
                            cls = on ? 'control-on' : 'control-off';
                        }

                        contents.push({
                            data: '<button id="sl-heat-' + controlObj.body + '" class="control ' + cls + '" onclick="setHeatmode(this)" data-body="' +
								controlObj.body + '" data-state="' + (on ? '1' : '0') + '" data-mode="' + mode.toString() + '"><div class="content">' +
								controlObj.name + '</div></button>',
                            class: this.config.contentClass
                        });
                    } else {
                        Log.warn('circuit with unknown type, unable to display:');
                        Log.warn(controlObj);
                    }
                }
            }

            let headerRow = null;
            let contentRow = null;

            if (this.config.showFreezeMode && poolData.status.freezeMode !== 0) {
                let row = document.createElement('tr');
                table.appendChild(row);
                row.className = 'cold-temp';
                let cell = document.createElement('th');
                row.appendChild(cell);
                cell.colSpan = this.config.columns;
                cell.innerHTML = '<center>FREEZE MODE</center>';
            }

            let cols = -1;
            for (let item in contents) {
                cols++;
                if (cols % this.config.columns === 0) {
                    headerRow = document.createElement('tr');
                    contentRow = document.createElement('tr');
                    table.appendChild(headerRow);
                    table.appendChild(contentRow);
                }

                if (contents[item].header) {
                    let headerCell = document.createElement('th');
                    headerCell.innerHTML = contents[item].header;
                    headerRow.appendChild(headerCell);
                }

                let contentCell = document.createElement('td');
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
        } else if (notification === 'SCREENLOGIC_CIRCUIT_DONE'
			|| notification === 'SCREENLOGIC_HEATSTATE_DONE'
			|| notification === 'SCREENLOGIC_HEATPOINT_DONE') {
            poolData.status = payload.status;
            this.updateDom();
        }
    },
});

const SPA_CIRCUIT_ID = 500;
const POOL_CIRCUIT_ID = 505;

function isPoolActive(status) {
    for (let i = 0; i < status.circuitArray.length; i++) {
        if (status.circuitArray[i].id === POOL_CIRCUIT_ID) {
            return status.circuitArray[i].state === 1;
        }
    }
}

function hasSpa(status) {
    for (let i = 0; i < status.circuitArray.length; i++) {
        if (status.circuitArray[i].id === SPA_CIRCUIT_ID) {
            return true;
        }
    }

    return false;
}

function isSpaActive(status) {
    for (let i = 0; i < status.circuitArray.length; i++) {
        if (status.circuitArray[i].id === SPA_CIRCUIT_ID) {
            return status.circuitArray[i].state === 1;
        }
    }
}

function setCircuit(e) {
    let circuitId = parseInt(e.dataset.circuit);
    let on = e.dataset.state !== '0';
    moduleObj.sendSocketNotification('SCREENLOGIC_CIRCUIT', {id: circuitId, state: on ? 0 : 1});
    e.classList.remove('control-on', 'control-off');
}

function setHeatmode(e) {
    let bodyId = parseInt(e.dataset.body);
    let on = e.dataset.state !== '0';
    let mode = e.dataset.mode;
    moduleObj.sendSocketNotification('SCREENLOGIC_HEATSTATE', {body: bodyId, state: on ? 0 : parseInt(mode)});
    e.classList.remove('control-on', 'control-off');
}

function setHeatpoint(e, tempChange) {
    let bodyId = parseInt(e.dataset.body);
    let temp = parseInt(e.dataset.temperature) + tempChange;
    moduleObj.sendSocketNotification('SCREENLOGIC_HEATPOINT', {body: bodyId, temperature: temp});
    e.classList.remove('control-on', 'control-off');
}
