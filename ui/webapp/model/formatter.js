sap.ui.define([
	"sap/base/strings/formatMessage"
], function (formatMessage) {
	"use strict";

	return {
		formatMessage: formatMessage,
		srcImageValue : function (bIsPhone, sImagePath) {
			if (bIsPhone) {
				sImagePath += "_small";
			}
			return sImagePath + ".jpg";
		}
	};
});