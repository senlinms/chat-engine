const User = require('./user');
const Chat = require('./chat');

/**
 Represents the client connection as a special {@link User} with write permissions.
 Has the ability to update it's state on the network. An instance of
 {@link Me} is returned by the ```ChatEngine.connect()```
 method.

 @class Me
 @param {String} uuid The uuid of this user
 @extends User
 */
class Me extends User {

    constructor(chatEngine, uuid, authData) {

        // call the User constructor
        super(chatEngine, uuid);

        this.name = 'Me';

        this.authData = authData;
        this.chatEngine = chatEngine;

    }

    /**
     * Update {@link Me}'s state in a {@link Chat}. All other {@link User}s
     * will be notified of this change via ```$.state```.
     * Retrieve state at any time with {@link User#state}.
     * @param {Object} state The new state for {@link Me}
     * @param {Chat} chat An instance of the {@link Chat} where state will be updated.
     * Defaults to ```ChatEngine.global```.
     * @fires User#event:$"."state
     * @example
     * // update state
     * me.update({value: true});
     */
    update(state) {

        // run the root update function
        super.update(state);

        // publish the update over the global channel
        this.chatEngine.global.setState(state);

    }

    // assign updates from network
    assign(state) {
      // we call "update" because calling "super.assign"
      // will direct back to "this.update" which creates
      // a loop of network updates
      super.update(state);

    }

    /**
    Stores {@link Chat} within ```Me.chats```.
    @param {Object} chat JSON object representing {@link Chat}. Originally supplied via {@link Chat#objectify}.
    @private
    */
    serverAddChat(chat) {

      // check the chat exists within the global list but is not grouped
      let theChat = this.chatEngine.chats[chat.channel] || new Chat(this.chatEngine, chat.channel, chat.private, false, chat.group);

      /**
      * Fired when another identical instance of {@link ChatEngine} and {@link Me} joins a {@link Chat} that this instance of {@link ChatEngine} is unaware of.
      * Used to synchronize ChatEngine sessions between desktop and mobile, duplicate windows, etc.
      * @event Me#$"."session"."chat"."restore
      */
      this.trigger('$.session.chat.restore', {
          chat: theChat
      });

    }


    /**
    Removes {@link Chat} within Me.chats
    @private
    */
    serverRemoveChat(chat) {

      let targetChat = this.chatEngine.chats[chat.channel];

      // if this is the same client that fired leave(), the chat would already
      // be removed
      if (targetChat) {

          targetChat.leave();

          /**
          * Fired when another identical instance of {@link ChatEngine} and {@link Me} leaves a {@link Chat}.
          * @event Me#$"."session"."chat"."leave
          */
          this.trigger('$.session.chat.leave', {
              chat: targetChat
          });

      }

    }


    }

    module.exports = Me;
