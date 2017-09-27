const assert = require('chai').assert;
const Bootstrap = require('../../../src/bootstrap');
const Chat = require('../../../src/components/chat');

let instance = null;

describe('#chat', () => {
    it('should be instanced', (done) => {
        let ce = Bootstrap({ globalChannel: 'common', insecure: true }, { publishKey: 'demo', subscribeKey: 'demo' });

        ce.connect();

        instance = new Chat(ce);
        assert.isObject(instance, 'was successfully created');
        done();
    });

    it('should be emit a message', (done) => {
        instance.on('foo', (msg) => {
            assert(msg === 'hello world', 'got the expected value');
            done();
        });

        instance.emit('foo', 'hello');
    });
});
