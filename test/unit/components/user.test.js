const assert = require('chai').assert;
const Bootstrap = require('../../../src/bootstrap');
const User = require('../../../src/components/user');

let instance = null;

describe('#user', () => {
    it('should be instanced', (done) => {
        instance = new User(Bootstrap({ globalChannel: 'common', insecure: true }, { publishKey: 'demo', subscribeKey: 'demo' }), '123456');
        assert.isObject(instance, 'was successfully created');
        done();
    });

    it('should be updated the state', (done) => {
        instance.update({ typing: true });
        assert(instance.state.typing, 'got the expected value');
        done();
    });
});
