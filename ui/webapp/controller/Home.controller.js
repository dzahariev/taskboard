sap.ui.define([
	'./BaseController',
	'sap/ui/model/json/JSONModel',
	'sap/ui/Device',
	"sap/m/MessageBox",
	"sap/m/library",
	'com/zahariev/taskboard/model/formatter'
], function (BaseController, JSONModel, Device, MessageBox, mobileLibrary, formatter) {
	"use strict";

	// shortcut for sap.m.ButtonType
	var ButtonType = mobileLibrary.ButtonType;

	return BaseController.extend("com.zahariev.taskboard.controller.Home", {
		formatter: formatter,

		onInit: function () {
			// Subscribe on events
			this.events = {
				RouteChanged: this.handleRouteChanged,
			};

			Object.keys(this.events).forEach(eventName => {
				sap.ui.getCore().getEventBus().subscribe("taskboard", eventName, this.events[eventName], this);
			});

			// Define device model
			var oViewModel = new JSONModel({
				isPhone : Device.system.phone
			});
			this.setModel(oViewModel, "view");
			Device.media.attachHandler(function (oDevice) {
				this.getModel("view").setProperty("/isPhone", oDevice.name === "Phone");
			}.bind(this));

			// Define configuration model
			this.oModel = new JSONModel({
				kinds: [],
				tasks: [],
			})
			this.oModel.setSizeLimit(Number.MAX_VALUE);
			this.setModel(this.oModel);
			this.loadConfiguration()

			this.oView = this.getView();
			this.oView.setModel(this.oModel);
		},

		onExit: function() {
			Object.keys(this.events).forEach(eventName => {
				sap.ui.getCore().getEventBus().unsubscribe("taskboard", eventName, this.events[eventName], this);
			});
		},

		handleRouteChanged: function(channel, eventId, pageData) {
			if (pageData.selectedPageKey === "home"){
				this.loadData()
			}
		},

		statusIcon: function(anyData) {
			if (anyData.toUpperCase() === "new".toUpperCase()) {
				return "sap-icon://create"
			} 
			if (anyData.toUpperCase() === "working".toUpperCase()) {
				return "sap-icon://physical-activity"
			} 
			if (anyData.toUpperCase() === "done".toUpperCase()) {
				return "sap-icon://complete"
			} 
			return "sap-icon://product"
		},

		kindIcon: function(anyData) {
			if (anyData.toUpperCase() === "handbrake".toUpperCase()) {
				return "sap-icon://video"
			} 
			if (anyData.toUpperCase() === "download".toUpperCase()) {
				return "sap-icon://download"
			} 
			if (anyData.toUpperCase() === "backup".toUpperCase()) {
				return "sap-icon://synchronize"
			} 
			return "sap-icon://action-settings"
		},

		presetText: function(kind, presetKey) {
			const oModel = this.getModel()
			const kinds = oModel.getProperty("/kinds");
			var result = "N/A"

			kinds.forEach((currentKind) => {
				if (kind.toUpperCase() === currentKind.name.toUpperCase()) {
					currentKind.presets.forEach((currentPreset) => {
						if (presetKey.toUpperCase() === currentPreset.key.toUpperCase()) {
							result = currentPreset.name
						}					
					})	
				} 
			});
			return result
		},

		closeDialog: function () {
			this.oDialog.close();
		},

		onSave: async function () {
			const kindFieldValue = this.byId("KIND_COMBOBOX").getSelectedKey();
			const sourceFieldValue = this.byId("SOURCE_INPUT").getValue();
			const presetFieldValue = this.byId("PRESET_COMBOBOX").getSelectedKey();
			try {
				await this.getOwnerComponent().apiRequest("POST", "/api/task", {
					"status": "new",
					"progress": "0",
					"kind": kindFieldValue,
					"source" : sourceFieldValue, 
					"preset": presetFieldValue
				});
			} catch (error) {
				MessageBox.error(error.message);
				return;
			}
			this.closeDialog();
			this.loadData();	
		},
		
		createNew: function () {
			if (!this.oCreateDialog) {
				this.oCreateDialog = this.loadFragment({
					name: "com.zahariev.taskboard.view.CreateDialog"
				});
			}

			this.oCreateDialog.then(function (oDialog) {
				this.oDialog = oDialog;
				this.oDialog.open();
			}.bind(this));
		},

		onKindChange: function (oEvent) {
			// Presets are bound relative to the selected kind
			const kindContext = oEvent.getParameter("selectedItem").getBindingContext();
			this.byId("PRESET_COMBOBOX").bindElement(kindContext.getPath());
		}, 

		delete: function (oEvent) {
			const task = oEvent.getSource().getBindingContext().getObject();
			MessageBox.confirm("Delete " + task.id + "?", {
				actions: ["Delete", MessageBox.Action.CANCEL],
				emphasizedAction: "Delete",
				onClose: async function (sAction) {
					if (sAction !== "Delete") {
						return;
					}
					try {
						await this.getOwnerComponent().apiRequest("DELETE", "/api/task/" + task.id);
					} catch (error) {
						MessageBox.error(error.message);
						return;
					}
					this.loadData();
				}.bind(this),
				dependentOn: this.getView()
			});		
		},

		loadConfiguration: async function () {
			const oModel = this.getModel()
			try {
				const response = await this.getOwnerComponent().apiRequest("GET", "/api/configuration");
				oModel.setProperty("/kinds", response.kinds);
			} catch (error) {
				MessageBox.error(error.message);
				return;
			}
			// Re-evaluate formatters (e.g. presetText) that depend on the loaded kinds
			oModel.refresh(true);
		},

		loadData: async function () {
			const oModel = this.getModel()
			try {
				const response = await this.getOwnerComponent().apiRequest("GET", "/api/task");
				oModel.setProperty("/tasks", response.data);
			} catch (error) {
				MessageBox.error(error.message);
				return;
			}
			oModel.refresh(true);
		}
	});
});