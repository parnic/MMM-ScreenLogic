# MMM-ScreenLogic
A <a href="https://github.com/MichMich/MagicMirror">MagicMirror²</a> module used to connect to a local Pentair ScreenLogic pool controller system. Tested with MagicMirror² v2.2.2, v2.3.1 servers, Chrome 65 on Windows 10 and Midori 0.4.3 on a Raspberry Pi Zero W with Raspbian Jessie. Tested with a Pentair ScreenLogic system running version 5.2 Build 736.0 Rel.

## Installation
1. Navigate into your MagicMirror's `modules` folder and execute `git clone https://github.com/parnic/MMM-ScreenLogic.git`.
2. `cd MMM-ScreenLogic`
3. Execute `npm install` to install the node dependencies.
4. Add the module inside `config.js` placing it where you prefer.

## Config
|Option|Type|Description|Default|
|---|---|---|---|
|`serverAddress`|String|The IPv4 address of a ScreenLogic unit to connect to. If not set, the system will search for a unit to connect to. If set, `serverPort` must also be set.| |
|`serverPort`|Integer|The port of a ScreenLogic unit to connect to (usually 80). If not set, the system will search for a unit to connect to. If set, `serverAddress` must also be set.| |
|`showControls`|Boolean|Whether you'd like to show buttons for controlling pool equipment. Must also setup the `controls` array.|`false`|
|`showPoolTemp`|Boolean|Whether you'd like to show pool temperature or not.|`true`|
|`showSpaTemp`|Boolean|Whether you'd like to show spa temperature or not.|`true`|
|`showPH`|Boolean|Whether you'd like to show pH level or not.|`true`|
|`showOrp`|Boolean|Whether you'd like to show ORP level or not.|`true`|
|`showSaltLevel`|Boolean|Whether you'd like to show salt level (in PPM) or not.|`true`|
|`showSaturation`|Boolean|Whether you'd like to show saturation/balance or not.|`true`|
|`showFreezeMode`|Boolean|Whether you'd like to show a banner when the pool is in freeze mode or not. [added in v1.0.1]|`true`|
|`colored`|Boolean|Whether you'd like colored output or not.|`true`|
|`coldTemp`|Integer|Show the temperature colored blue if it's at or below this level for pool/spa (requires option `colored`). This is in whatever scale your system is set to (Fahrenheit/Celsius).|`84`|
|`controls`|Array|List of controls to show buttons for. Must also set `showControls` to `true`.<br><br>Each entry in this list is an object with a `type` property and a `name` to display.<br><br>Valid `type`s:<br>`circuit` - toggle a circuit on or off. Must also have an `id` property defining the circuit ID to set (see [node-screenlogic](https://github.com/parnic/node-screenlogic) documentation for circuit IDs). `name` is optional; if not specified, the name of the equipment in the ScreenLogic system will be used.<br>`heatmode` - enable or disable the heater for the pool or spa. Must also have a `body` property that defines which body to toggle the heater for (`0` is the pool, `1` is the spa)|`[]`|
|`hotTemp`|Integer|Show the temperature colored red if it's at or above this level for pool/spa (requires option `colored`). This is in whatever scale your system is set to (Fahrenheit/Celsius).|`90`|
|`columns`|Integer|How many columns to use to display the data before starting a new row.|`3`|
|`contentClass`|String|The CSS class used to display content values (beneath the header).|`"light"`|
|`updateInterval`|Integer|How frequently, in milliseconds, to update pool data.|`30 * 60 * 1000` (every 30 minutes)|

Here is an example of an entry in config.js
```
{
	module: 'MMM-ScreenLogic',
	header: 'Pool info',
	position: 'top_left',
	config: {
		showSpaTemp: false,
		columns: 2,
		contentClass: 'thin',
		showControls: true,
		controls: [
			{type: 'circuit', id: 500},
			{type: 'circuit', id: 505, name: 'Pool'},
			{type: 'heatmode', body: 0, name: 'Pool heater'}
		]
	}
},
```

## Screenshot
#### With color
![Screenshot with color](/screenshot.png?raw=true "colored: true")

## Notes
Pull requests are very welcome! If you'd like to see any additional functionality, don't hesitate to let me know.

This module only works with ScreenLogic controllers on the local network via either a UDP broadcast on 255.255.255.255 or a direct connection if you've specified an address and port in the configuration.

The data is updated every 30 minutes by default (configurable with `updateInterval`).

When toggling a circuit or changing heat mode, sometimes other circuits are affected. For example, some pools share the same pump for the pool and spa, so when the pool is toggled on the spa must be toggled off. Unfortunately the ScreenLogic system doesn't update its internal status at any predictable rate, so the data on the screen can be wrong immediately after toggling a circuit until the next periodic update runs. If you know of a reliable way around this, please open a pull request!

## Libraries
This uses a Node.JS library I created for interfacing with ScreenLogic controllers over the network: [node-screenlogic](https://github.com/parnic/node-screenlogic), so feel free to check that out for more information.
