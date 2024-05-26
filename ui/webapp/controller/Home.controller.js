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

			// Define task model
			this.taskModel = new JSONModel({
				tasks: [],
			})
			this.taskModel.setSizeLimit(Number.MAX_VALUE);
			this.setModel(this.taskModel, "tasks");
			this.loadData()

			this.oView = this.getView();
			this.oView.setModel(this.taskModel, "tasks");
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

		propertiesAsJSON: function(anyData) {
			return JSON.stringify(anyData, null, 2)
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
			if (anyData.toUpperCase() === "backup".toUpperCase()) {
				return "sap-icon://synchronize"
			} 
			if (anyData.toUpperCase() === "handbrake".toUpperCase()) {
				return "sap-icon://video"
			} 
			return "sap-icon://action-settings"
		},

		closeDialog: function () {
			this.oDialog.close();
		},

		onSave: async function () {
			const token = await this.getOwnerComponent().getToken();
			const url = '/api/task'

			const kindFieldValue = this.oView.byId("KIND_COMBOBOX").getSelectedItem().getKey();
			const fromFieldValue = this.oView.byId("FROM_INPUT").getValue();
			const toFieldValue = this.oView.byId("TO_INPUT").getValue();
			const presetFieldValue = this.oView.byId("PRESET_COMBOBOX").getSelectedItem().getKey();
			jQuery.ajax({
				url: url,
				type: "POST",
				contentType: 'application/json',
				data: JSON.stringify({
						"status": "new",
						"progress": "0",
						"kind": kindFieldValue,
						"properties": {
							"from": fromFieldValue, 
							"to": toFieldValue, 
							"preset": presetFieldValue
						}
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

		delete: async function (oEvent) {
			const task = oEvent.getSource().getBindingContext("tasks").getObject();
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

		loadData: async function () {
			const taskModel = this.getModel("tasks")
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
	
			taskModel.setProperty("/tasks", strResponse.data);
			this.getView().getModel("tasks").refresh(true);
		}
	});
});