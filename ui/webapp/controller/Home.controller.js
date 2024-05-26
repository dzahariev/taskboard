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
			this.getView().setModel(this.taskModel, "tasks");
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

		create: async function () {
			const token = await this.getOwnerComponent().getToken();
			const url = '/api/task'
			if (!this.oCreateDialog) {
				this.oCreateDialog = new sap.m.Dialog({
					title: "Create new Task",
					content: [
						new sap.m.Label({text:"Task Kind:"}),
						new sap.m.ComboBox({
							selectedKey: "handbrake",
							items: [
								new sap.ui.core.Item({key: "handbrake", text: "handbrake"}), 
								new sap.ui.core.Item({key: "backup", text: "backup"})
							], 
							id: "KIND_COMBOBOX"
						}),
						new sap.m.Label({text:"From:"}),
						new sap.m.Input({maxLength: 150, id: "FROM_INPUT"}),
						new sap.m.Label({text:"To:"}),
						new sap.m.Input({maxLength: 150, id: "TO_INPUT"}),
						new sap.m.Label({text:"Additional property:"}),
						new sap.m.Input({maxLength: 50, id: "ADDITIONAL_INPUT"})
					],
					beginButton: new sap.m.Button({
						type: ButtonType.Emphasized,
						text: "Create",
						press: function () {
							const kindFieldValue = sap.ui.getCore().byId("KIND_COMBOBOX").getSelectedItem().getText();
							const fromFieldValue = sap.ui.getCore().byId("FROM_INPUT").getValue();
							const toFieldValue = sap.ui.getCore().byId("TO_INPUT").getValue();
							const additionalFieldValue = sap.ui.getCore().byId("ADDITIONAL_INPUT").getValue();
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
											"additional": additionalFieldValue
										}
								 }),
								beforeSend: function (xhr) {
									xhr.setRequestHeader('Authorization', `Bearer ${token}`);
								},
								async:false
							});
							this.oCreateDialog.close();
							this.loadData();	
						}.bind(this)
					}),
					endButton: new sap.m.Button({
						text: "Close",
						press: function () {
							this.oCreateDialog.close();
						}.bind(this)
					})
				});

				// to get access to the controller's model
				this.getView().addDependent(this.oCreateDialog);
			}

			this.oCreateDialog.open();
		},

		delete: async function (oEvent) {
			const task = oEvent.getSource().getBindingContext("tasks").getObject();
			const token = await this.getOwnerComponent().getToken();
			const url = '/api/task/'+ task.id
			MessageBox.confirm("Delete " + task.id + "?", {
				actions: [MessageBox.Action.CANCEL, "Delete"],
				emphasizedAction: MessageBox.Action.CANCEL,
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