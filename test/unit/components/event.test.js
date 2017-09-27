const assert = require('chai').assert;
const Bootstrap = require('../../../src/bootstrap');
const Event = require('../../../src/components/event');
const Chat = require('../../../src/components/chat');

let instance = null;
let ce = Bootstrap({ globalChannel: 'common', insecure: true }, { publishKey: 'demo', subscribeKey: 'demo' });
let chat = new Chat(ce);

ce.connect();

describe('#event', () => {
    it('should be instanced', (done) => {
        instance = new Event(ce, chat);
        assert.isObject(instance, 'was successfully created');
        done();
    });

    it('should be emit a message', (done) => {
        chat.on('$.publish.success', () => {
            done();
        });

        instance.publish({ m: 'hello world' });
    });
});
