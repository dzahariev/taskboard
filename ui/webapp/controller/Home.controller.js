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
			const token = await this.getOwnerComponent().getToken();
			const url = '/api/task'

			const kindFieldValue = this.oView.byId("KIND_COMBOBOX").getSelectedItem().getKey();
			const sourceFieldValue = this.oView.byId("SOURCE_INPUT").getValue();
			const presetFieldValue = this.oView.byId("PRESET_COMBOBOX").getSelectedItem().getKey();
			jQuery.ajax({
				url: url,
				type: "POST",
				contentType: 'application/json',
				data: JSON.stringify({
						"status": "new",
						"progress": "0",
						"kind": kindFieldValue,
						"source" : sourceFieldValue, 
						"preset": presetFieldValue
					}),
				beforeSend: function (xhr) {
					xhr.setRequestHeader('Authorization', `Bearer ${token}`);
				},
				async:false
			});
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
			var bindingContext = oEvent.mParameters.selectedItem.getBindingContext();
			var oModel = oEvent.getSource().getModel();
			var kindData = oModel.getProperty(bindingContext.sPath);
			var selectedKindModel = new JSONModel();
			selectedKindModel.setData(kindData);
			this.oView.byId("PRESET_COMBOBOX").setModel(selectedKindModel, "selectedkind");
		}, 

		delete: async function (oEvent) {
			const task = oEvent.getSource().getBindingContext().getObject();
			const token = await this.getOwnerComponent().getToken();
			const url = '/api/task/'+ task.id
			MessageBox.confirm("Delete " + task.id + "?", {
				actions: ["Delete", MessageBox.Action.CANCEL],
				emphasizedAction: "Delete",
				onClose: function (sAction) {
					if (sAction === "Delete") {
						jQuery.ajax({
							url: url,
							type: "DELETE",
							beforeSend: function (xhr) {
								xhr.setRequestHeader('Authorization', `Bearer ${token}`);
							},
							async:false
						});
						this.loadData();
					}
				}.bind(this),
				dependentOn: this.getView()
			});		
		},

		loadConfiguration: async function () {
			const oModel = this.getModel()
			const token = await this.getOwnerComponent().getToken()
			var strResponse = "";
			jQuery.ajax({
				url: '/api/configuration',
				type: "GET",
				beforeSend: function (xhr) {
					xhr.setRequestHeader('Authorization', `Bearer ${token}`);
				},
				success: function(response) {
					strResponse = response;
				},
				async:false
			});
	
			oModel.setProperty("/kinds", strResponse.kinds);
			this.getView().getModel().refresh(true);
		},

		loadData: async function () {
			const oModel = this.getModel()
			const token = await this.getOwnerComponent().getToken()
			var strResponse = "";
			jQuery.ajax({
				url: '/api/task',
				type: "GET",
				beforeSend: function (xhr) {
					xhr.setRequestHeader('Authorization', `Bearer ${token}`);
				},
				success: function(response) {
					strResponse = response;
				},
				async:false
			});
	
			oModel.setProperty("/tasks", strResponse.data);
			this.getView().getModel().refresh(true);
		}
	});
});