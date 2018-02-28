// Saves options to chrome.storage
function save_options() {
	var blockedUsers = document.getElementById('inputUsers').value.replace(/\s/g,'');
	var alsoBlockTo = document.getElementById('alsoBlockTo').checked;
	var onlyBlockDMs = document.getElementById('onlyBlockDMs').checked;
	var enableExtension = document.getElementById('enableExtension').checked;

	chrome.storage.sync.set({
		blockedUsers: blockedUsers,
		alsoBlockTo: alsoBlockTo,
		onlyBlockDMs: onlyBlockDMs,
		enableExtension: enableExtension
	}, function() {
		alert("Configuration Saved. Please refresh your slack websites for the configuration to take effect.")
	});
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
	chrome.storage.sync.get({
		blockedUsers: "",
		alsoBlockTo: true,
		onlyBlockDMs: false,
		enableExtension: true
	}, function(items) {
		document.getElementById('inputUsers').value = items.blockedUsers;
		document.getElementById('alsoBlockTo').checked = items.alsoBlockTo;
		document.getElementById('onlyBlockDMs').checked = items.onlyBlockDMs;
		document.getElementById('enableExtension').checked = items.enableExtension;
	});
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
