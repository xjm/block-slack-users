chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		blockedUsers = [];
		alsoBlockTo = true;
		onlyBlockDMs = false;

		var is_dm_window = function(){
			var channel_title_div = document.getElementById("channel_title")
			return channel_title_div == undefined  // DMs do not have a DOM element with this ID
		}

		var in_blocked_users = function(senderId) {
			return Boolean(blockedUsers.indexOf(senderId) > -1);
		}

		var get_id_from_link = function(link) {
			return link.href.substring(link.href.lastIndexOf('/')+1);
		}

		var get_sender_id = function(message){
			// Slack currently uses totally different markup and CSS in the main
			// column versus in the thread sidebar.
			// `.c-message__avatar` is a class on user icons in the main content.
			// `.member_image` is a class on user icons in the sidebar.
			var a=message.querySelectorAll("a.c-message__avatar, a.member_image")[0]
			if (a === undefined){
				var prev = message.previousSibling;
				if (prev === null){
					return "";
				}
				return get_sender_id(prev);
			}
			var user_id = get_id_from_link(a);
			return user_id;
		}

		var has_mention = function(message){
			// Mentions have the class `.c-mrkdwn__member--mention`.
			if (message.querySelectorAll("a.c-mrkdwn__member--mention")[0]) {
				return true;
			}
			// Also check for channel broadcasts and count them as mentions.
			if (message.querySelectorAll("span.c-mrkdwn__broadcast--mention")[0]) {
				return true;
			}
		}

		var get_message_to = (message) => {
			var messageTo = new Array();
			[].forEach.call(
				message.querySelectorAll('a.c-mrkdwn__member'),
				(value) => {
					messageTo.push(get_id_from_link(value));
				});
			return messageTo;
		}

		var should_hide_message = function(message){
			var senderId = get_sender_id(message);
			if (in_blocked_users(senderId)) {
				// Don't bother checking the message text if the sender is blocked.
				return true;
			}

			// Don't check for mentions unless the option is enabled.
			if (!alsoBlockTo) {
				return false;
			}

			// Don't hide the message if it also contains a mention.
			// @todo However, we should rewrite the message text to hide the blocked
			// user's name.
			if (has_mention(message)) {
				return false;
			}
			// Also hide messages *to* the user unless the message has a mention.
			var toUsers = get_message_to(message);
			var toBlockedUsers = toUsers.filter(function(to_user_id) {
				return in_blocked_users(to_user_id);
			});
			if (toBlockedUsers.length > 0) {
				return true;
			}
		}

		var hide_message = function(message){
			message.style.display = "none";
		}

		var hide_mention = (message) => {
			// Hide any mention of the user within shown messages, as well as their
			// avatar in thread summaries within shown messages.
			[].forEach.call(
				message.querySelectorAll('a.c-mrkdwn__member, a.c-avatar'),
				(value) => {
					if (in_blocked_users(get_id_from_link(value))) {
						hide_message(value);
					}
			});
		}
		var handle_message = function(message){
			if (should_hide_message(message)){
				hide_message(message)
			}

			// Don't check for mentions unless the option is enabled.
			if (!alsoBlockTo) {
				return false;
			}
			hide_mention(message);
		}

		var handle_history = function(){
			// Slack currently uses totally different markup and CSS in the main
			// column versus in the thread sidebar.
			// div.c-virtual_list__item is the main content area.
			// ts-message.message_container_item is the sidebar.
			messages = document.querySelectorAll("div.c-virtual_list__item, ts-message.message_container_item")
			for (i=0; i<messages.length; i++){
				handle_message(messages[i])
			}
		}

		message_div = document.getElementById("messages_container") // Parent div that contains messages
		// Wrapper that contains threads in the side panel.
		thread_div = document.getElementById("convo_container");

		chrome.storage.sync.get({
			blockedUsers: "",
			alsoBlockTo: true,
			onlyBlockDMs: false,
		}, function(items) {
			blockedUsers = items.blockedUsers.split(',');
			alsoBlockTo = items.alsoBlockTo;
			onlyBlockDMs = items.onlyBlockDMs;

			handle_history();

			// Add function to be called every time a new node is inserted in message_div
			message_div.addEventListener('DOMNodeInserted', function(event){
				if (onlyBlockDMs && !is_dm_window()) {
					return
				}

				event_target = event.target;

				// Handle new incoming messages
				if (event_target.classList.contains("c-virtual_list__item")){
					handle_message(event_target)
				}

				// Handle message history loading
				else if (event_target.classList.contains("c-virtual_list")){
					handle_history();
				}

			});
			thread_div.addEventListener('DOMNodeInserted', function(event){
				event_target = event.target;
				handle_history();
			});
		});
	}
	}, 10);
});

// vim: set noexpandtab:
