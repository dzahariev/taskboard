sap.ui.define([
	'./BaseController',
	'sap/m/ActionSheet',
	'sap/m/Button',
	'sap/m/MessageToast',
	'sap/ui/Device',
	'sap/ui/core/syncStyleClass',
	'sap/m/library',
	"sap/ui/model/json/JSONModel",
	'../libs/keycloak-js/dist/keycloak'
], function (
	BaseController,
	ActionSheet,
	Button,
	MessageToast,
	Device,
	syncStyleClass,
	mobileLibrary,
	JSONModel,
	keycloakLibrary
) {
	"use strict";

	// shortcut for sap.m.ButtonType
	var ButtonType = mobileLibrary.ButtonType;

	return BaseController.extend("com.zahariev.taskboard.controller.App", {


		_bExpanded: true,

		onInit: function () {
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

			// if the app starts on desktop devices with small or medium screen size, collaps the side navigation
			if (Device.resize.width <= 1024) {
				this.onSideNavButtonPress();
			}

			Device.media.attachHandler(this._handleWindowResize, this);
			this.getRouter().attachRouteMatched(this.onRouteChange.bind(this));
			this.getRouter().navTo("home")
		},
		
		logOut: function () {
			const authModel = this.getModel("authModel")
			const keycloak = authModel.getProperty("/keycloak");
			authModel.setProperty("/keycloak", null);
			authModel.setProperty("/username", "Unknown");
			if(keycloak){
				keycloak.logout();
			}
		},

		goToUserProfile: function () {
			const authModel = this.getModel("authModel")
			const keycloak = authModel.getProperty("/keycloak");
			keycloak.accountManagement();
		},

		onExit: function () {
			Device.media.detachHandler(this._handleWindowResize, this);
		},

		onRouteChange: function (oEvent) {
			const selectedPageKey = oEvent.getParameter('name')
			this.getModel('side').setProperty('/selectedKey', selectedPageKey);

			if (Device.system.phone) {
				this.onSideNavButtonPress();
			}
			sap.ui.getCore().getEventBus().publish("taskboard", "RouteChanged", { selectedPageKey });
		},

		onUserNamePress: function (oEvent) {
			var oSource = oEvent.getSource();
			this.getModel("i18n").getResourceBundle().then(function (oBundle) {
				// close message popover
				var oMessagePopover = this.byId("errorMessagePopover");
				if (oMessagePopover && oMessagePopover.isOpen()) {
					oMessagePopover.destroy();
				}
				var fnHandleUserMenuItemPress = function (oEvent) {
					this.getBundleText("clickHandlerMessage", [oEvent.getSource().getText()]).then(function (sClickHandlerMessage) {
						MessageToast.show(sClickHandlerMessage);
					});
				}.bind(this);
				var fnHandleUserMenuLogoutPress = function (oEvent) {
					this.logOut()
				}.bind(this);
				var fnHandleUserMenuProfilePress = function (oEvent) {
					this.goToUserProfile()
				}.bind(this);

				var oActionSheet = new ActionSheet(this.getView().createId("userMessageActionSheet"), {
					title: oBundle.getText("userHeaderTitle"),
					showCancelButton: false,
					buttons: [
						new Button({
							text: '{i18n>userAccountUserSettings}',
							type: ButtonType.Transparent,
							press: fnHandleUserMenuProfilePress
						}),
						new Button({
							text: '{i18n>userAccountLogout}',
							type: ButtonType.Transparent,
							press: fnHandleUserMenuLogoutPress
						})
					],
					afterClose: function () {
						oActionSheet.destroy();
					}
				});
				this.getView().addDependent(oActionSheet);
				// forward compact/cozy style into dialog
				syncStyleClass(this.getView().getController().getOwnerComponent().getContentDensityClass(), this.getView(), oActionSheet);
				oActionSheet.openBy(oSource);
			}.bind(this));
		},

		onSideNavButtonPress: function () {
			var oToolPage = this.byId("app");
			var bSideExpanded = oToolPage.getSideExpanded();
			this._setToggleButtonTooltip(bSideExpanded);
			oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
		},

		_setToggleButtonTooltip: function (bSideExpanded) {
			var oToggleButton = this.byId('sideNavigationToggleButton');
			this.getBundleText(bSideExpanded ? "expandMenuButtonText" : "collpaseMenuButtonText").then(function (sTooltipText) {
				oToggleButton.setTooltip(sTooltipText);
			});
		},

		getBundleText: function (sI18nKey, aPlaceholderValues) {
			var i18nModel = this.getModel("i18n")
			if(!i18nModel){
				i18nModel = this.getOwnerComponent().getModel("i18n")
			} 
			return this.getBundleTextByModel(sI18nKey, i18nModel, aPlaceholderValues);
		},

		_handleWindowResize: function (oDevice) {
			if ((oDevice.name === "Tablet" && this._bExpanded) || oDevice.name === "Desktop") {
				this.onSideNavButtonPress();
				this._bExpanded = (oDevice.name === "Desktop");
			}
		}

	});
});