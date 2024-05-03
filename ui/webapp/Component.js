sap.ui.define([
	"sap/ui/core/library",
	"sap/ui/core/UIComponent",
	"./model/models",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/ui/Device",
	"sap/ui/model/resource/ResourceModel",
	'./libs/keycloak-js/dist/keycloak'
], function(library, UIComponent, models, JSONModel, History, Device) {
	"use strict";

	return UIComponent.extend("com.zahariev.taskboard.Component", {
		metadata: {
			manifest: "json",
			interfaces: [library.IAsyncContentCreation]
		},

		init: async function () {
			// call the init function of the parent
			UIComponent.prototype.init.apply(this, arguments);

			// define auth model and init keycloak
			this.authModel = new JSONModel({
				keycloak: null,
				username: "Unknown",
			})
			this.authModel.setSizeLimit(Number.MAX_VALUE);
			const keycloak = new Keycloak('/libs/keycloak-cfg/keycloak.json');
			const authenticated = await keycloak.init({ onLoad: 'login-required', checkLoginIframe: false })
			if(authenticated){
				this.authModel.setProperty("/keycloak", keycloak);
				this.authModel.setProperty("/username", keycloak.tokenParsed?.preferred_username);
			} else {
				keycloak.logout();
			}
			this.setModel(this.authModel, "authModel");
			
			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			// create the views based on the url/hash
			this.getRouter().initialize();
		},

		getToken: async function () {
			const authModel = this.getModel("authModel");
			const keycloak = authModel.getProperty("/keycloak");
			if(keycloak.isTokenExpired()){
				try {
					const tokenUpdated = await keycloak.updateToken(1800)
					if(tokenUpdated) {
						authModel.setProperty("/username", keycloak.tokenParsed?.preferred_username);
					} else {
						keycloak.logout();
					}
				} catch (error) {
					keycloak.logout();
				}
			}
			return keycloak.token;
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