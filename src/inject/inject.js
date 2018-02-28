chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		blockedUsers = [];
		alsoBlockTo = true;
		onlyBlockDMs = false;
		enableExtension = false;

		var is_dm_window = function(){
			var channel_title_div = $('#channel_title')[0]
			return channel_title_div == undefined  // DMs do not have a DOM element with this ID
		}

		var get_sender_id = function(message){
			var a=$(message).find("a.c-message__avatar")[0]
			if (a === undefined){
				var prev = message.previousSibling;
				if (prev === null){
					return "";
				}
				return get_sender_id(prev);
			}
			var user_id = a.href.substring(a.href.lastIndexOf('/')+1);
			return user_id;
		}

    var has_mention = function(message){
      // Mentions have the class `.c-mrkdwn__member--mention`.
			if ($(message).find("a.c-mrkdwn__member--mention")[0]) {
        return true;
      }
      // Also check for channel broadcasts and count them as mentions.
			if ($(message).find("span.c-mrkdwn__broadcast--mention")[0]) {
        return true;
      }
    }

	  var get_message_to = function(message){
      var messageTo = new Array();
      $.each($(message).find('a.c-mrkdwn__member'), (index, value) => {
	      messageTo.push((value.href.substring(value.href.lastIndexOf('/')+1)));
      });
      return messageTo;
	  }

		var should_hide_message = function(message){
			var senderId = get_sender_id(message);
			if (Boolean(blockedUsers.indexOf(senderId) > -1)) {
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
      var toBlockedUsers = toUsers.filter(function(n) {
        return blockedUsers.indexOf(n) > -1;
      });
      if (toBlockedUsers.length > 0) {
        return true;
      }
		}

		var hide_message = function(message){
			message.style.display = "none";
		}

		var handle_message = function(message){
			if (should_hide_message(message)){
				hide_message(message)
			}
		}

		var handle_history = function(){
			messages = $("div.c-virtual_list__item")
			for (i=0; i<messages.length; i++){
				handle_message(messages[i])
			}
		}

		message_div = $('#messages_container') // Parent div that contains messages

		chrome.storage.sync.get({
			blockedUsers: "",
			alsoBlockTo: true,
			onlyBlockDMs: false,
			enableExtension: true
		}, function(items) {
			blockedUsers = items.blockedUsers.split(',');
			alsoBlockTo = items.alsoBlockTo;
			onlyBlockDMs = items.onlyBlockDMs;
			enableExtension = items.enableExtension;

			if (enableExtension == false){
				return
			}

			handle_history();

			// Add function to be called everytime a new node is inserted in message_div
			message_div.bind('DOMNodeInserted', function(event){
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

			})
		});
	}
	}, 10);
});

// vim: set noexpandtab:
