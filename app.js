const multer = require("multer");
const upload = multer({ dest: "uploads/" });
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');

let fontRouter = require('./routes/font')
const bodyParser = require('body-parser')
var app = express();

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
app.use('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://zi.tools");
    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
    res.header("Access-Control-Allow-Methods", "POST,GET");
    res.header("X-Powered-By", ' 3.2.1');
    if (req.method == "OPTIONS") res.send(200); /*让options请求快速返回*/
    else next();
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', fontRouter);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// app.use('/upload', multipartMiddleware, (req, res) => {
//     // let formData = req.body;
//     // console.log('form data', formData);
//     // console.log(req.files);
//     console.log(typeof(req.files.filepond.path));
//     var potrace = require('potrace'),
//         fs = require('fs');

//     potrace.trace(req.files.filepond.path, {
//         color: 'black',
//         threshold: 140
//     }, function (err, svg) {
//         if (err) throw err;
//         fs.writeFileSync('test.svg', svg);
//     });
//     res.status(200).send('successf');

// });
app.use(express.static(path.join(__dirname, 'src')));
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;