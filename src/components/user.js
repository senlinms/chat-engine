const axios = require('axios');

const Emitter = require('../modules/emitter');

/**
 This is our User class which represents a connected client. User's are automatically created and managed by {@link Chat}s, but you can also instantiate them yourself.
 If a User has been created but has never been authenticated, you will recieve 403s when connecting to their feed or direct Chats.
 @class
 @extends Emitter
 @param uuid
 @param state
 @param chat
 */
class User extends Emitter {

    constructor(chatEngine, uuid, state = {}) {

        super();

        this.chatEngine = chatEngine;

        this.name = 'User';

        /**
         The User's unique identifier, usually a device uuid. This helps ChatEngine identify the user between events. This is public id exposed to the network.
         Check out [the wikipedia page on UUIDs](https://en.wikipedia.org/wiki/Universally_unique_identifier).

         @readonly
         @type String
         */
        this.uuid = uuid;

        /**
         * Gets the user state. See {@link Me#update} for how to assign state values.
         * @return {Object} Returns a generic JSON object containing state information.
         * @example
         *
         * // State
         * let state = user.state;
         */
        this.state = {};

        /**
         * An object containing the Chats this {@link User} is currently in. The key of each item in the object is the {@link Chat.channel} and the value is the {@link Chat} object. Note that for privacy, this map will only contain {@link Chat}s that the client ({@link Me}) is also connected to.
         *
         * @readonly
         * @type Object
         * @example
         *{
                *    "globalChannel": {
                *        channel: "globalChannel",
                *        users: {
                *            //...
                *        },
                *    },
                *    // ...
                * }
         */
        this.chats = {};

        const Chat = require('../components/chat');

        /**
         * Feed is a Chat that only streams things a User does, like
         * 'startTyping' or 'idle' events for example. Anybody can subscribe
         * to a User's feed, but only the User can publish to it. Users will
         * not be able to converse in this channel.
         *
         * @type Chat
         * @example
         * // me
         * me.feed.emit('update', 'I may be away from my computer right now');
         *
         * // another instance
         * them.feed.connect();
         * them.feed.on('update', (payload) => {})
         */

        // grants for these chats are done on auth. Even though they're marked private, they are locked down via the server
        this.feed = new Chat(this.chatEngine, [this.chatEngine.ceConfig.globalChannel, 'user', uuid, 'read.', 'feed'].join('#'), false, false, 'feed');

        /**
         * Direct is a private channel that anybody can publish to but only
         * the user can subscribe to. Great for pushing notifications or
         * inviting to other chats. Users will not be able to communicate
         * with one another inside of this chat. Check out the
         * {@link Chat#invite} method for private chats utilizing
         * {@link User#direct}.
         *
         * @type Chat
         * @example
         * // me
         * me.direct.on('private-message', (payload) -> {
                *     console.log(payload.sender.uuid, 'sent your a direct message');
                * });
         *
         * // another instance
         * them.direct.connect();
         * them.direct.emit('private-message', {secret: 42});
         */
        this.direct = new Chat(this.chatEngine, [this.chatEngine.ceConfig.globalChannel, 'user', uuid, 'write.', 'direct'].join('#'), false, false, 'direct');

        // if the user does not exist at all and we get enough
        // information to build the user
        if (!this.chatEngine.users[uuid]) {
            this.chatEngine.users[uuid] = this;
        }

        // update this user's state in it's created context
        this.assign(state);

    }

    /**
     * @private
     * @param {Object} state The new state for the user
     */
    update(state) {

        let oldState = this.state || {};
        this.state = Object.assign(oldState, state);

        /**
         * Broadcast that a {@link User} has changed state.
         * @event ChatEngine#$"."state
         * @param {Object} data The payload returned by the event
         * @param {User} data.user The {@link User} that changed state
         * @param {Object} data.state The new user state
         * @example
         * ChatEngine.on('$.state', (data) => {
         *     console.log('User has changed state:', data.user, 'new state:', data.state);
         * });
         */

    }

    /**
    this is only called from network updates
    stubbed out as this method is different for Me
     @private
     */
    assign(state) {

        // store a reference of old state
        let oldState = JSON.parse(JSON.stringify(this.state));

        this.update(state);

        /**
        * Fired when a {@link User} updates their state.
        * @event User#$"."state
        * @param {Object} data The payload object
        * @param {User} data.user This {@link User}.
        * @param {Object} data.state The new {@link User} state.
        * @param {Object} data.oldState The previous state before updates.
        */
        this.trigger('$.state', {
            user: this,
            state: this.state,
            oldState
        });

    }

    /**
     adds a chat to this user

     @private
     */
    addChat(chat) {

        // store the chat in this user object
        this.chats[chat.channel] = chat;

        /**
        * Fired when a {@link User} appears in a {@link Chat}
        * @event User#$"."online
        * @param {Object} data The payload object
        * @param {User} data.user This {@link User}.
        * @param {Chat} data.state The {@link Chat} the user was found in.
        */
        this.trigger('$.online', {
            user: this,
            chat
        });

    }

    removeChat(chat) {

        delete this.chats[chat.channel];

        /**
        * Fired when a {@link User} leaves a {@link Chat}
        * @event User#$"."offline
        * @param {User} data.user This {@link User}.
        * @param {Chat} data.state The {@link Chat} the user left.
        */
        this.trigger('$.offline', {
            user: this,
            chat
        });

    }

    /**
    Get stored user state from remote server.
    @private
    */
    _getState(chat, callback) {
        const url = 'https://pubsub.pubnub.com/v1/blocks/sub-key/' + this.chatEngine.pnConfig.subscribeKey + '/state?globalChannel=' + this.chatEngine.ceConfig.globalChannel + '&uuid=' + this.uuid;
        axios.get(url)
            .then((response) => {
                this.assign(response.data);
                callback();
            })
            .catch(() => {
                this.chatEngine.throwError(chat, 'trigger', 'getState', new Error('There was a problem getting state from the PubNub network.'));
            });

    }

}

module.exports = User;
