sap.ui.define([
	'./BaseController',
	'sap/m/ActionSheet',
	'sap/m/Button',
	'sap/m/MessageToast',
	'sap/ui/Device',
	'sap/ui/core/syncStyleClass',
	'sap/m/library',
	"sap/ui/model/json/JSONModel"
], function (
	BaseController,
	ActionSheet,
	Button,
	MessageToast,
	Device,
	syncStyleClass,
	mobileLibrary,
	JSONModel
) {
	"use strict";

	// shortcut for sap.m.ButtonType
	var ButtonType = mobileLibrary.ButtonType;

	return BaseController.extend("com.zahariev.taskboard.controller.App", {

		onInit: function () {
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

			// side navigation is expanded on large screens and collapsed on phones and tablets
			this._setSideExpanded(this._isLargeScreen());

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
			const sideModel = this.getModel('side');
			sideModel.dataLoaded().then(function () {
				sideModel.setProperty('/selectedKey', selectedPageKey);
				// SideNavigation only resolves the key against items that already exist, so apply it once they are created
				this.byId("sideNavigation").setSelectedKey(selectedPageKey);
			}.bind(this));

			// on small screens the menu covers the content, so close it once a page is selected
			if (!this._isLargeScreen()) {
				this._setSideExpanded(false);
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
			this._setSideExpanded(!this.byId("app").getSideExpanded());
		},

		// also covers selecting the current page, which does not trigger a route change
		onSideNavItemSelect: function () {
			if (!this._isLargeScreen()) {
				this._setSideExpanded(false);
			}
		},

		_setSideExpanded: function (bExpanded) {
			this.byId("app").setSideExpanded(bExpanded);
			this._setToggleButtonTooltip(bExpanded);
		},

		// ToolPage always renders the menu collapsed on phones and tablets, so only desktops count as large screens
		_isLargeScreen: function () {
			return Device.system.desktop && Device.media.getCurrentRange(Device.media.RANGESETS.SAP_STANDARD).name === "Desktop";
		},

		_setToggleButtonTooltip: function (bSideExpanded) {
			var oToggleButton = this.byId('sideNavigationToggleButton');
			this.getBundleText(bSideExpanded ? "collpaseMenuButtonText" : "expandMenuButtonText").then(function (sTooltipText) {
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

		_handleWindowResize: function () {
			// only called when the screen crosses a Phone/Tablet/Desktop breakpoint
			this._setSideExpanded(this._isLargeScreen());
		}

	});
});