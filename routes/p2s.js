var potrace = require('potrace'),
    fs = require('fs');

potrace.trace('b.png', {
    color: 'black',
    threshold: 140
}, function (err, svg) {
    if (err) throw err;
    fs.writeFileSync('5.svg', svg);
});