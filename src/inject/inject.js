chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		blockedUsers = [];
		onlyBlockDMs = false;
		enableExtension = false;

		var is_dm_window = function(){
			var channel_title_div = document.getElementById("channel_title")
			return channel_title_div == undefined  // DMs do not have a DOM element with this ID
		}

		var get_sender_id = function(message){
			var a=message.querySelectorAll("a.c-message__avatar")[0]
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

    // @todo This is incomplete.
/*		var get_message_to = function(message){
			var messageTo=$(message).find("a.c-mrkdwn__member");
			if (messageTo[0] === undefined) {
        return;
				var prev = message.previousSibling;
				if (prev === null){
					return "";
				}
				return get_sender_id(prev);

			}

      console.log("Hi");
			for (i=0; i < messageTo.length; i++) {
        console.log(messageTo[i]);
        userIds.push(messageTo[i].href.substring(messageTo[i].href.lastIndexOf('/')+1));
      };

      userIds = new Array();
      messageTo.forEach(function(element) {
      });

		}*/

		var should_hide_message = function(message){
			var senderId = get_sender_id(message);
			if (Boolean(blockedUsers.indexOf(senderId) > -1)) {
        // Don't bother checking the message text if the sender is blocked.
        return true;
      }
      // Don't hide the message if it also contains a mention.
      // @todo However, we should rewrite the message text to hide the blocked
      // user's name.
      if (has_mention(message)) {
        return false;
      }
      // Also hide messages *to* the user unless the message has a mention.
      // @todo Finish this.
//      get_message_to(message);
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
			messages = document.querySelectorAll("div.c-virtual_list__item")
			for (i=0; i<messages.length; i++){
				handle_message(messages[i])
			}
		}

		message_div = document.getElementById("messages_container") // Parent div that contains messages

		chrome.storage.sync.get({
			blockedUsers: "",
			onlyBlockDMs: false,
			enableExtension: true
		}, function(items) {
			blockedUsers = items.blockedUsers.split(',');
			onlyBlockDMs = items.onlyBlockDMs;
			enableExtension = items.enableExtension;

			if (enableExtension == false){
				return
			}

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

			})
		});
	}
	}, 10);
});

// vim: set noexpandtab:
