sap.ui.define([
	'./BaseController',
	'sap/ui/model/json/JSONModel',
	'sap/ui/Device',
	'com/zahariev/taskboard/model/formatter'
], function (BaseController, JSONModel, Device, formatter) {
	"use strict";
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
				tasks: null,
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

		create: async function () {
			alert("Create New")
		},

		delete: async function (oEvent) {
			const task = oEvent
					.getSource()
					.getBindingContext("tasks")
					.getObject();
			alert("Delete " + task.id)
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