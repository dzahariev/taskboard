sap.ui.define([
	"sap/ui/core/library",
	"sap/ui/core/UIComponent",
	"./model/models",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/ui/Device",
	"sap/ui/model/resource/ResourceModel",
	"sap/base/Log"
], function(library, UIComponent, models, JSONModel, History, Device, ResourceModel, Log) {
	"use strict";

	const TOKEN_MIN_VALIDITY_SECONDS = 30;
	const KEYCLOAK_JS_URL = "/resources/libs/keycloak-js/lib/keycloak.js";

	return UIComponent.extend("com.zahariev.taskboard.Component", {
		metadata: {
			manifest: "json",
			interfaces: [library.IAsyncContentCreation]
		},

		init: function () {
			// define auth model
			this.authModel = new JSONModel({
				keycloak: null,
				username: "Unknown",
			})
			this.authModel.setSizeLimit(Number.MAX_VALUE);
			this.setModel(this.authModel, "authModel");

			// Must start before the parent init, which calls createContent and waits for it
			this._authenticated = this._initKeycloak();

			// call the init function of the parent
			UIComponent.prototype.init.apply(this, arguments);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			// create the views based on the url/hash, once the user is authenticated and the root view exists
			this.rootControlLoaded().then(function () {
				this.getRouter().initialize();
			}.bind(this)).catch(function (error) {
				Log.error("Application startup failed", error);
			});
		},

		// Views must not be created before Keycloak has processed the login callback,
		// otherwise routing can overwrite the callback URL fragment and cause a login redirect loop
		createContent: async function () {
			const args = arguments;
			await this._authenticated;
			// After the await, the owner context set by UIComponent#init is gone and has to be restored
			return this.runAsOwner(function () {
				return UIComponent.prototype.createContent.apply(this, args);
			}.bind(this));
		},

		_initKeycloak: async function () {
			// index.html exposes keycloak-js from a module script that may not have run yet
			const Keycloak = window.Keycloak || (await import(KEYCLOAK_JS_URL)).default;
			const keycloak = new Keycloak('/keycloak-cfg/keycloak.json');
			const authenticated = await keycloak.init({ onLoad: 'login-required', checkLoginIframe: false });
			if (!authenticated) {
				keycloak.logout();
				throw new Error("User is not authenticated");
			}
			this.authModel.setProperty("/keycloak", keycloak);
			this.authModel.setProperty("/username", keycloak.tokenParsed?.preferred_username);
		},

		getToken: async function (forceRefresh) {
			const authModel = this.getModel("authModel");
			const keycloak = authModel.getProperty("/keycloak");
			try {
				// Refreshes only when the token expires within the given seconds; -1 forces a refresh
				await keycloak.updateToken(forceRefresh ? -1 : TOKEN_MIN_VALIDITY_SECONDS);
			} catch (error) {
				// Refresh token is expired or the SSO session has ended
				keycloak.login();
				throw new Error("Session expired, redirecting to login");
			}
			authModel.setProperty("/username", keycloak.tokenParsed?.preferred_username);
			return keycloak.token;
		},

		apiRequest: async function (method, url, body) {
			const send = async (forceRefresh) => {
				const token = await this.getToken(forceRefresh);
				const options = {
					method: method,
					headers: { "Authorization": `Bearer ${token}` }
				};
				if (body !== undefined) {
					options.headers["Content-Type"] = "application/json";
					options.body = JSON.stringify(body);
				}
				return fetch(url, options);
			};

			let response = await send(false);
			if (response.status === 401) {
				// Token may have expired in flight or been revoked - retry once with a fresh one
				response = await send(true);
			}

			const text = await response.text();
			let data = null;
			if (text) {
				try {
					data = JSON.parse(text);
				} catch (error) {
					data = text;
				}
			}
			if (!response.ok) {
				throw new Error(data?.error || `${method} ${url} failed with status ${response.status}`);
			}
			return data;
		},

		myNavBack: function () {
			var oHistory = History.getInstance();
			var oPrevHash = oHistory.getPreviousHash();
			if (oPrevHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("masterSettings", {}, true);
			}
		},

		getContentDensityClass: function () {
			if (!this._sContentDensityClass) {
				if (!Device.support.touch){
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		}
	});
});