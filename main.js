//based on: https://svn.fhem.de/fhem/trunk/fhem/FHEM/59_PROPLANTA.pm
//Hypnos3:	https://github.com/ioBroker/AdapterRequests/issues/87

"use strict";

/*
 * Created with @iobroker/create-adapter v1.32.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const axios = require('axios');
const adapterName = require('./package.json').name.split('.').pop();

// Load your modules here, e.g.:
// const fs = require("fs");

class Proplanta extends utils.Adapter {

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "proplanta",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		this.log.info("config city: " + this.config.city);
		this.log.info("config countrycode: " + this.config.countrycode);

		// Change Umlaute from UTF8 in Percent-encode, also space to plus symbol
		const cityUrlEncoded = this.config.city.replace("Ä", "%C4").replace("Ö", "%D6").replace("Ü", "%DC").replace("ß", "%DF").replace("ä", "%E4").replace("ö", "%F6").replace("ü", "%FC").replace(" ", "+");
		this.log.info("cityUrlEncoded: " + cityUrlEncoded);

		// Generate URL variables
		const baseUrl = "https://www.proplanta.de/";
		const requestString = "";
		if (this.config.countrycode == "de" || this.config.countrycode == "") {
			requestString = "/Wetter/profi-wetter.php?SITEID=60&PLZ=" + cityUrlEncoded + "&STADT=" + cityUrlEncoded + "&WETTERaufrufen=stadt&Wtp=&SUCHE=Wetter&wT=";
		}
		else if (this.config.countrycode == "at") {
			requestString = "/Wetter-Oesterreich/profi-wetter-at.php?SITEID=60&PLZ=" + cityUrlEncoded + "&STADT=" + cityUrlEncoded + "&WETTERaufrufen=stadt&Wtp=&SUCHE=Wetter-Oesterreich&wT=";
		}
		else if (this.config.countrycode == "ch") {
			requestString = "/Wetter-Schweiz/profi-wetter-ch.php?SITEID=60&PLZ=" + cityUrlEncoded + "&STADT=" + cityUrlEncoded + "&WETTERaufrufen=stadt&Wtp=&SUCHE=Wetter-Schweiz&wT=";
		}
		else if (this.config.countrycode == "fr") {
			requestString = "/Wetter-Frankreich/profi-wetter-fr.php?SITEID=60&PLZ=" + cityUrlEncoded + "&STADT=" + cityUrlEncoded + "&WETTERaufrufen=stadt&Wtp=&SUCHE=Wetter-Frankreich&wT=";
		}
		else if (this.config.countrycode == "it") {
			requestString = "/Wetter-Italien/profi-wetter-it.php?SITEID=60&PLZ=" + cityUrlEncoded + "&STADT=" + cityUrlEncoded + "&WETTERaufrufen=stadt&Wtp=&SUCHE=Wetter-Italien&wT=";
		}

		// Start webrequest
		axios({
			method: 'get',
			baseURL: baseUrl,
			url: requestString,
			timeout: 10000,
			responseType: 'document'
		}).then(
			async (response) => {
				const content = response.data;

				this.log.info('webrequest done');
				this.log.info('received data (' + response.status + '): ' + content);

				/*await this.setObjectNotExistsAsync(path + 'responseCode', {
					type: 'state',
					common: {
						name: 'responseCode',
						type: 'number',
						role: 'value',
						read: true,
						write: false
					},
					native: {}
				});
				this.setState(path + 'responseCode', {val: response.status, ack: true});

				if (content && Object.prototype.hasOwnProperty.call(content, 'sensordatavalues')) {
					for (const key in content.sensordatavalues) {
						const obj = content.sensordatavalues[key];

						let unit = null;
						let role = 'value';

						if (obj.value_type.indexOf('SDS_') == 0) {
							unit = 'µg/m³';
							role = 'value.ppm';
						} else if (obj.value_type.indexOf('temperature') >= 0) {
							unit = '°C';
							role = 'value.temperature';
						} else if (obj.value_type.indexOf('humidity') >= 0) {
							unit = '%';
							role = 'value.humidity';
						} else if (obj.value_type.indexOf('pressure') >= 0) {
							unit = 'Pa';
							role = 'value.pressure';
						} else if (obj.value_type.indexOf('noise') >= 0) {
							unit = 'dB(A)';
							role = 'value';
						} else if (Object.prototype.hasOwnProperty.call(unitList, obj.value_type)) {
							unit = unitList[obj.value_type];
							role = roleList[obj.value_type];
						}

						await this.setObjectNotExistsAsync(path + obj.value_type, {
							type: 'state',
							common: {
								name: obj.value_type,
								type: 'number',
								role: role,
								unit: unit,
								read: true,
								write: false
							},
							native: {}
						});
						this.setState(path + obj.value_type, {val: parseFloat(obj.value), ack: true});
					}
				} else {
					this.log.warn('Response has no valid content. Check hostname/IP address and try again.');
				}*/

			}
		).catch(
			(error) => {
				if (error.response) {
					// The request was made and the server responded with a status code

					this.log.warn('received error ' + error.response.status + ' response from local sensor ' + sensorIdentifier + ' with content: ' + JSON.stringify(error.response.data));
				} else if (error.request) {
					// The request was made but no response was received
					// `error.request` is an instance of XMLHttpRequest in the browser and an instance of
					// http.ClientRequest in node.js<div></div>
					this.log.error(error.message);
				} else {
					// Something happened in setting up the request that triggered an Error
					this.log.error(error.message);
				}
			}
		);

		// Stop adapter because this is a cronjob and we need to kill the instance when everything is done.
		this.killTimeout = setTimeout(this.stop.bind(this), 15000);
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			// ...
			// clearInterval(interval1);

			callback();
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}
}

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Proplanta(options);
} else {
	// otherwise start the instance directly
	new Proplanta();
}